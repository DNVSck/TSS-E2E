import { ReportLog } from '../core/report/report-log';
import { ConsignmentOverviewPage } from "../page-object/consignment-overview-page";
import { PreviousDocumentDeclarePage } from "../page-object/header-previous-documents-declare-page";
import { HolderOfAuthorisationDeclarePage } from "../page-object/holder-of-authorisation-declare-page";
import { PreviousDocumentData } from "../test-data/previous-document-data";
import { HolderOfAuthorisationData } from "../test-data/holder-of-authorisation-data";

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
    ) { }

    /** Return to the consignment overview (e.g. after adding a goods item, which
     *  ends on the goods-item overview). */
    async goToConsignmentOverview(): Promise<void> {
        await this.consignmentOverviewPage.goToConsignmentOverview();
    }

    /** From the goods-item overview, return to the consignment overview via the
     *  breadcrumb and submit the consignment. */
    async submitConsignment(): Promise<void> {
        await ReportLog.step('Submit consignment', async () => {
            // Capture the reference before navigating: here (goods-item overview)
            // the consignment is still a breadcrumb link.
            const consignmentReference = await this.consignmentOverviewPage.getConsignmentReference();
            ReportLog.setParameter('Consignment reference', consignmentReference);
            await ReportLog.info(`Consignment reference: ${consignmentReference}`);

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
