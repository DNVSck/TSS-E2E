import { TestInfo, expect } from '@playwright/test';
import { BasePage } from '../../page-object/base-page';
import { PortalPage } from '../../page-object/portal-page';
import { DeclarationOverviewPage } from '../../page-object/declaration-overview-page';
import { SupplementaryDeclarationOverviewPage } from '../../page-object/supplementary-declaration-overview-page';
import { SupplementaryDeclarationGoodsRecordPage } from '../../page-object/supplementary-declaration-goods-record-page';
import { DocumentReferenceDeclarePage } from '../../page-object/document-reference-declare-page';
import { AdditionalProcedureCodeDeclarePage } from '../../page-object/additional-procedure-code-declare-page';
import { SupplementaryDeclarationSteps } from '../supplementary-declaration/supplementary-declaration-steps';
import {
    SupplementaryDeclarationData, supplementaryDeclaration,
} from '../../test-data/supplementary-declaration-data';
import { AccessibilityAudit, AccessibilityCheckpoint, checkpointFor } from '../accessibility-audit-flow';
import { documentReference } from '../../test-data/document-reference-data';
import { ADDITIONAL_PROCEDURE_CODES } from '../../constant/additional-procedure-codes-constant';
import {
    isDeclarationStatus, submittedSupplementaryStatusKeys, verifySubmittedWithoutErrors, describeRefusal,
} from '../../helper/declaration-status-helper';
import { LOCAL_REFERENCE } from '../../constant/local-reference-constants';
import { ConsignmentOverviewFlow } from '../consignment/consignment-overview-flow';
import { TFunction, TranslationKey } from '../../fixtures/locale-fixture';
import { UserCredentials } from '../../auth/credentials';
import { reportTestAccount } from '../../helper/report-helper';
import { ReportLog } from '../../core/report/report-log';
import {
    SupplementaryDeclarationService,
} from '../../api-service/trader-api/supplementary-declaration-service';

const SERVICE_SETTLES_TIMEOUT = 300_000;
const STATUS_POLL_INTERVAL = 2_000;
const SETTLED_FOR = 45_000;
const SETTLED_READS = Math.ceil(SETTLED_FOR / STATUS_POLL_INTERVAL);

export interface CompleteSupplementaryDeclarationOptions {
    testInfo: TestInfo;
    url: string;
    movementLrn: string;
    frontierLrn: string;
    overrides?: Partial<SupplementaryDeclarationData>;
    /**
     * What the declaration may settle on, when the method of payment alone does not
     * say. Left out on the paths that have been measured - see
     * submittedSupplementaryStatusKeys.
     */
    expectedStatusKeys?: TranslationKey[];
    audit?: AccessibilityAudit;
}

/**
 * Complete and submit the supplementary declaration raised against a frontier
 * declaration.
 *
 * A supplementary declaration is not created by anyone: the service raises it once the
 * frontier declaration clears, pre-populated from it, and the trader's job is to add
 * what the frontier declaration never captured - what the goods are WORTH. So this
 * flow has no "add" phase at all. It finds the declaration, answers whatever the two
 * wizards still want, pays for it, and submits.
 *
 * The step lists below read as the full journey, but no declaration walks all of it:
 * each screen is answered only if the wizard asks, because what is missing differs
 * from one declaration to the next. See SupplementaryDeclarationSteps.
 */
export class CompleteAndSubmitSupplementaryDeclarationFlow {
    constructor(
        private readonly basePage: BasePage,
        private readonly portalPage: PortalPage,
        private readonly declarationOverviewPage: DeclarationOverviewPage,
        private readonly overviewPage: SupplementaryDeclarationOverviewPage,
        private readonly goodsRecordPage: SupplementaryDeclarationGoodsRecordPage,
        private readonly documentReferencePage: DocumentReferenceDeclarePage,
        private readonly additionalProcedureCodePage: AdditionalProcedureCodeDeclarePage,
        private readonly steps: SupplementaryDeclarationSteps,
        private readonly consignmentOverviewFlow: ConsignmentOverviewFlow,
        // Comparing a status means comparing translated text. The keys arrive from the
        // caller and the page reads what the screen shows, so the verdict here is the
        // one place both have to meet.
        private readonly t: TFunction,
        // The account this worker was assigned by the auth fixture - the same source
        // that picked the replayed session, so the report never names another account.
        private readonly authAccount: UserCredentials | null,
        private readonly supplementaryDeclarationService: SupplementaryDeclarationService,
    ) { }

