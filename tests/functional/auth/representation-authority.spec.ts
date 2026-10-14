import {
    COMPANY_PROFILE, isProfileConfigured, companyIdOf, profileMissingReason, lockWhenSingleAccount,
} from '../../../src/auth/credentials';
import {
    BASE_URL, IMPORTER_COMPANY_NAME, HAULIER_COMPANY_NAME, IS_ISC2_MOCK,
} from '../../../config/environment';
import { importerUkimsDocument } from '../../../src/test-data/document-reference-data';
import { REPRESENTATION_TYPE } from '../../../src/constant/representation-type-constant';
import { sfdStandaloneGoodsItem } from '../../../src/test-data/sfd-standalone-goods-item-data';
import { ReportLog } from '../../../src/core/report/report-log';
import { CONTAINER_SIZE } from '../../../src/constant/container-size-constant';
import { CONTAINER_PACKED_STATUS } from '../../../src/constant/container-packed-status-constant';
import { CONTAINER_SUPPLIER_TYPE } from '../../../src/constant/container-supplier-type-constant';
import { generateRandomContainerIdentifierNumber } from '../../../src/helper/data-generate-helper';
import {
    ensOnlyDeclaration, ensSfdDeclaration, ensImmiDeclaration,
} from '../../../src/test-data/ens-declaration-data';
import {
    rejectedByIcs2, rejectedByCds, immiRejectedByCds,
    IMMI_STANDALONE_REFUSED_PROCEDURE_CODE, rejectedImmiStandaloneForImporter, rejectedSfdStandaloneForImporter,
} from '../../../src/test-data/rejection-lever-data';
import {
    ENS_ONLY_AUTHORITY, GENERATED_DECLARATION_AUTHORITY, ENS_EIDR_AUTHORITY, STANDALONE_AUTHORITY,
    MOVEMENT_GMR_AUTHORITY, SUPPLEMENTARY_DECLARATION_AUTHORITY,
    REPRESENTED_HAULIER_AUTHORITY,
} from '../../../src/test-data/authority-matrix';
import {
    IMMI_EIDR_DECLARATION_TABS, GMR_TABS, MOVEMENT_TABS, SUPPLEMENTARY_DECLARATION_TABS,
} from '../../../src/constant/record-tab-constant';
import { MOVEMENT_ACTION } from '../../../src/constant/movement-action-constant';
import { CONSIGNMENT_ACTION } from '../../../src/constant/consignment-action-constant';
import { ROUTE_ID_CONSTANT } from '../../../src/constant/routeId-constant';
import { gmrData } from '../../../src/test-data/gmr-data';
import {
    GMR_MOVEMENT, eidrGmrJourney, sfdGmrJourney, withHaulierAsCarrier,
} from '../../../src/test-data/gmr-journey-data';
import { haulierAsCarrier } from '../../../src/test-data/movements-data';
import { holderOfAuthorisation } from '../../../src/test-data/holder-of-authorisation-data';
import { AUTHORISATION_TYPE_CODE } from '../../../src/constant/authorisation-type-code-constant';
import { checkOnceRepresentationEnds } from '../../../src/flows/authority-check-flow';
import { DECLARATION_STATUS } from '../../../src/constant/trader-api/declaration-status-constant';
import {
    declaredThroughTraderApi, traderDefermentSupplementaryDeclaration,
} from '../../../src/test-data/supplementary-declaration-data';
import { test } from '../../base-test';


