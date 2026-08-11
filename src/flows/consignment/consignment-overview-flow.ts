import { expect } from '@playwright/test';
import { ReportLog } from '../../core/report/report-log';
import { ConsignmentOverviewPage } from "../../page-object/consignment-overview-page";
import { PreviousDocumentDeclarePage } from "../../page-object/header-previous-documents-declare-page";
import { HolderOfAuthorisationDeclarePage } from "../../page-object/holder-of-authorisation-declare-page";
import { ConsignmentDetailPage } from '../../page-object/consignment-detail-page';
import { PreviousDocumentData } from "../../test-data/previous-document-data";
import { HolderOfAuthorisationData } from "../../test-data/holder-of-authorisation-data";

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
    ) { }

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
    async verifyStandaloneConsignmentLrn(expectedPrefix: RegExp): Promise<void> {
        await ReportLog.step('Validate standalone consignment LRN', async () => {
            const { consignmentReference, declarationStatus } =
                await this.consignmentOverviewPage.assertDraftStandaloneConsignment(expectedPrefix);
            ReportLog.setParameter('Consignment LRN', consignmentReference);
            // Only once submitted does this overview carry a Status row; reporting an
            // empty parameter before then would read as "status unknown/blank" rather
            // than "not yet shown".
            if (declarationStatus) {
                ReportLog.setParameter('Consignment status (draft)', declarationStatus);
            }
        });
    }

    /**
     * After submit, verify the standalone consignment reached "Awaiting arrival" and
     * report the final status.
     */
    async verifyStandaloneConsignmentSubmitted(): Promise<void> {
        await ReportLog.step('Verify standalone consignment submitted', async () => {
            const status = await this.consignmentOverviewPage.waitForStatusAwaitingArrival();
            ReportLog.setParameter('Consignment status (submitted)', status);
        });
    }

    /**
         * After SFD-EIDR submit, verify the consignment's declaration type is
         * "Entry in the Declarant's Records (EIDR)" and that an MRN is assigned.
         */
    async verifySfdEidrDeclarationTypeAndMrn(): Promise<void> {
        await ReportLog.step('Verify EIDR declaration type and MRN', async () => {
            const declarationType = await this.consignmentOverviewPage.assertEidrDeclarationType();
            ReportLog.setParameter('Declaration type', declarationType);

            const mrn = await this.consignmentDetailPage.waitForMovementReferenceNumber();
            expect.soft(mrn, 'EIDR MRN assigned').not.toBe('');
            ReportLog.setParameter('EIDR MRN', mrn);
        });
    }

    /**
 * After SFD submit, verify the consignment's status is "Awaiting arrival" and
 * that an MRN is assigned. SFD consignments (unlike EIDR) always get an MRN
 * when authorised.
 */
    async verifySfdConsignmentMrn(): Promise<void> {
        await ReportLog.step('Verify SFD MRN', async () => {
            const mrn = await this.consignmentDetailPage.waitForMovementReferenceNumber();
            expect.soft(mrn, 'SFD MRN assigned').not.toBe('');
            ReportLog.setParameter('SFD MRN', mrn);
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