    /**
     * Returns the supplementary declaration's own reference, so a spec can report or
     * re-find it.
     */
    async completeSupplementaryDeclaration(
        options: CompleteSupplementaryDeclarationOptions
    ): Promise<string> {
        const input = supplementaryDeclaration(options.overrides);
        const reference = await this.declare(options, input);

        await this.submitAndSettle(input, reference, options.expectedStatusKeys);

        return reference;
    }

    async declareSupplementaryDeclaration(
        options: CompleteSupplementaryDeclarationOptions
    ): Promise<string> {
        return this.declare(options, supplementaryDeclaration(options.overrides));
    }

    async openSupplementaryDeclaration(
        options: CompleteSupplementaryDeclarationOptions
    ): Promise<string> {
        return this.openSupplementaryDeclarationFor(options);
    }

    async submitSupplementaryDeclarationExpectingRejection(
        options: CompleteSupplementaryDeclarationOptions
    ): Promise<string> {
        return ReportLog.step('Submit the draft unanswered - expect it to be handed back', async () => {
            const reference = await this.openSupplementaryDeclarationFor(options);

            await this.submitAndSettle(
                supplementaryDeclaration(options.overrides), reference, ['status.traderInputRequired']
            );

            return reference;
        });
    }

    async submitSupplementaryDeclaration(checkpoint?: AccessibilityCheckpoint): Promise<void> {
        await ReportLog.step('Submit the supplementary declaration', async () => {
            const asked = await this.overviewPage.submitAndWaitForPartiesQuestion();

            if (!asked) {
                return;
            }

            // Behind the condition: this screen is only put when the declaration names
            // a party the company is not authorised to act for.
            await checkpoint?.('Supplementary declaration - confirm unauthorised related parties');
            await this.overviewPage.confirmUnauthorisedParties();
            ReportLog.setParameter('Unauthorised related parties', 'confirmed at submission');
        });
    }

    private async declare(
        options: CompleteSupplementaryDeclarationOptions,
        input: SupplementaryDeclarationData
    ): Promise<string> {
        reportTestAccount(this.authAccount, 'completeSupplementaryDeclaration');

        const checkpoint = checkpointFor(options.audit, options.testInfo);

        const reference = await this.openSupplementaryDeclarationFor(options, checkpoint);
        await checkpoint?.('Supplementary declaration - overview (draft)');
        await this.completeConsignmentHeader(input, checkpoint);
        await this.chooseMethodOfPayment(input, checkpoint);
        await this.removeHoldersOfAuthorisation(input);
        await this.completeGoodsRecord(input, options, checkpoint);

        return reference;
    }

    /**
     * Find the declaration raised under this movement, open it, and prove it really is
     * the right one.
     *
     * The proof matters more here than anywhere else in the suite. The importer account
     * on SIT carries hundreds of SD drafts, the suite adds to them on every run, and
     * they are indistinguishable on the list - so "the one the search returned" has to
     * be checked before a single answer is typed into it. It is checked against the
     * FRONTIER declaration rather than the movement that found it, so the reference
     * that proves the match is not the one that produced it.
     */
    private async openSupplementaryDeclarationFor(
        options: CompleteSupplementaryDeclarationOptions,
        checkpoint?: AccessibilityCheckpoint
    ): Promise<string> {
        const { testInfo, url, movementLrn, frontierLrn } = options;

        return ReportLog.step(
            `Find the supplementary declaration raised under ${movementLrn}`,
            async () => {
                await this.basePage.navigateToPortal(url, testInfo);
                await this.portalPage.openDraftDeclarations();
                await checkpoint?.('Portal - draft declarations list');

                const reference = await this.declarationOverviewPage
                    .openSupplementaryDeclarationFor(movementLrn);

                expect(reference, 'Supplementary declaration reference')
                    .toMatch(LOCAL_REFERENCE.SUP_PREFIX);
                expect(
                    await this.overviewPage.getSimplifiedDeclarationReference(),
                    `The frontier declaration this SD was raised from `
                    + `(found under movement ${movementLrn})`
                ).toBe(frontierLrn);

                ReportLog.setParameter('SD LRN', reference);
                return reference;
            }
        );
    }