test.describe('ENS Integrated declaration authority - Agent declares as itself', () => {
    test.use({ authProfile: COMPANY_PROFILE.AGENT });

    test.beforeEach(async () => {
        await ReportLog.setFeature('Representation authority');
    });

    /**
     * The draft half of the authority question, asked on its own.
     *
     * Split from the rejection test below because the two need different things of the
     * environment: a draft can be raised anywhere, while a rejection can only come from
     * an ICS2 that refuses the movement. Kept together, the half that cannot run on a
     * mocked environment took the half that can down with it - or worse, the test
     * returned early and reported green having measured half of what it names.
     */
    test('Verify that the Agent, the Importer and the Haulier named as carrier are offered the right actions on a draft ENS consignment', { tag: ['@regression', '@auth', '@authorisation'], lock: lockWhenSingleAccount(COMPANY_PROFILE.HAULIER) }, async ({
        declareEnsThroughApiFlow, declarationAccessFlow, checkAuthorityFlow,
    }, testInfo) => {
        test.skip(
            !isProfileConfigured(COMPANY_PROFILE.HAULIER),
            profileMissingReason(COMPANY_PROFILE.HAULIER)
        );
        await ReportLog.setStory('Agent on its own account - what a draft offers');

        const draft = await ReportLog.step('Agent declares an ENS consignment with the Haulier as carrier through the Trader API and leaves it in draft', () =>
            declareEnsThroughApiFlow.declareDraft(haulierAsCarrier(ensOnlyDeclaration(testInfo, rejectedByIcs2())))
        );

        await ReportLog.step('Agent, Importer and Haulier on the draft consignment - check what each is offered', async () => {
            // A draft asks less than a rejection does: the question is only whether a
            // company may submit it, cancel it, and add records to it.
            const draftUrl = await declarationAccessFlow
                .openDeclarationInPortal(BASE_URL, testInfo, draft.consignmentReference);
            const draftRecords = await declarationAccessFlow.locateRecordsAt(draftUrl);

            await checkAuthorityFlow(ENS_ONLY_AUTHORITY.draftConsignment, {
                what: 'the draft consignment',
                records: draftRecords,
                reference: draft.consignmentReference,
                parties: ['agent', 'importer', 'haulier'],
            });

            const draftMovement = await declarationAccessFlow.locateMovementHeader();
            await checkAuthorityFlow(ENS_ONLY_AUTHORITY.draftMovement, {
                what: 'the draft movement header',
                records: draftMovement,
                tabs: MOVEMENT_TABS,
                recordActions: [MOVEMENT_ACTION.CANCEL_DECLARATION],
            });
        });

    });

    test('Verify that the Agent, on its own account, can correct and resubmit its rejected ENS consignment', { tag: ['@regression', '@auth', '@authorisation'] }, async ({
        createDraftEnsDeclarationFlow, consignmentOverviewFlow, movementOverviewFlow,
        declarationAccessFlow, representTraderFlow, checkAuthorityFlow,
    }, testInfo) => {
        // This test starts from a REJECTED consignment, and only ICS2 refusing the
        // movement produces one. A mock ICS2 authorises it instead, so "Trader Input
        // Required" is unreachable and there would be nothing to correct - a red saying
        // nothing about authority. The draft half of the same question is the test
        // above, which is why skipping here costs no coverage.
        test.skip(IS_ISC2_MOCK, 'A mock ICS2 authorises the movement, so no rejection can be produced');

        await ReportLog.setStory('Agent on its own account - reach, reject, correct, resubmit');

        const draft = await ReportLog.step('Agent declares an ENS consignment and leaves it in draft', () =>
            createDraftEnsDeclarationFlow
                .createDraftEnsDeclaration(ensOnlyDeclaration(testInfo, rejectedByIcs2()))
        );

        let rejected: Awaited<ReturnType<typeof declarationAccessFlow.locateEnsConsignmentRecords>> | undefined;

        await ReportLog.step('Agent submits it and ICS2 hands it back - expect Trader Input Required', async () => {
            await declarationAccessFlow.openDeclarationFromSearch(draft.consignmentReference);
            await consignmentOverviewFlow.submitConsignment();
            await movementOverviewFlow.waitForSubmittedMovementOverview();
            await movementOverviewFlow.verifyEnsConsignmentTraderInputRequired();
        });

        // A consignment handed back to the trader is by definition waiting to be edited,
        // so this is the one state where "is a change offered" measures authority rather
        // than state - an accepted consignment offers nothing to anybody.
        // The header first and the consignment second, so the Agent's browser ends up
        // inside the consignment - which is where the correction below starts, and the
        // movement overview has no breadcrumb back down into it.
        await ReportLog.step('Agent and Importer on the rejected consignment - check what each is offered', async () => {
            const rejectedMovement = await declarationAccessFlow.locateMovementHeader();
            await checkAuthorityFlow(ENS_ONLY_AUTHORITY.rejectedMovement, {
                what: 'the movement header of the rejected consignment',
                records: rejectedMovement,
                tabs: MOVEMENT_TABS,
                // Cancel only. recordActions is also what every TAB must offer, and
                // "New consignment" belongs to the first tab alone - the SFD, IMMI and
                // EIDR lists are generated by the service. MOVEMENT_TABS asserts it on
                // the two tabs that do carry it.
                recordActions: [MOVEMENT_ACTION.CANCEL_DECLARATION],
            });

            rejected = await declarationAccessFlow.locateEnsConsignmentRecords();
            await checkAuthorityFlow(ENS_ONLY_AUTHORITY.rejectedConsignment, {
                what: 'the rejected consignment',
                records: rejected,
                parties: ['agent', 'importer'],
            });
        });

        await ReportLog.step('The same account representing the Importer - check representing costs it the ENS', async () => {
            // Representation REPLACES the account it acts for rather than adding to it:
            // while acting for the Importer this browser sees what the Importer sees, and
            // since 2026-10-11 the Importer only reads an ENS - even the one this very
            // account submitted.
            await representTraderFlow.representTrader(IMPORTER_COMPANY_NAME);
            await checkAuthorityFlow(ENS_ONLY_AUTHORITY.rejectedConsignment, {
                what: 'the rejected consignment',
                records: rejected!,
                parties: ['agentAsImporter'],
            });

            // Handed back as itself, because the correction below is the submitter's.
            await representTraderFlow.stopRepresenting();

            // And put back ON the record, so the correction below starts from the
            // consignment rather than wherever the check above left this browser.
            await declarationAccessFlow.openRecord(rejected!.consignment);
        });

        await ReportLog.step('Agent corrects the container and resubmits - expect the service to accept it', async () => {
            // The reads left the Agent's browser on the goods item; the field being
            // corrected lives a level up.
            await consignmentOverviewFlow.goToConsignmentOverview();
            await consignmentOverviewFlow.correctContainerIdentification(
                generateRandomContainerIdentifierNumber(),
                CONTAINER_SIZE.TRAILER,
                CONTAINER_PACKED_STATUS.NOT_EMPTY,
                CONTAINER_SUPPLIER_TYPE.SHIPPER_SUPPLIED
            );
            await consignmentOverviewFlow.submitConsignment();
            await movementOverviewFlow.waitForSubmittedMovementOverview();
            await movementOverviewFlow.verifyEnsConsignmentDetail({ traderInputIsSettled: false });
        });
    });

    /**
     * One rejected SFD, asked twice: as the Agent itself, then representing the Importer.
     *
     * The SUBMITTER rule: the SFD is generated from an ENS this Agent submitted, so the
     * Agent holds Full over it on its own account - representing the importer it was
     * declared FOR neither grants that nor takes it away. Until 2026-09-01 the service
     * answered the other way and this test measured the contrast; now it measures that
     * there is none, which is a different claim and every bit as falsifiable.
     *
     * Both halves still live in ONE test because they are the same record in the same
     * state: splitting them would build a second rejected SFD only to ask the other half
     * of the question. This Agent account holds grants from BOTH companies, so the
     * comparison is the same account, the same browser, the same record, seconds apart -
     * nothing but the representation changed.
     *
     * Then the right is EXERCISED where the rule now puts it: representation is given up
     * first, and the Agent corrects and resubmits as itself. Observing Full and using it
     * are different claims, and the second is the one a trader would notice.
     */
    test('Verify that the Agent that submitted the ENS can correct and resubmit the rejected SFD on its own account', { tag: ['@regression', '@auth', '@authorisation'] }, async ({
        declareEnsThroughApiFlow, consignmentOverviewFlow,
        declarationAccessFlow, representTraderFlow, checkAuthorityFlow,
    }, testInfo) => {
        await ReportLog.setStory('The Agent that submitted the ENS corrects the rejected SFD as itself');

        await ReportLog.step('Agent declares an ENS-SFD and submits it - expect CDS to reject the SFD', async () => {
            const { consignmentReference } = await declareEnsThroughApiFlow
                .declareAndSubmitExpectingRefusal(ensSfdDeclaration(testInfo, rejectedByCds()), 'SFD');

            await declarationAccessFlow.openDeclarationInPortal(BASE_URL, testInfo, consignmentReference);
        });

        const sfd = await declarationAccessFlow.locateSfdConsignmentRecords();
        const sfdCheck = {
            what: 'the rejected SFD',
            records: sfd,
        };

        await ReportLog.step('Agent on its own account - check the submitter is offered every change to the rejected SFD', () =>
            // One party at a time, because the Agent can only represent one company at
            // once - which is the whole point of this test rather than an inconvenience.
            checkAuthorityFlow(GENERATED_DECLARATION_AUTHORITY.rejectedConsignment, {
                ...sfdCheck, parties: ['agent'],
            })
        );

        await ReportLog.step('The same account now representing the Importer - check representing changes nothing', async () => {
            await representTraderFlow.representTrader(IMPORTER_COMPANY_NAME);
            await checkAuthorityFlow(GENERATED_DECLARATION_AUTHORITY.rejectedConsignment, {
                ...sfdCheck, parties: ['agentAsImporter'],
            });
        });

        await ReportLog.step('Agent on its own account corrects the authorisation - expect CDS to accept it', async () => {
            // Representation is given up first, so what follows is the SUBMITTER using its
            // own right rather than the importer's borrowed one. Leaving it on would make
            // this step pass under the old rule as well, and prove nothing about the new.
            await representTraderFlow.stopRepresenting();

            // The reads ended on the goods item; the authorisation record is on a tab of
            // the consignment.
            await declarationAccessFlow.openRecord(sfd.consignment);

            // Name the party the authorisation really belongs to - the importer being
            // declared for - which is exactly what CDS said it did not.
            await consignmentOverviewFlow.correctHolderOfAuthorisation(holderOfAuthorisation());

            // The wizard ends on the record's own tab, where submit is rendered disabled
            await consignmentOverviewFlow.goToConsignmentOverview();
            await consignmentOverviewFlow.submitConsignment();

            await declarationAccessFlow
                .verifyCorrectionAcceptedByCds(sfd.consignment, 'status.awaitingArrival');
        });
    });

    /**
     * The Importer corrects the record CDS actually objected to, and resubmits.
     *
     * The same correction as the test above, made from the Importer's OWN login rather
     * than by an agent representing it - the two ways the service can arrive at Full,
     * asked separately, because only one of them depends on representation working.
     *
     * The correction is also of a different KIND from the one in the ENS test above:
     * there the rejection was a consignment FIELD with its own Change link, here it is a
     * holder-of-authorisation RECORD on a tab, which has no Change link at all - opening
     * the record re-enters the wizard that created it.
     */
    test('Verify that the Importer, on its own login, can correct and resubmit a rejected SFD the Agent declared', { tag: ['@regression', '@auth', '@authorisation'] }, async ({
        declareEnsThroughApiFlow,
        declarationAccessFlow, checkAuthorityFlow,
    }, testInfo) => {
        await ReportLog.setStory('Importer corrects the holder of authorisation and resubmits');

        await ReportLog.step('Agent declares an ENS-SFD and submits it - expect CDS to reject the SFD', async () => {
            const { consignmentReference } = await declareEnsThroughApiFlow
                .declareAndSubmitExpectingRefusal(ensSfdDeclaration(testInfo, rejectedByCds()), 'SFD');

            await declarationAccessFlow.openDeclarationInPortal(BASE_URL, testInfo, consignmentReference);
        });

        const sfd = await declarationAccessFlow.locateSfdConsignmentRecords();

        // Asked on its own login rather than through the Agent, because the rule is
        // about the company and not about a representation. The window is kept: the
        // Importer is about to use what it was just shown.
        const { importer } = await ReportLog.step('Importer on its own login - check what it is offered on the record the Agent declared', () =>
            checkAuthorityFlow(GENERATED_DECLARATION_AUTHORITY.rejectedConsignment, {
                what: 'the rejected SFD',
                records: sfd,
                parties: ['importer'],
                keepOpen: ['importer'],
            })
        );

        await ReportLog.step('Importer corrects the authorisation on its own login - expect CDS to accept it', async () => {
            // The reads ended on the goods item; the authorisation record is on a tab of
            // the consignment.
            await importer!.declarations.openRecord(sfd.consignment);

            // Name the party the authorisation really belongs to - the importer being
            // declared for - which is exactly what CDS said it did not.
            await importer!.consignment.correctHolderOfAuthorisation(holderOfAuthorisation());

            // Back up to the consignment in the IMPORTER's browser: the wizard ends on the
            // record's own tab, where submit is rendered disabled.
            await importer!.consignment.goToConsignmentOverview();
            await importer!.consignment.submitConsignment();

            // Status, not MRN. Unlike the ENS consignment, a rejected SFD ALREADY carries
            // an MRN , so an MRN here would prove nothing. Leaving
            // "Trader Input Required" is what says the correction was accepted.
            await importer!.declarations
                .verifyCorrectionAcceptedByCds(sfd.consignment, 'status.awaitingArrival');
        });
    });

    /**
     * The same rule as the SFD test above, asked of the other journey - and it holds.
     *
     * Worth building rather than assuming: an IMMI is generated by a different journey
     * and could plausibly be governed differently. It also needed a different lever. Two
     * were tried and ACCEPTED before this one (see representation-authority-data), which
     * is why the rejection is arranged where an IMMI actually declares the importer's
     * authorisation: the `1UKI` UKIMS number on the goods item.
     *
     * The submitter rule was measured on the SFD, and the two journeys share one row of
     * the table - so on this journey it is a prediction until this test runs green. That
     * is the whole reason both exist.
     */
    test('Verify that the Agent that submitted the ENS can correct and resubmit the rejected IMMI on its own account', { tag: ['@regression', '@auth', '@authorisation'] }, async ({
        declareEnsThroughApiFlow, consignmentOverviewFlow,
        declarationAccessFlow, representTraderFlow, goodsOverviewFlow, checkAuthorityFlow,
    }, testInfo) => {
        await ReportLog.setStory('The Agent that submitted the ENS corrects the rejected IMMI as itself');

        await ReportLog.step('Agent declares an ENS-IMMI and submits it - expect CDS to reject the IMMI', async () => {
            const { consignmentReference } = await declareEnsThroughApiFlow
                .declareAndSubmitExpectingRefusal(ensImmiDeclaration(testInfo, immiRejectedByCds()), 'IMMI');

            await declarationAccessFlow.openDeclarationInPortal(BASE_URL, testInfo, consignmentReference);
        });

        const immi = await declarationAccessFlow.locateImmiConsignmentRecords();

        const immiCheck = {
            what: 'the rejected IMMI',
            records: immi,
            // Seven goods-item tabs, not nine: an IMMI drops the two fiscal ones
            tabs: IMMI_EIDR_DECLARATION_TABS,
        };

        await ReportLog.step('Agent on its own account and Importer on its own login - check what each is offered', () =>
            checkAuthorityFlow(GENERATED_DECLARATION_AUTHORITY.rejectedConsignment, {
                ...immiCheck, parties: ['agent', 'importer'],
            })
        );

        await ReportLog.step('The same account now representing the Importer - check representing changes nothing', async () => {
            // From the Agent's own browser, switched to represent the Importer: under the
            // submitter rule this account already held Full, so what is being asked here is
            // that taking on a representation does not COST it anything.
            await representTraderFlow.representTrader(IMPORTER_COMPANY_NAME);
            await checkAuthorityFlow(GENERATED_DECLARATION_AUTHORITY.rejectedConsignment, {
                ...immiCheck, parties: ['agentAsImporter'],
            });
        });

        await ReportLog.step('Agent on its own account corrects the UKIMS document - expect CDS to accept it', async () => {
            // Representation given up first, for the reason the SFD test gives: this step
            // exists to exercise the SUBMITTER's own right, and it would pass under the
            // old rule too if the importer's were still being borrowed.
            await representTraderFlow.stopRepresenting();

            // The correction undoes the lever exactly: the goods item's 1UKI goes back to
            // the importer's own UKIMS number. The reads left the browser on the goods
            // item, which is where that record lives.
            await declarationAccessFlow.openRecord(immi.goodsItem!); // NOSONAR - strictNullChecks makes this required; Sonar analyses without our tsconfig.
            await goodsOverviewFlow.correctDocumentReference(importerUkimsDocument());

            await consignmentOverviewFlow.goToConsignmentOverview();
            await consignmentOverviewFlow.submitConsignment();

            // Status, not MRN - a rejected IMMI already carries one, as a rejected SFD does.
            await declarationAccessFlow
                .verifyCorrectionAcceptedByCds(immi.consignment, 'status.awaitingArrival');
        });
    });

    /**
     * The Importer corrects the IMMI from its OWN login, not through an agent.
     *
     * The counterpart of the SFD test above, and the reason both exist: Full can be
     * reached two ways - by the company itself, or by an agent representing it - and only
     * one of them depends on representation working at all. The test above exercises the
     * agent's route on this journey; this one exercises the company's.
     *
     * The correction is a level deeper than the SFD's: an IMMI is refused over the `1UKI`
     * UKIMS number on its GOODS ITEM, so the second session has to reach the goods item's
     * tabs rather than the consignment's.
     */
    test('Verify that the Importer, on its own login, can correct and resubmit a rejected IMMI the Agent declared', { tag: ['@regression', '@auth', '@authorisation'] }, async ({
        declareEnsThroughApiFlow,
        declarationAccessFlow, checkAuthorityFlow,
    }, testInfo) => {
        await ReportLog.setStory('Importer corrects the UKIMS on a rejected IMMI and resubmits');

        await ReportLog.step('Agent declares an ENS-IMMI and submits it - expect CDS to reject the IMMI', async () => {
            const { consignmentReference } = await declareEnsThroughApiFlow
                .declareAndSubmitExpectingRefusal(ensImmiDeclaration(testInfo, immiRejectedByCds()), 'IMMI');

            await declarationAccessFlow.openDeclarationInPortal(BASE_URL, testInfo, consignmentReference);
        });

        const immi = await declarationAccessFlow.locateImmiConsignmentRecords();

        // Both companies on the same records at the same moment - the Importer offered
        // the corrections the representing Agent is not. Its window is kept, because it
        // is about to use what it was just shown.
        const { importer } = await ReportLog.step('Agent on its own account and Importer on its own login - check what each is offered', () =>
            checkAuthorityFlow(GENERATED_DECLARATION_AUTHORITY.rejectedConsignment, {
                what: 'the rejected IMMI',
                records: immi,
                tabs: IMMI_EIDR_DECLARATION_TABS,
                parties: ['agent', 'importer'],
                keepOpen: ['importer'],
            })
        );

        await ReportLog.step('Importer corrects the UKIMS document on its own login - expect CDS to accept it', async () => {
            // The correction undoes the lever exactly: the goods item's 1UKI goes back to
            // the importer's own UKIMS number.
            await importer!.declarations.openRecord(immi.goodsItem!); // NOSONAR - strictNullChecks makes this required; Sonar analyses without our tsconfig.
            await importer!.goods.correctDocumentReference(importerUkimsDocument());

            await importer!.consignment.goToConsignmentOverview();
            await importer!.consignment.submitConsignment();

            // Status, not MRN - a rejected IMMI already carries one, as a rejected SFD does.
            await importer!.declarations
                .verifyCorrectionAcceptedByCds(immi.consignment, 'status.awaitingArrival');
        });
    });

    /**
     * The EIDR an ENS journey generates: everybody reads it, nobody may change it.
     *
     * The odd one of the three declarations, and worth saying plainly what this can and
     * cannot establish. Nobody holds Full on a generated EIDR, so
     * "this company is offered no actions" has an innocent explanation - the screen
     * offers nobody any - and no arrangement of parties rules it out. That half is a
     * privilege-escalation net: it fails if a company GAINS an action, which is the
     * direction that matters.
     *
     * Since 2026-10-10 an agent representing nobody keeps reading it too, so nothing on
     * this row is refused - it nets a company gaining an action and nothing else.
     *
     * No correction and no resubmission, because there is nothing anybody may correct.
     */
    test('Verify that the Agent and the Importer can read but not edit a generated EIDR', { tag: ['@regression', '@auth', '@authorisation'] }, async ({
        raiseMovementForGmrThroughApiFlow, declarationAccessFlow, representTraderFlow, checkAuthorityFlow,
    }, testInfo) => {
        await ReportLog.setStory('Everybody reads the generated EIDR, nobody may change it');

        await ReportLog.step('Agent declares an ENS-EIDR through the Trader API and opens it in the portal', async () => {
            const { consignmentReference } = await raiseMovementForGmrThroughApiFlow
                .raiseEligibleMovementThroughTraderApi({ journey: eidrGmrJourney(GMR_MOVEMENT.ACCOMPANIED) });

            await declarationAccessFlow.openDeclarationInPortal(BASE_URL, testInfo, consignmentReference);
        });

        // The Trader API flow authorises the movement through ICS2 and waits for the EIDR
        // to be authorised, so the record is read in a settled state.
        const eidr = await declarationAccessFlow.locateEidrConsignmentRecords();

        const eidrCheck = {
            what: 'the generated EIDR',
            records: eidr,
            tabs: IMMI_EIDR_DECLARATION_TABS,
            unfalsifiableBecause:
                'no company may edit a generated EIDR, so no party on this row holds Full, '
                + 'and since 2026-08-19 none is refused it either - what is left catches a '
                + 'company gaining an action, not a screen that renders nothing',
        };

        await ReportLog.step('Agent on its own account and Importer on its own login - check what each is offered', () =>
            checkAuthorityFlow(ENS_EIDR_AUTHORITY.generatedEidrConsignment, {
                ...eidrCheck, parties: ['agent', 'importer'],
            })
        );

        await ReportLog.step('The same account representing the Importer - check the EIDR stays read-only', async () => {
            // The submitter rule reaches every other generated declaration; this asks
            // that it does not reach this one from the representation side either.
            await representTraderFlow.representTrader(IMPORTER_COMPANY_NAME);
            await checkAuthorityFlow(ENS_EIDR_AUTHORITY.generatedEidrConsignment, {
                ...eidrCheck, parties: ['agentAsImporter'],
            });
        });
    });

    /**
     * The GMR on a movement the Agent made as itself.
     *
     * The counterpart of the haulier GMR test below, and the only place the Importer
     * is asked about a GMR at all. Its own test for the same reason: a service that
     * refuses to create a GMR here should cost a GMR result, not a declaration one.
     */
    test('Verify that the Agent that made the movement holds its GMR, and the Importer and the Haulier named as carrier may only read it', { tag: ['@regression', '@auth', '@authorisation'], lock: lockWhenSingleAccount(COMPANY_PROFILE.HAULIER) }, async ({
        raiseMovementForGmrThroughApiFlow, createAndSubmitGmrFlow,
        declarationAccessFlow, checkAuthorityFlow,
    }, testInfo) => {
        test.skip(
            !isProfileConfigured(COMPANY_PROFILE.HAULIER),
            profileMissingReason(COMPANY_PROFILE.HAULIER)
        );
        await ReportLog.setStory('The GMR belongs to the account that made the movement');

        const consignmentReference = await ReportLog.step('Agent declares an ENS-SFD with the Haulier as carrier through the Trader API, gets it accepted and opens it in the portal', async () => {
            // Accepted rather than rejected - see the haulier GMR test for why a GMR needs
            // an SFD at "Awaiting arrival".
            const { consignmentReference } = await raiseMovementForGmrThroughApiFlow
                .raiseEligibleMovementThroughTraderApi({ journey: withHaulierAsCarrier(sfdGmrJourney(GMR_MOVEMENT.ACCOMPANIED)) });

            await declarationAccessFlow.openDeclarationInPortal(BASE_URL, testInfo, consignmentReference);
            return consignmentReference;
        });

        await ReportLog.step('Agent creates and submits a GMR for that movement', () =>
            createAndSubmitGmrFlow.addNewGmrAndSubmit(gmrData({
                route_id: ROUTE_ID_CONSTANT.GB_TO_NI.CAIRNRYAN_LARNE_FERRIES,
                external_contacts_list: ['adam1.taylor@nifreight.co.uk'],
            }))
        );

        const gmr = await declarationAccessFlow.locateGmrRecord();
        const gmrCheck = {
            what: 'the GMR the Agent made',
            records: gmr,
            tabs: GMR_TABS,
            recordActions: [],
        };

        await ReportLog.step('Agent on its own account, Importer and Haulier on their own logins - check what each is offered', () =>
            checkAuthorityFlow(MOVEMENT_GMR_AUTHORITY.gmr, {
                ...gmrCheck, reference: consignmentReference, parties: ['agent', 'importer', 'haulier'],
            })
        );

        // No agentAsImporter here. An agent acting for a company holds what that
        // company holds, so asking both forms of the Importer twice measures the rule
        // twice - the GMR made for the Haulier asks the representation instead.
    });
});

