import { expect } from '@playwright/test';
import { ReportLog } from '../../core/report/report-log';
import { ConsignmentOverviewPage } from "../../page-object/consignment-overview-page";
import { PreviousDocumentDeclarePage } from "../../page-object/header-previous-documents-declare-page";
import { HolderOfAuthorisationDeclarePage } from "../../page-object/holder-of-authorisation-declare-page";
import { ConsignmentDetailPage } from '../../page-object/consignment-detail-page';
import { PreviousDocumentData } from "../../test-data/previous-document-data";
import { HolderOfAuthorisationData } from "../../test-data/holder-of-authorisation-data";
import { TranslationKey, TFunction } from '../../fixtures/locale-fixture';
import { isTraderInputRequiredStatus, traderInputRequiredError } from '../../helper/declaration-status-helper';
import { MrnCountryCode, mrnPrefix } from '../../constant/local-reference-constants';

/**
 * Declares the consignment-overview tabs that each hold a list of records
 * (Header previous documents, Holder of authorisation, ...). Every method is a
 * no-op on an empty list, so a journey that declares none of these is unaffected.
 */
export class ConsignmentOverviewFlow {
    constructor(
        private readonly consignmentOverviewPage: ConsignmentOverviewPage,
        private readonly previousDocumentDeclarePage: PreviousDocumentDeclarePage,
        private readonly holderOfAuthorisationDeclarePage: HolderOfAuthorisationDeclarePage,
        private readonly consignmentDetailPage: ConsignmentDetailPage,
        // Whether a status means "handed back to the trader" is a comparison against
        // translated text, but the decision it feeds - can this journey carry on? - is
        // this layer's. So the flow holds t and asks the question itself, rather than
        // each page answering it for whichever flow happens to call.
        private readonly t: TFunction,
    ) { }

    /**
     * The expected status is a PARAMETER, not baked in: the same pair of CDS responses
     * lands an SFD on "Arrived" and an IMMI on "Closed" (Trung, 2026-08-20).
     */
    async verifyConsignmentStatus(expectedStatusKey: TranslationKey): Promise<string> {
        const expected = this.t(expectedStatusKey);

        return ReportLog.step(`Wait for the consignment to reach ${expected}`, async () => {
            const status = await this.consignmentDetailPage.waitForStatus(expectedStatusKey);
            ReportLog.setParameter('Consignment status', status);
            return status;
        });
    }

    /** Return to the consignment overview (e.g. after adding a goods item, which
     *  ends on the goods-item overview). */
    async goToConsignmentOverview(): Promise<void> {
        await this.consignmentOverviewPage.goToConsignmentOverview();
    }

    /**
     * Report the ENS consignment's reference (DEC...) as soon as its draft is
     * created, so a run captures it even if a later step fails — mirroring the
     * movement LRN, which is reported at draft time too.
     */
    async verifyDraftConsignment(): Promise<void> {
        await ReportLog.step('Validate draft ENS consignment', async () => {
            const { consignmentReference, declarationStatus } =
                await this.consignmentOverviewPage.assertDraftConsignment();
            ReportLog.setParameter('ENS Consignment reference', consignmentReference);
            ReportLog.setParameter('ENS Consignment status (draft)', declarationStatus);
        });
    }

    /**
     * Report the standalone consignment's LRN as soon as its draft exists, so a run
     * captures it even if a later step fails - mirrors verifyDraftConsignment for ENS.
     * The expected prefix comes from the journey (IMMI "GLR", SFD "SFD", FFD "FFD"),
     * so this checks the journey that ran rather than any standalone reference.
     */
    async verifyStandaloneConsignmentLrn(expectedPrefix: RegExp): Promise<string> {
        return ReportLog.step('Validate standalone consignment LRN', async () => {
            const { consignmentReference, declarationStatus } =
                await this.consignmentOverviewPage.assertDraftStandaloneConsignment(expectedPrefix);
            ReportLog.setParameter('Consignment LRN', consignmentReference);
            // Only once submitted does this overview carry a Status row; reporting an
            // empty parameter before then would read as "status unknown/blank" rather
            // than "not yet shown".
            if (declarationStatus) {
                ReportLog.setParameter('Consignment status (draft)', declarationStatus);
            }

            // Returned as well as reported: a standalone declaration is named to CDS by
            // this reference and its MRN, and only the session that built it sees them.
            return consignmentReference;
        });
    }