    /**
     * The consignment-header wizard: means of transport, exporter, delivery terms and
     * invoice currency.
     *
     * Entered through "Start now", which is the only entry that asks the whole wizard.
     *
     * The "Change" links beside each answer were tried first and are a different thing:
     * they are the GOV.UK change-one-answer route, which returns to check-your-answers
     * instead of carrying on. Going in through the method-of-payment link therefore
     * answered that screen, was forced through the vehicle screen because the value
     * there is invalid, and then stopped - leaving the INCOTERM blank on a declaration
     * that looked complete. CDS refused it. Measured on SIT, 2026-08-21.
     *
     * Which is why the payment method is chosen AFTER this, in a step of its own.
     */
    private async completeConsignmentHeader(
        input: SupplementaryDeclarationData,
        checkpoint?: AccessibilityCheckpoint
    ): Promise<void> {
        await ReportLog.step('Complete the consignment details the frontier declaration never took', async () => {
            await this.overviewPage.startHeaderWizard();

            // Only asked when the company profile left it unanswered. Answering it here
            // costs nothing and keeps the wizard moving; the deliberate choice is made
            // afterwards, in chooseMethodOfPayment.
            await this.steps.selectMethodOfPaymentIfAsked(input, checkpoint);

            await this.steps.enterMeansOfTransportDetailsIfAsked(input, checkpoint);
            await this.steps.enterBuyerProfileIfAsked(input, checkpoint);
            await this.steps.enterTransportAndDestinationIfAsked(input, checkpoint);
            await this.steps.enterExporterProfileIfAsked(input, checkpoint);
            await this.steps.enterSellerProfileIfAsked(input, checkpoint);
            await this.steps.enterDeliveryTermsIfAsked(input, checkpoint);

            // Three screens, of which the delivery terms answer selects one or two:
            // knowing the UN/LOCODE takes it outright, not knowing it asks for the
            // country and then the place. Whichever the wizard did not go to is simply
            // not on the page, so both are offered and only one can match.
            await this.steps.selectUnlocodeIfAsked(input, checkpoint);
            await this.steps.selectDeliveryCountryIfAsked(input, checkpoint);
            await this.steps.selectDeliveryPlaceIfAsked(input, checkpoint);

            await this.steps.selectInvoiceCurrencyIfAsked(input, checkpoint);
            await this.steps.completeWizard('consignment', checkpoint);
        });
    }

    /**
     * Say how the duty will be paid.
     *
     * A step of its own, taken once the header is otherwise complete, because this is
     * the fork between the suite's two supplementary declaration routes - the trader's
     * own deferment account, or TSS's. Everything that follows differs because of this
     * answer, so it is worth a line of its own in the report.
     *
     * Reached from the overview's "Change" link, which is a change-one-answer route: it
     * returns to check-your-answers when nothing else is outstanding, and asks for
     * whatever is if something is - hence the conditional confirm.
     */
    private async chooseMethodOfPayment(
        input: SupplementaryDeclarationData,
        checkpoint?: AccessibilityCheckpoint
    ): Promise<void> {
        await ReportLog.step(`Pay the duty by "${input.methodOfPayment}"`, async () => {
            await this.overviewPage.changeMethodOfPayment();
            await this.steps.selectMethodOfPaymentIfAsked(input, checkpoint);
            await this.steps.completeWizardIfOnCheckYourAnswers('method of payment', checkpoint);
        });
    }

    /**
     * Take off the authorisations the chosen payment method makes untrue.
     *
     * Nothing to do on the route that pays from the trader's own account - the
     * declaration arrives describing exactly that. On the TSS route it is the opposite:
     * the trader's guarantee and deferment permissions are still on the declaration and
     * no longer describe how it is being paid.
     *
     * Removal is by type code, never by position: the delete button each record carries
     * is keyed by index, and removing one renumbers the rest.
     */
    private async removeHoldersOfAuthorisation(input: SupplementaryDeclarationData): Promise<void> {
        if (input.holdersOfAuthorisationToRemove.length === 0) {
            return;
        }

        await ReportLog.step(
            'Remove the authorisations that no longer describe how this is paid',
            async () => {
                for (const typeCode of input.holdersOfAuthorisationToRemove) {
                    const removed = await this.overviewPage.removeHolderOfAuthorisation(typeCode);
                    ReportLog.setParameter(
                        `Holder of authorisation ${typeCode}`,
                        removed ? 'removed' : 'not present'
                    );
                }
            }
        );
    }