/**
 * Standalone declarations, which the trader submits directly rather than having the
 * service generate them from an ENS.
 *
 * A separate describe because the setup is different in the one way that matters: the
 * Agent REPRESENTS the Importer here. An integrated declaration stopped needing that on
 * 2026-08-19 and the Agent declares as itself; a standalone one is still made on the
 * importer's behalf from the first screen, so representation is still what the rules
 * here turn on.
 *
 * The rule they measure is also different in kind. An integrated declaration's access
 * follows the RECORD (who is the importer on it); a standalone one follows WHO CREATED
 * IT - an agent reaches a standalone declaration it made itself while acting for the
 * importer, and not one another agent made while acting for the same importer. Only the
 * first half of that is testable today: the second needs an Agent C that does not exist.
 */
test.describe('Standalone declaration authority - Agent represents the Importer', () => {
    test.use({ authProfile: COMPANY_PROFILE.AGENT });

    test.beforeEach(async ({ representTraderFlow }) => {
        await ReportLog.setFeature('Representation authority');
        await representTraderFlow.representTrader(IMPORTER_COMPANY_NAME);
    });

    /**
     * A standalone IMMI the Agent created while acting for the Importer.
     *
     * Rejected on purpose by the same UKIMS lever the ENS-IMMI test uses, for the same
     * reason: a consignment the service has finished with offers nobody an action, so
     * "this company may edit it" can only be told apart from "nobody may" while the
     * declaration is still waiting on the trader.
     */
    test('Verify that the Agent representing the Importer can correct and resubmit a rejected standalone IMMI', { tag: ['@regression', '@auth', '@authorisation'] }, async ({
        declareStandaloneThroughApiFlow, declarationAccessFlow, consignmentOverviewFlow,
        goodsOverviewFlow, representTraderFlow, checkAuthorityFlow,
    }, testInfo) => {
        await ReportLog.setStory('Standalone IMMI - the creating agent corrects it and puts it back in');

        const immi = await ReportLog.step('Agent representing the Importer declares a standalone IMMI - expect CDS to reject it', async () => {
            const reference = await declareStandaloneThroughApiFlow
                .declareAndSubmitImmiStandalone(rejectedImmiStandaloneForImporter(), DECLARATION_STATUS.TRADER_INPUT_REQUIRED);

            return declarationAccessFlow.locateDeclaration(BASE_URL, testInfo, reference);
        });

        const immiCheck = {
            what: 'the rejected standalone IMMI',
            records: immi,
            tabs: IMMI_EIDR_DECLARATION_TABS,
        };

        await ReportLog.step('Agent representing the Importer and Importer on its own login - check what each is offered', () =>
            checkAuthorityFlow(STANDALONE_AUTHORITY.createdByThisAgent, {
                ...immiCheck, parties: ['agentAsImporter', 'importer'],
            })
        );

        await checkOnceRepresentationEnds(
            representTraderFlow, checkAuthorityFlow, STANDALONE_AUTHORITY.createdByThisAgent, immiCheck,
            'what it keeps of the record it just made',
        );

        await ReportLog.step('Agent representing the Importer removes the extra additional procedure code - expect CDS to accept it', async () => {
            // Everything above only observed a screen. Full is a claim about the service
            // ACCEPTING a change, so the agent goes on to make one: the correction undoes
            // the lever exactly, removing the extra additional procedure code it added.
            //
            // Representing again first, because the check above gave the representation up.
            await representTraderFlow.representTrader(IMPORTER_COMPANY_NAME);

            await declarationAccessFlow.openRecord(immi.goodsItem!); // NOSONAR - strictNullChecks makes this required; Sonar analyses without our tsconfig.
            await goodsOverviewFlow.removeAdditionalProcedureCode(IMMI_STANDALONE_REFUSED_PROCEDURE_CODE);

            await consignmentOverviewFlow.resubmitConsignment();

            // Status, not MRN: a rejected standalone already carries one, so an MRN here
            // would prove nothing. Leaving "Trader Input Required" says CDS took it.
            await declarationAccessFlow
                .verifyCorrectionAcceptedByCds(immi.consignment, 'status.awaitingArrival');
        });
    });

    /**
     * The Importer corrects the standalone IMMI from its OWN login.
     *
     * The counterpart of the test above, and the reason both exist: Full can be reached
     * two ways - by the company itself, or by an agent representing it - and only one of
     * them depends on representation working at all.
     *
     * A declaration of its own, not a second correction of the one above: a rejection can
     * be corrected once, so the two routes cannot share a record however alike they look.
     *
     * The Agent still CREATES it, because that is the situation the rule is about - a
     * standalone declaration made on the importer's behalf, not one the importer made.
     */
    test('Verify that the Importer, on its own login, can correct and resubmit a rejected standalone IMMI the Agent created for it', { tag: ['@regression', '@auth', '@authorisation'] }, async ({
        declareStandaloneThroughApiFlow, declarationAccessFlow, checkAuthorityFlow,
    }, testInfo) => {
        await ReportLog.setStory('Standalone IMMI - the importer corrects it on its own login');

        const immi = await ReportLog.step('Agent representing the Importer declares a standalone IMMI - expect CDS to reject it', async () => {
            const reference = await declareStandaloneThroughApiFlow
                .declareAndSubmitImmiStandalone(rejectedImmiStandaloneForImporter(), DECLARATION_STATUS.TRADER_INPUT_REQUIRED);

            return declarationAccessFlow.locateDeclaration(BASE_URL, testInfo, reference);
        });

        // The window is kept: the Importer is about to use what it was just shown.
        const { importer } = await ReportLog.step('Importer on its own login - check what it is offered on the record the Agent declared', () =>
            checkAuthorityFlow(STANDALONE_AUTHORITY.createdByThisAgent, {
                what: 'the rejected standalone IMMI',
                records: immi,
                tabs: IMMI_EIDR_DECLARATION_TABS,
                parties: ['importer'],
                keepOpen: ['importer'],
            })
        );

        await ReportLog.step('Importer removes the extra additional procedure code on its own login - expect CDS to accept it', async () => {
            // A level deeper than a consignment correction: an IMMI is refused over its
            // GOODS ITEM documents, so the second session works in that item's tabs.
            await importer!.declarations.openRecord(immi.goodsItem!); // NOSONAR - strictNullChecks makes this required; Sonar analyses without our tsconfig.
            await importer!.goods.removeAdditionalProcedureCode(IMMI_STANDALONE_REFUSED_PROCEDURE_CODE);

            await importer!.consignment.resubmitConsignment();

            await importer!.declarations
                .verifyCorrectionAcceptedByCds(immi.consignment, 'status.awaitingArrival');
        });
    });

    /**
     * A standalone SFD, refused by the OTHER lever.
     *
     * An SFD standalone goods item declares no UKIMS document to break, so the rejection
     * is arranged on the consignment instead - a holder of authorisation naming a party
     * that does not hold it, which is the ENS-SFD lever and the same underlying rule.
     */
    test('Verify that the Agent representing the Importer can correct and resubmit a rejected standalone SFD', { tag: ['@regression', '@auth', '@authorisation'] }, async ({
        createAndSubmitSfdStandaloneFlow, declarationAccessFlow, consignmentOverviewFlow,
        representTraderFlow, checkAuthorityFlow,
    }, testInfo) => {
        await ReportLog.setStory('Standalone SFD - the creating agent corrects it and puts it back in');

        const sfd = await ReportLog.step('Agent representing the Importer declares a standalone SFD - expect CDS to reject it', async () => {
            await createAndSubmitSfdStandaloneFlow.completeSfdStandaloneFlow({
                ...rejectedSfdStandaloneForImporter(testInfo),
                expectedStatusKey: 'status.traderInputRequired',
            });

            return declarationAccessFlow.locateRecordsHere();
        });

        // No tab override: an SFD carries all nine goods-item tabs, unlike an IMMI.
        const sfdCheck = { what: 'the rejected standalone SFD', records: sfd };

        await ReportLog.step('Agent representing the Importer and Importer on its own login - check what each is offered', () =>
            checkAuthorityFlow(STANDALONE_AUTHORITY.createdByThisAgent, {
                ...sfdCheck, parties: ['agentAsImporter', 'importer'],
            })
        );

        await checkOnceRepresentationEnds(
            representTraderFlow, checkAuthorityFlow, STANDALONE_AUTHORITY.createdByThisAgent, sfdCheck,
            'what it keeps of the record it just made',
        );

        await ReportLog.step('Agent representing the Importer removes the authorisation - expect CDS to accept it', async () => {
            // Representing again first, because the check above gave the representation up.
            await representTraderFlow.representTrader(IMPORTER_COMPANY_NAME);

            // The Excise Warehouse authorisation is not a wrong value to edit - it is a
            // record the declaration should never have carried, so this removes it.
            await declarationAccessFlow.openRecord(sfd.consignment);
            await consignmentOverviewFlow.removeHolderOfAuthorisation(
                AUTHORISATION_TYPE_CODE.EXCISE_WAREHOUSE_EXW
            );

            await consignmentOverviewFlow.resubmitConsignment();

            await declarationAccessFlow
                .verifyCorrectionAcceptedByCds(sfd.consignment, 'status.awaitingArrival');
        });
    });

    /**
     * The Importer corrects the standalone SFD from its OWN login - the counterpart of
     * the test above, for the same reason the IMMI pair exists.
     *
     * A declaration of its own: a rejection can be corrected once, so the agent's route
     * and the company's route cannot share a record.
     */
    test('Verify that the Importer, on its own login, can correct and resubmit a rejected standalone SFD the Agent created for it', { tag: ['@regression', '@auth', '@authorisation'] }, async ({
        createAndSubmitSfdStandaloneFlow, declarationAccessFlow, checkAuthorityFlow,
    }, testInfo) => {
        await ReportLog.setStory('Standalone SFD - the importer corrects it on its own login');

        const sfd = await ReportLog.step('Agent representing the Importer declares a standalone SFD - expect CDS to reject it', async () => {
            await createAndSubmitSfdStandaloneFlow.completeSfdStandaloneFlow({
                ...rejectedSfdStandaloneForImporter(testInfo),
                expectedStatusKey: 'status.traderInputRequired',
            });

            return declarationAccessFlow.locateRecordsHere();
        });

        const { importer } = await ReportLog.step('Importer on its own login - check what it is offered on the record the Agent declared', () =>
            checkAuthorityFlow(STANDALONE_AUTHORITY.createdByThisAgent, {
                what: 'the rejected standalone SFD',
                records: sfd,
                parties: ['importer'],
                keepOpen: ['importer'],
            })
        );

        await ReportLog.step('Importer removes the authorisation on its own login - expect CDS to accept it', async () => {
            await importer!.declarations.openRecord(sfd.consignment);
            await importer!.consignment.removeHolderOfAuthorisation(
                AUTHORISATION_TYPE_CODE.EXCISE_WAREHOUSE_EXW
            );

            await importer!.consignment.resubmitConsignment();

            await importer!.declarations
                .verifyCorrectionAcceptedByCds(sfd.consignment, 'status.awaitingArrival');
        });
    });

    /**
     * A standalone EIDR - the same journey as the SFD above with uncontrolled goods.
     *
     * No lever, because there is nothing to arrange: an EIDR is authorised outright and
     * never waits on the trader, so it has no state in which the service offers anybody
     * a change. Since 2026-10-11 it does offer Cancel, to all three parties alike, so
     * that action is what tells Full apart from a screen that rendered nothing.
     */
    test('Verify that the Agent representing the Importer and the Importer can cancel but not edit an authorised standalone EIDR', { tag: ['@regression', '@auth', '@authorisation'] }, async ({
        createAndSubmitSfdStandaloneFlow, declarationAccessFlow,
        representTraderFlow, checkAuthorityFlow,
    }, testInfo) => {
        await ReportLog.setStory('Standalone EIDR - nobody may change it, everybody may cancel it');

        const eidr = await ReportLog.step('Agent representing the Importer declares uncontrolled goods - expect an EIDR back', async () => {
            await createAndSubmitSfdStandaloneFlow.completeSfdStandaloneFlow({
                testInfo,
                url: BASE_URL,
                // Uncontrolled goods is the whole difference: it is what the service
                // answers with an EIDR rather than an SFD.
                consignmentOverrides: {
                    representationType: REPRESENTATION_TYPE.DIRECT,
                    isControlledGoods: false,
                },
                goodsItemOverrides: sfdStandaloneGoodsItem(),
            });

            return declarationAccessFlow.locateRecordsHere();
        });

        const eidrCheck = {
            what: 'the standalone EIDR',
            records: eidr,
            tabs: IMMI_EIDR_DECLARATION_TABS,
            settled: true,
            recordActions: [CONSIGNMENT_ACTION.CANCEL],
        };

        await ReportLog.step('Agent representing the Importer and Importer on its own login - check what each is offered', () =>
            checkAuthorityFlow(STANDALONE_AUTHORITY.authorisedEidr, {
                ...eidrCheck, parties: ['agentAsImporter', 'importer'],
            })
        );

        await checkOnceRepresentationEnds(
            representTraderFlow, checkAuthorityFlow, STANDALONE_AUTHORITY.authorisedEidr, eidrCheck,
            'what it keeps of the record it just made',
        );
    });


    test('Verify that an Agent company cannot reach a draft standalone declaration created by a different Agent company', { tag: ['@regression', '@auth', '@authorisation', '@single-account'], lock: lockWhenSingleAccount(COMPANY_PROFILE.AGENT_B) }, async ({
        createDraftSfdStandaloneFlow, declarationAccessFlow, checkAuthorityFlow,
    }, testInfo) => {
        test.skip(
            !isProfileConfigured(COMPANY_PROFILE.AGENT_B),
            profileMissingReason(COMPANY_PROFILE.AGENT_B)
        );
        await ReportLog.setStory('Standalone draft - a second agent company reaches nothing of it');

        const draft = await ReportLog.step('Agent representing the Importer leaves a standalone SFD in draft', async () => {
            const { consignmentReference } = await createDraftSfdStandaloneFlow.createDraftSfdStandalone({
                testInfo,
                url: BASE_URL,
                consignmentOverrides: {
                    representationType: REPRESENTATION_TYPE.DIRECT,
                    isControlledGoods: true,
                },
                goodsItemOverrides: sfdStandaloneGoodsItem(),
            });

            return { consignmentReference, records: await declarationAccessFlow.locateRecordsHere() };
        });

        await ReportLog.step('The Agent that created it and a second Agent company - check only the creator reaches it', () =>
            checkAuthorityFlow(STANDALONE_AUTHORITY.createdByThisAgent, {
                what: 'the draft standalone SFD',
                records: draft.records,
                reference: draft.consignmentReference,
                parties: ['agentAsImporter', 'anotherAgent'],
            })
        );
    });
});