    /**
     * After submit, verify the standalone consignment reached "Awaiting arrival" and
     * report the final status.
     */
    async verifyStandaloneConsignmentSubmitted(expectedStatusKey: TranslationKey): Promise<void> {
        await ReportLog.step('Verify standalone consignment submitted', async () => {
            const status = await this.consignmentOverviewPage.waitForSubmittedStatus(expectedStatusKey);
            ReportLog.setParameter('Consignment status (submitted)', status);

            // Reported first, then thrown: a journey that expected an authorisation
            // cannot do anything meaningful with a consignment the service handed back,
            // so it stops here - but the report still carries the status that stopped it.
            // Guarded on the expectation, so a journey that legitimately ends in this
            // state (as the ENS EIDR one does) would pass rather than fail here.
            const expectedIt = expectedStatusKey === 'status.traderInputRequired';
            if (!expectedIt && isTraderInputRequiredStatus(status, this.t)) {
                throw traderInputRequiredError('The standalone consignment', status);
            }
        });
    }


    /**
     * Check the supervising customs office the service derived for a WAREHOUSED
     * declaration. Called before submit: the row is populated as soon as the goods
     * item names a warehoused procedure code, so the check does not have to wait for
     * an authorisation - and a wrong office is worth knowing before submitting.
     *
     * Only warehoused journeys have the row at all, so the caller decides whether to
     * ask - see requiresWarehouseIdentifier, the same rule that decides whether the
     * goods-item wizard asks for the warehouse identifier in the first place.
     */
    async verifySupervisingCustomsOffice(expectedOffice: string): Promise<void> {
        await ReportLog.step('Verify supervising customs office', async () => {
            const office = await this.consignmentOverviewPage.assertSupervisingCustomsOffice(expectedOffice);
            ReportLog.setParameter('Supervising customs office', office);
        });
    }

    async verifySfdEidrDeclarationType(): Promise<void> {
        await ReportLog.step('Verify EIDR declaration type', async () => {
            const declarationType = await this.consignmentOverviewPage.assertEidrDeclarationType();
            ReportLog.setParameter('Declaration type', declarationType);
        });
    }

    /**
     * After a standalone submit, verify the consignment was assigned a movement
     * reference number opening with its type's country code.
     *
     * One method for every standalone journey that gets a generated MRN, taking the
     * label and the code - the same shape MovementOverviewFlow.verifyAutoGeneratedConsignment
     * uses for the ENS-generated SFD and IMMI consignments, so the two sides of the
     * suite check an MRN the same way rather than each growing its own copy.
     *
     * Not used by the EIDR route, which is never authorised with a generated MRN.
     */
    async verifyStandaloneConsignmentMrn(label: string, mrnCode: MrnCountryCode): Promise<string> {
        return ReportLog.step(`Verify ${label} MRN`, async () => {
            const mrn = await this.consignmentDetailPage.waitForMovementReferenceNumber();
            // Reported before the assertion, so a run that fails it still carries the
            // value that failed.
            ReportLog.setParameter(`${label} MRN`, mrn);
            expect.soft(mrn, `${label} MRN`).toMatch(mrnPrefix(mrnCode));
            return mrn;
        });
    }

    /** From the goods-item overview, return to the consignment overview via the
     *  breadcrumb and submit the consignment. */
    async submitConsignment(): Promise<void> {
        await ReportLog.step('Submit consignment', async () => {
            await this.consignmentOverviewPage.goToConsignmentOverview();
            await this.consignmentOverviewPage.clickConfirmAndSubmit();
        });
    }

    async declareHeaderPreviousDocuments(items: PreviousDocumentData[]): Promise<void> {
        if (items.length === 0) {
            return;
        }
        await ReportLog.step('Declare header previous documents', async () => {
            for (const [index, item] of items.entries()) {
                await ReportLog.step(`Add previous document ${index + 1} of ${items.length}`, async () => {
                    await this.consignmentOverviewPage.openNewHeaderPreviousDocument();
                    await this.previousDocumentDeclarePage.declarePreviousDocument(item);
                });
            }
        });
    }

    async declareHoldersOfAuthorisation(items: HolderOfAuthorisationData[]): Promise<void> {
        if (items.length === 0) {
            return;
        }
        await ReportLog.step('Declare holders of authorisation', async () => {
            for (const [index, item] of items.entries()) {
                await ReportLog.step(`Add holder of authorisation ${index + 1} of ${items.length}`, async () => {
                    await this.consignmentOverviewPage.openNewHolderOfAuthorisation();
                    await this.holderOfAuthorisationDeclarePage.declareHolderOfAuthorisation(item);
                });
            }
        });
    }
}