    /**
     * The goods wizard: origin, weight, and everything the duty is calculated from.
     *
     * One goods record, because an SD raised from a single-item frontier declaration
     * has one. A multi-item declaration would loop here, which is why the record is
     * opened by position rather than by name.
     */
    private async completeGoodsRecord(
        input: SupplementaryDeclarationData,
        options: CompleteSupplementaryDeclarationOptions,
        checkpoint?: AccessibilityCheckpoint
    ): Promise<void> {
        await ReportLog.step('Value the goods so the duty can be calculated', async () => {
            await this.overviewPage.openGoodsRecord();
            await checkpoint?.('Supplementary declaration - goods record');
            await options.audit?.verifyEveryTab({
                testInfo: options.testInfo, record: 'Supplementary declaration goods record',
            });
            await this.auditGoodsRecordWizards(options);
            await this.goodsRecordPage.startGoodsWizard();

            await this.steps.selectAdditionalRiskStatusIfAsked(input, checkpoint);
            await this.steps.selectCountryOfOriginIfAsked(input, checkpoint);
            await this.steps.enterSupplementaryUnitsIfAsked(input, checkpoint);
            await this.steps.enterNetMassIfAsked(input, checkpoint);
            await this.steps.selectNatureOfGoodsIfAsked(input, checkpoint);
            await this.steps.enterPreferenceAndValuationIfAsked(input, checkpoint);
            await this.steps.enterInvoiceDetailsIfAsked(input, checkpoint);
            await this.steps.enterStatisticalValueIfAsked(input, checkpoint);
            await this.steps.completeWizard('goods item', checkpoint);

            await this.removeDocumentReferences(input);
            await this.declareAdditionalProcedureCodes(input);
            await this.declareDocumentReferences(input);

            // The goods wizard ends on the goods record, not on the declaration, and
            // the record has no way forward - only the breadcrumb back.
            await this.goodsRecordPage.goToSupplementaryDeclaration();
        });
    }


    private async auditGoodsRecordWizards(
        options: CompleteSupplementaryDeclarationOptions
    ): Promise<void> {
        const { audit, testInfo } = options;
        const record = 'Supplementary declaration';

        await audit?.verifyWizard({
            testInfo, record, name: 'document reference',
            open: () => this.goodsRecordPage.declareNewDocumentReference(),
            steps: () => this.documentReferencePage.steps(documentReference()),
        });

        await audit?.verifyWizard({
            testInfo, record, name: 'additional procedure code',
            open: () => this.goodsRecordPage.declareNewAdditionalProcedureCode(),
            steps: () => this.additionalProcedureCodePage.steps(
                ADDITIONAL_PROCEDURE_CODES.SPIMM_STANDARD_GOODS_1SG),
        });
    }

    /**
     * Take off the documents the chosen payment method makes untrue.
     *
     * The goods-item half of removeHoldersOfAuthorisation: C506 cites the deferment
     * authorisation and C505 the guarantee, so they come off with the authorisations
     * themselves. Removed BEFORE anything is added, so the additions are never
     * renumbered out from under the removals.
     */
    private async removeDocumentReferences(input: SupplementaryDeclarationData): Promise<void> {
        if (input.documentReferencesToRemove.length === 0) {
            return;
        }

        await ReportLog.step(
            'Remove the documents that no longer describe how this is paid',
            async () => {
                for (const documentCode of input.documentReferencesToRemove) {
                    const removed = await this.goodsRecordPage.removeDocumentReference(documentCode);
                    ReportLog.setParameter(
                        `Document reference ${documentCode}`,
                        removed ? 'removed' : 'not present'
                    );
                }
            }
        );
    }

    /**
     * Additional procedure codes for the goods item, added from the record's own button.
     *
     * Part of the journey rather than an extra: the declaration inherits its procedure
     * code and not the additional one, and CDS refuses the pair - see
     * SupplementaryDeclarationData.additionalProcedureCodes for the message it refuses
     * with.
     */
    private async declareAdditionalProcedureCodes(input: SupplementaryDeclarationData): Promise<void> {
        if (input.additionalProcedureCodes.length === 0) {
            return;
        }

        // Only when the record has none. What a declaration inherits varies, and the
        // codes do not simply accumulate: "000" states that no other code applies, so
        // adding it beside an existing one contradicts that one. See
        // countAdditionalProcedureCodes.
        const alreadyDeclared = await this.goodsRecordPage.countAdditionalProcedureCodes();
        if (alreadyDeclared > 0) {
            return;
        }

        await ReportLog.step('Add the additional procedure codes CDS requires beside the procedure code', async () => {
            for (const [index, code] of input.additionalProcedureCodes.entries()) {
                await ReportLog.step(
                    `Add additional procedure code ${index + 1} of ${input.additionalProcedureCodes.length}: ${code}`,
                    async () => {
                        await this.goodsRecordPage.declareNewAdditionalProcedureCode();
                        verifySubmittedWithoutErrors(await this.additionalProcedureCodePage.declareAdditionalProcedureCode(code), 'the additional procedure code');
                    }
                );
            }
        });
    }