/**
 * The Agent declares an ENS-SFD while REPRESENTING THE HAULIER.
 *
 * The journey specs no longer do this - an integrated declaration is made by the Agent as
 * itself (2026-08-19) - so representing a haulier survives here, where it is the thing
 * being measured rather than a step on the way to something else.
 *
 * One test, three states of one account: representing the Haulier, the Haulier on its own
 * login, and the same Agent after giving the representation up. The contrast is the
 * point, so splitting it would mean building three rejected declarations to compare
 * answers that must be seconds apart on the same record.
 */
test.describe('ENS Integrated declaration authority - Agent represents the Haulier', { lock: lockWhenSingleAccount(COMPANY_PROFILE.HAULIER) }, () => {
    test.use({ authProfile: COMPANY_PROFILE.AGENT });

    test.skip(
        !isProfileConfigured(COMPANY_PROFILE.HAULIER),
        profileMissingReason(COMPANY_PROFILE.HAULIER)
    );

    test.beforeEach(async () => {
        await ReportLog.setFeature('Representation authority');
    });

    test('Verify that the Agent representing the Haulier holds the declaration it submitted, and keeps it once it stops representing', { tag: ['@regression', '@auth', '@authorisation'] }, async ({
        declareEnsThroughApiFlow, consignmentOverviewFlow, movementOverviewFlow,
        declarationAccessFlow, representTraderFlow, checkAuthorityFlow,
    }, testInfo) => {
        await ReportLog.setStory('Agent represents the Haulier - full control while it does, and still once it does not');

        const draft = await ReportLog.step('Agent representing the Haulier declares an ENS-SFD and leaves it in draft', async () => {
            await representTraderFlow.representTrader(HAULIER_COMPANY_NAME);

            return declareEnsThroughApiFlow.declareDraft({
                ...ensSfdDeclaration(testInfo, { ...rejectedByCds(), representationType: REPRESENTATION_TYPE.DIRECT }),
                representingCompanyId: companyIdOf(COMPANY_PROFILE.HAULIER),
            });
        });

        // The ENS is asked while it is still a DRAFT, and stopping here before submitting
        // is the whole reason. Once the service accepts a consignment it offers nobody a
        // change on it, so Full is unreachable for every party and the row would pass or
        // fail for a reason that has nothing to do with authority - measured 2026-09-02,
        // when the agent-as-haulier reached the accepted ENS and was offered nothing.
        const ensCheck = {
            what: 'the draft ENS consignment declared for the Haulier',
            records: await declarationAccessFlow.locateDeclaration(BASE_URL, testInfo, draft.consignmentReference),
            reference: draft.consignmentReference,
        };

        await ReportLog.step('Agent representing the Haulier, and the Haulier itself - check the draft', () =>
            checkAuthorityFlow(REPRESENTED_HAULIER_AUTHORITY.ensConsignment, {
                ...ensCheck, parties: ['agentAsHaulier', 'haulier'],
            })
        );

        await checkOnceRepresentationEnds(
            representTraderFlow, checkAuthorityFlow, REPRESENTED_HAULIER_AUTHORITY.ensConsignment, ensCheck,
            'what it keeps of the draft',
        );

        await ReportLog.step('Representing the Haulier again, submit it - expect CDS to reject the SFD', async () => {
            // The representation has to come back before the declaration can be submitted:
            // the account was just shown it cannot reach the record at all without it.
            await representTraderFlow.representTrader(HAULIER_COMPANY_NAME);
            await declarationAccessFlow.openRecord(ensCheck.records.consignment);

            await consignmentOverviewFlow.goToConsignmentOverview();
            await consignmentOverviewFlow.submitConsignment();
            await movementOverviewFlow.waitForSubmittedMovementOverview();

            // The rejection is the precondition, not the failure - as in the tests above.
            await movementOverviewFlow.verifySfdConsignmentTraderInputRequired();
        });

        const sfdCheck = {
            what: 'the rejected SFD generated for the Haulier',
            records: await declarationAccessFlow.locateSfdConsignmentRecords(),
        };

        await ReportLog.step('Agent still representing the Haulier, and the Haulier itself - check the generated SFD', () =>
            checkAuthorityFlow(REPRESENTED_HAULIER_AUTHORITY.rejectedGeneratedConsignment, {
                ...sfdCheck, parties: ['agentAsHaulier', 'haulier'],
            })
        );

        await checkOnceRepresentationEnds(
            representTraderFlow, checkAuthorityFlow, REPRESENTED_HAULIER_AUTHORITY.rejectedGeneratedConsignment, sfdCheck,
            'what it keeps of the SFD',
        );
    });

    /**
     * The same question on the IMMI journey. Worth building rather than inheriting from
     * the SFD above for the reason the Agent-as-itself pair gives: the two are generated
     * by different journeys, so the rule holding across both is a finding.
     */
    test('Verify that the Agent representing the Haulier holds the IMMI it submitted, and keeps it once it stops representing', { tag: ['@regression', '@auth', '@authorisation'] }, async ({
        declareEnsThroughApiFlow,
        declarationAccessFlow, representTraderFlow, checkAuthorityFlow,
    }, testInfo) => {
        await ReportLog.setStory('Agent represents the Haulier - the generated IMMI follows the same rule as the SFD');

        await ReportLog.step('Agent representing the Haulier declares an ENS-IMMI - expect CDS to reject the IMMI', async () => {
            await representTraderFlow.representTrader(HAULIER_COMPANY_NAME);

            const { consignmentReference } = await declareEnsThroughApiFlow.declareAndSubmitExpectingRefusal({
                ...ensImmiDeclaration(testInfo, immiRejectedByCds(), { representationType: REPRESENTATION_TYPE.DIRECT }),
                representingCompanyId: companyIdOf(COMPANY_PROFILE.HAULIER),
            }, 'IMMI');

            await declarationAccessFlow.openDeclarationInPortal(BASE_URL, testInfo, consignmentReference);
        });

        const immi = await declarationAccessFlow.locateImmiConsignmentRecords();
        const immiCheck = {
            what: 'the rejected IMMI generated for the Haulier',
            records: immi,
            tabs: IMMI_EIDR_DECLARATION_TABS,
        };

        await ReportLog.step('Agent still representing the Haulier, and the Haulier itself - check what each is offered', () =>
            checkAuthorityFlow(REPRESENTED_HAULIER_AUTHORITY.rejectedGeneratedConsignment, {
                ...immiCheck, parties: ['agentAsHaulier', 'haulier'],
            })
        );

        await checkOnceRepresentationEnds(
            representTraderFlow, checkAuthorityFlow, REPRESENTED_HAULIER_AUTHORITY.rejectedGeneratedConsignment, immiCheck,
            'what it keeps of the IMMI',
        );
    });

    /**
     * The EIDR reached through a haulier - the one generated declaration nobody may edit.
     *
     * No rejection is arranged and no correction follows, because there is nothing anybody
     * may correct. Since 2026-10-10 the account that gave its representation up keeps
     * reading it too, so the row nets a company gaining an action and nothing else.
     */
    test('Verify that the Agent representing the Haulier can read the generated EIDR, and still reads it once it stops representing', { tag: ['@regression', '@auth', '@authorisation'] }, async ({
        raiseMovementForGmrThroughApiFlow, declarationAccessFlow, representTraderFlow, checkAuthorityFlow,
    }, testInfo) => {
        await ReportLog.setStory('Agent represents the Haulier - everybody reads the generated EIDR, nobody may change it');

        await ReportLog.step('Agent representing the Haulier declares an ENS-EIDR through the Trader API and opens it in the portal', async () => {
            await representTraderFlow.representTrader(HAULIER_COMPANY_NAME);

            const { consignmentReference } = await raiseMovementForGmrThroughApiFlow
                .raiseEligibleMovementThroughTraderApi({
                    journey: eidrGmrJourney(GMR_MOVEMENT.ACCOMPANIED),
                    representingCompanyId: companyIdOf(COMPANY_PROFILE.HAULIER),
                });

            await declarationAccessFlow.openDeclarationInPortal(BASE_URL, testInfo, consignmentReference);
        });

        // Settled before it is read, for the reason the Agent-as-itself EIDR test gives.
        const eidr = await declarationAccessFlow.locateEidrConsignmentRecords();
        const eidrCheck = {
            what: 'the EIDR generated for the Haulier',
            records: eidr,
            tabs: IMMI_EIDR_DECLARATION_TABS,
            unfalsifiableBecause:
                'no company may edit a generated EIDR, so no party on this row holds Full, '
                + 'and since 2026-10-10 none is refused it either - what is left catches a '
                + 'company gaining an action, not a screen that renders nothing',
        };

        await ReportLog.step('Agent still representing the Haulier, and the Haulier itself - check what each is offered', () =>
            checkAuthorityFlow(REPRESENTED_HAULIER_AUTHORITY.generatedEidrConsignment, {
                ...eidrCheck, parties: ['agentAsHaulier', 'haulier'],
            })
        );

        await checkOnceRepresentationEnds(
            representTraderFlow, checkAuthorityFlow, REPRESENTED_HAULIER_AUTHORITY.generatedEidrConsignment, eidrCheck,
            'what it keeps of the EIDR',
        );
    });

    /**
     * The GMR - the vehicle movement, not a declaration.
     *
     * Its own test rather than another check bolted onto the SFD one above: creating a
     * GMR is a journey of its own, and a service that refuses to make one here would
     * take the SFD measurements down with it. Separate, a GMR problem costs a GMR test.
     *
     * The row it asks is STATED, NEVER MEASURED - see the note in authority-matrix. Two
     * things could turn it red honestly: the rule having changed, or a GMR page simply
     * not offering the change links Full is read from. Read the step titles before
     * concluding which.
     */
    test('Verify that the Agent representing the Haulier holds the GMR it created, and keeps it once it stops representing', { tag: ['@regression', '@auth', '@authorisation'] }, async ({
        raiseMovementForGmrThroughApiFlow, createAndSubmitGmrFlow,
        declarationAccessFlow, representTraderFlow, checkAuthorityFlow,
    }, testInfo) => {
        await ReportLog.setStory('Agent represents the Haulier - the GMR follows the representation like the declaration does');

        await ReportLog.step('Agent representing the Haulier declares an ENS-SFD through the Trader API, gets it accepted and opens it in the portal', async () => {
            await representTraderFlow.representTrader(HAULIER_COMPANY_NAME);

            const { consignmentReference } = await raiseMovementForGmrThroughApiFlow
                .raiseEligibleMovementThroughTraderApi({
                    journey: sfdGmrJourney(GMR_MOVEMENT.ACCOMPANIED),
                    representingCompanyId: companyIdOf(COMPANY_PROFILE.HAULIER),
                });

            await declarationAccessFlow.openDeclarationInPortal(BASE_URL, testInfo, consignmentReference);
        });

        // The GMR is about the vehicle rather than the goods, but it cannot exist before
        // the goods have somewhere to travel - hence the accepted declaration above.
        await ReportLog.step('The same account creates and submits a GMR for that movement', () =>
            createAndSubmitGmrFlow.addNewGmrAndSubmit(gmrData({
                route_id: ROUTE_ID_CONSTANT.GB_TO_NI.CAIRNRYAN_LARNE_FERRIES,
                external_contacts_list: ['adam1.taylor@nifreight.co.uk'],
            }))
        );

        const gmr = await declarationAccessFlow.locateGmrRecord();
        const gmrCheck = {
            what: 'the GMR created for the Haulier',
            records: gmr,
            tabs: GMR_TABS,
            recordActions: [],
        };

        const { haulier } = await ReportLog.step('Agent representing the Haulier, and the Haulier itself - check what each is offered', () =>
            checkAuthorityFlow(REPRESENTED_HAULIER_AUTHORITY.gmr, {
                ...gmrCheck, parties: ['agentAsHaulier', 'haulier'],
                // The Haulier is about to use what it was just shown, so its window stays.
                keepOpen: ['haulier'],
            })
        );

        await ReportLog.step('The same account representing the Importer instead - check what a representation confers', async () => {
            // The Importer through an agent rather than on its own login: an agent
            // acting for a company holds what that company holds, so this is where the
            // rule is measured on a movement the Importer does not own.
            await representTraderFlow.representTrader(IMPORTER_COMPANY_NAME);
            await checkAuthorityFlow(REPRESENTED_HAULIER_AUTHORITY.gmr, {
                ...gmrCheck, parties: ['agentAsImporter'],
            });
        });

        await ReportLog.step('The Haulier, on its own login, changes the route and resubmits', async () => {
            await haulier!.declarations.openRecord(gmr.consignment);
            await haulier!.gmr.changeRouteAndResubmit(
                ROUTE_ID_CONSTANT.GB_TO_NI.BIRKENHEAD_LIVERPOOL_BELFAST_STENA_LINE
            );
        });

        await checkOnceRepresentationEnds(
            representTraderFlow, checkAuthorityFlow, REPRESENTED_HAULIER_AUTHORITY.gmr, gmrCheck,
            'what it keeps of the GMR',
        );
    });
});