    /**
     * Documents cited by the goods item, added from the record's own button.
     *
     * Not part of the wizard, and not needed by every declaration: which documents must
     * be cited follows the commodity and the procedure. Nothing is added when the data
     * names none, so a journey that needs one says so rather than every journey
     * carrying somebody else's.
     */
    private async declareDocumentReferences(input: SupplementaryDeclarationData): Promise<void> {
        if (input.documentReferences.length === 0) {
            return;
        }

        await ReportLog.step('Cite the documents this goods item needs', async () => {
            for (const [index, documentReference] of input.documentReferences.entries()) {
                await ReportLog.step(
                    `Cite document ${index + 1} of ${input.documentReferences.length}: `
                    + `[${documentReference.documentCode}] ${documentReference.documentReference ?? ''}`,
                    async () => {
                        await this.goodsRecordPage.declareNewDocumentReference();
                        verifySubmittedWithoutErrors(await this.documentReferencePage.declareDocumentReference(documentReference), 'the document reference');
                    }
                );
            }
        });
    }

    /**
     * Submit, then wait for the declaration to settle.
     *
     * The wait is long by this suite's standards because the work behind it is: the
     * declaration goes to CDS to be accepted and then assessed for duty, which took
     * about two minutes on SIT. On the way the status reads "Processing" - a real
     * intermediate state, not a failure, so nothing asserts on it.
     *
     * More than one status counts as settled; the reason lives in
     * submittedSupplementaryStatusKeys, with the race that causes it.
     *
     * When nothing arrives, the reason is on the page rather than in the timeout: a
     * rejected declaration carries the CDS error behind the details toggle, and
     * reporting that is the difference between "the status never changed" and
     * "CDS12125: the deferment account is not usable".
     */
    /**
     * Follow the declaration through the service until its status holds for SETTLED_FOR,
     * and answer with every status it held on the way and the second each arrived on.
     *
     * The path is answered whatever happens - it is the only record of what the
     * declaration went THROUGH, and the screen shows one status at a time.
     */
    private async waitForServiceToSettle(reference: string): Promise<string[]> {
        const seen: { status: string; at: number }[] = [];
        const startedAt = Date.now();
        let unchanged = 0;

        await expect.poll(async () => {
            const status = await this.supplementaryDeclarationService.readStatus(reference);

            if (status === seen.at(-1)?.status) {
                unchanged += 1;
            } else {
                seen.push({ status, at: Date.now() - startedAt });
                unchanged = 0;
            }

            return unchanged;
        }, {
            timeout: SERVICE_SETTLES_TIMEOUT,
            intervals: [STATUS_POLL_INTERVAL],
            message: `Supplementary declaration ${reference} was still changing status after `
                + `${SERVICE_SETTLES_TIMEOUT / 1_000}s - it went `
                + `${seen.map(step => step.status).join(' -> ')}`,
        }).toBeGreaterThanOrEqual(SETTLED_READS);

        return seen.map(step => `${step.status} (${Math.round(step.at / 1_000)}s)`);
    }

    private async submitAndSettle(
        input: SupplementaryDeclarationData,
        reference: string,
        expectedStatusKeys?: TranslationKey[]
    ): Promise<void> {
        const expected = expectedStatusKeys ?? submittedSupplementaryStatusKeys(input.methodOfPayment);

        await this.submitSupplementaryDeclaration();

        await ReportLog.step(
            'Wait for the service and CDS to settle the declaration, and check where it landed',
            async () => {
                try {
                    const path = await this.waitForServiceToSettle(reference);
                    const settled = path.at(-1) ?? '';

                    ReportLog.setParameter('SD statuses', path.join(' -> '));

                    const shown = await this.overviewPage.readStatus();
                    ReportLog.setParameter('SD status', shown || 'not shown');

                    expect(shown,
                        `Supplementary declaration status on screen - an empty one means the `
                        + `row never rendered, and the service says the declaration is in `
                        + `"${settled}"`)
                        .not.toBe('');

                    const allowed = expected.map(key => this.t(key));

                    expect(allowed.some(status => isDeclarationStatus(shown, status)),
                        `Supplementary declaration status on screen - "${shown}" should be one `
                        + `of ${allowed.join(', ')} (the service went ${path.join(' -> ')})`)
                        .toBe(true);
                } catch (error) {
                    const reasons = await this.overviewPage.readValidationErrors();
                    if (reasons.length > 0) {
                        const refusal = await this.consignmentOverviewFlow.attachRefusal(
                            'Supplementary declaration', { by: 'CDS', reasons }, this.overviewPage
                        );
                        ReportLog.setParameter('Rejected by', refusal.reasons.join(' | '));
                        throw new Error(
                            `The supplementary declaration did not settle${describeRefusal(refusal)}`,
                            { cause: error }
                        );
                    }
                    throw error;
                }
            }
        );
    }
}