test.describe('Supplementary declaration authority - Agent declares the ENS-SFD as itself', () => {
    test.use({ authProfile: COMPANY_PROFILE.AGENT });

    test.describe.configure({ timeout: 1_200_000 });

    test.beforeEach(async () => {
        await ReportLog.setFeature('Representation authority');
    });

    test('Verify that the Agent, the Importer and the Agent representing the Importer hold a draft supplementary declaration, and the Haulier named as carrier is refused it', { tag: ['@regression', '@auth', '@authorisation'], lock: lockWhenSingleAccount(COMPANY_PROFILE.HAULIER) }, async ({
        generateSdDraftThroughApiFlow, completeAndSubmitSupplementaryDeclarationFlow,
        declarationAccessFlow, representTraderFlow, checkAuthorityFlow,
    }, testInfo) => {
        await ReportLog.setStory('Supplementary declaration - who may change a draft');

        const { reference, sd } = await ReportLog.step('Agent raises a supplementary declaration with the Haulier as carrier through the Trader API and opens it', async () => {
            const source = await generateSdDraftThroughApiFlow.raiseSdDraft({ declaration: haulierAsCarrier({}) });
            const sdReference = await completeAndSubmitSupplementaryDeclarationFlow
                .openSupplementaryDeclaration({ testInfo, url: BASE_URL, ...source });

            return { reference: sdReference, sd: await declarationAccessFlow.locateSupplementaryDeclarationRecords() };
        });

        const sdCheck = {
            what: 'the draft supplementary declaration',
            records: sd,
            tabs: SUPPLEMENTARY_DECLARATION_TABS,
            reference,
        };

        await ReportLog.step('Agent on its own account, Importer and Haulier on their own logins - check what each is offered', () =>
            checkAuthorityFlow(SUPPLEMENTARY_DECLARATION_AUTHORITY.draft, {
                ...sdCheck, parties: ['agent', 'importer', 'haulier'],
            })
        );

        await ReportLog.step('The same account representing the Importer - check what a representation confers', async () => {
            await representTraderFlow.representTrader(IMPORTER_COMPANY_NAME);
            await checkAuthorityFlow(SUPPLEMENTARY_DECLARATION_AUTHORITY.draft, {
                ...sdCheck, parties: ['agentAsImporter'],
            });
        });

        await checkOnceRepresentationEnds(
            representTraderFlow, checkAuthorityFlow, SUPPLEMENTARY_DECLARATION_AUTHORITY.draft, sdCheck,
            'what it keeps of the supplementary declaration',
        );
    });

    test('Verify that the Agent representing the Importer can correct and resubmit a supplementary declaration handed back for input, and the Haulier named as carrier is refused it', { tag: ['@regression', '@auth', '@authorisation'], lock: lockWhenSingleAccount(COMPANY_PROFILE.HAULIER) }, async ({
        generateSdDraftThroughApiFlow, completeAndSubmitSupplementaryDeclarationFlow,
        declarationAccessFlow, representTraderFlow, checkAuthorityFlow,
    }, testInfo) => {
        await ReportLog.setStory('Supplementary declaration - the Agent acting for the Importer corrects it');

        const source = await generateSdDraftThroughApiFlow.raiseSdDraft({ declaration: haulierAsCarrier({}) });

        const sd = await ReportLog.step('Agent submits the draft unanswered - expect it to be handed back', async () => {
            await completeAndSubmitSupplementaryDeclarationFlow
                .submitSupplementaryDeclarationExpectingRejection({ testInfo, url: BASE_URL, ...source });
            return declarationAccessFlow.locateSupplementaryDeclarationRecords();
        });

        const sdCheck = {
            what: 'the supplementary declaration handed back for input',
            records: sd,
            tabs: SUPPLEMENTARY_DECLARATION_TABS,
        };

        await ReportLog.step('Agent on its own account, Importer and Haulier on their own logins - check what each is offered', () =>
            checkAuthorityFlow(SUPPLEMENTARY_DECLARATION_AUTHORITY.traderInputRequired, {
                ...sdCheck, parties: ['agent', 'importer', 'haulier'],
            })
        );

        await ReportLog.step('Agent representing the Importer answers what was missing and resubmits - expect it accepted', async () => {
            await representTraderFlow.representTrader(IMPORTER_COMPANY_NAME);
            await checkAuthorityFlow(SUPPLEMENTARY_DECLARATION_AUTHORITY.traderInputRequired, {
                ...sdCheck, parties: ['agentAsImporter'],
            });
            await completeAndSubmitSupplementaryDeclarationFlow.completeSupplementaryDeclaration({
                testInfo, url: BASE_URL, ...source,
                overrides: declaredThroughTraderApi(traderDefermentSupplementaryDeclaration()),
            });
        });
    });

    test('Verify that the Importer, on its own login, can correct and resubmit a supplementary declaration the Agent raised', { tag: ['@regression', '@auth', '@authorisation'] }, async ({
        generateSdDraftThroughApiFlow, completeAndSubmitSupplementaryDeclarationFlow,
        declarationAccessFlow, checkAuthorityFlow,
    }, testInfo) => {
        await ReportLog.setStory('Supplementary declaration - the Importer corrects it on its own login');

        const source = await generateSdDraftThroughApiFlow.raiseSdDraft();

        const sd = await ReportLog.step('Agent submits the draft unanswered - expect it to be handed back', async () => {
            await completeAndSubmitSupplementaryDeclarationFlow
                .submitSupplementaryDeclarationExpectingRejection({ testInfo, url: BASE_URL, ...source });
            return declarationAccessFlow.locateSupplementaryDeclarationRecords();
        });

        const { importer } = await ReportLog.step('Importer on its own login - check what it is offered on the declaration the Agent raised', () =>
            checkAuthorityFlow(SUPPLEMENTARY_DECLARATION_AUTHORITY.traderInputRequired, {
                what: 'the supplementary declaration handed back for input',
                records: sd,
                tabs: SUPPLEMENTARY_DECLARATION_TABS,
                parties: ['importer'],
                keepOpen: ['importer'],
            })
        );

        await ReportLog.step('Importer answers what was missing on its own login and resubmits - expect it accepted', async () => {
            await importer!.supplementaryDeclaration.completeSupplementaryDeclaration({
                testInfo, url: BASE_URL, ...source,
                overrides: declaredThroughTraderApi(traderDefermentSupplementaryDeclaration()),
            });
            await importer!.close();
        });
    });

    test('Verify that the Agent representing the Haulier and the Haulier are refused a supplementary declaration raised from an ENS-SFD declared for the Haulier', { tag: ['@regression', '@auth', '@authorisation'], lock: lockWhenSingleAccount(COMPANY_PROFILE.HAULIER) }, async ({
        generateSdDraftThroughApiFlow, completeAndSubmitSupplementaryDeclarationFlow,
        declarationAccessFlow, representTraderFlow, checkAuthorityFlow,
    }, testInfo) => {
        await ReportLog.setStory('Supplementary declaration - the Haulier path gives the Haulier nothing');

        const { reference, sd } = await ReportLog.step('Agent declares the ENS-SFD for the Haulier through the Trader API and opens the supplementary declaration', async () => {
            const source = await generateSdDraftThroughApiFlow.raiseSdDraft({
                declaration: { representingCompanyId: companyIdOf(COMPANY_PROFILE.HAULIER) },
            });
            const sdReference = await completeAndSubmitSupplementaryDeclarationFlow
                .openSupplementaryDeclaration({ testInfo, url: BASE_URL, ...source });

            return { reference: sdReference, sd: await declarationAccessFlow.locateSupplementaryDeclarationRecords() };
        });

        const sdCheck = {
            what: 'the supplementary declaration raised for the Haulier',
            records: sd,
            tabs: SUPPLEMENTARY_DECLARATION_TABS,
            reference,
        };

        await ReportLog.step('Agent representing nobody, Importer and Haulier on their own logins - check what each is offered', () =>
            checkAuthorityFlow(SUPPLEMENTARY_DECLARATION_AUTHORITY.representedHaulier, {
                ...sdCheck, parties: ['agentNotRepresenting', 'importer', 'haulier'],
            })
        );

        await ReportLog.step('The same account representing the Haulier - check the representation takes the Haulier\'s identity', async () => {
            await representTraderFlow.representTrader(HAULIER_COMPANY_NAME);
            await checkAuthorityFlow(SUPPLEMENTARY_DECLARATION_AUTHORITY.representedHaulier, {
                ...sdCheck, parties: ['agentAsHaulier'],
            });
        });
    });
});
