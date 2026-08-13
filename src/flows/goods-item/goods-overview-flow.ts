import { ReportLog } from '../../core/report/report-log';
import { GoodsOverviewPage } from "../../page-object/goods-overview-page";
import { DocumentReferenceDeclarePage } from "../../page-object/document-reference-declare-page";
import { AdditionalInformationDeclarePage } from "../../page-object/additional-information-declare-page";
import { PreviousDocumentDeclarePage } from "../../page-object/header-previous-documents-declare-page";
import { AdditionalProcedureCodeDeclarePage } from "../../page-object/additional-procedure-code-declare-page";
import { TaricAdditionalCodeDeclarePage } from "../../page-object/taric-additional-code-declare-page";
import { NationalAdditionalCodeDeclarePage } from "../../page-object/national-additional-code-declare-page";
import { DocumentReferenceData } from "../../test-data/document-reference-data";
import { AdditionalInformationData } from "../../test-data/additional-information-data";
import { PreviousDocumentData } from "../../test-data/previous-document-data";
import { TgpRecordData } from "../../test-data/tgp-record-data";

/**
 * Declares the goods-item overview tabs that each hold a list of records
 * (Document references, Additional procedure codes, Previous documents, ...).
 * Every method is a no-op on an empty list, so a goods item that declares none
 * of these is unaffected.
 */
export class GoodsOverviewFlow {
    constructor(
        private readonly goodsOverviewPage: GoodsOverviewPage,
        private readonly documentReferenceDeclarePage: DocumentReferenceDeclarePage,
        private readonly additionalInformationDeclarePage: AdditionalInformationDeclarePage,
        private readonly previousDocumentDeclarePage: PreviousDocumentDeclarePage,
        private readonly additionalProcedureCodeDeclarePage: AdditionalProcedureCodeDeclarePage,
        private readonly taricAdditionalCodeDeclarePage: TaricAdditionalCodeDeclarePage,
        private readonly nationalAdditionalCodeDeclarePage: NationalAdditionalCodeDeclarePage,
    ) { }

    /**
     * Verify the goods-item fields the service populated from the chosen TGP record.
     * A no-op unless the item was actually declared from a TGP, so every other
     * journey is unaffected.
     */
    async verifyTgpPopulatedFields(record?: TgpRecordData): Promise<void> {
        if (!record) {
            return;
        }

        await ReportLog.step('Verify the goods item was populated from the TGP record', async () => {
            await this.goodsOverviewPage.assertTgpPopulatedFields(record);
        });
    }

    async declareDocumentReferences(items: DocumentReferenceData[]): Promise<void> {
        if (items.length === 0) {
            return;
        }

        await ReportLog.step('Declare document references', async () => {
            for (const [index, item] of items.entries()) {
                await ReportLog.step(`Add document reference ${index + 1} of ${items.length}`, async () => {
                    await this.goodsOverviewPage.declareNewDocumentReference();
                    await this.documentReferenceDeclarePage.declareDocumentReference(item);
                });
            }
        });
    }

    async declareAdditionalInformations(items: AdditionalInformationData[]): Promise<void> {
        if (items.length === 0) {
            return;
        }

        await ReportLog.step('Declare additional information', async () => {
            for (const [index, item] of items.entries()) {
                await ReportLog.step(`Add additional information ${index + 1} of ${items.length}`, async () => {
                    await this.goodsOverviewPage.declareNewAdditionalInformation();
                    await this.additionalInformationDeclarePage.declareAdditionalInformation(item);
                });
            }
        });
    }

    /**
     * The goods item's "Previous documents" tab reuses the consignment's
     * header-previous-document wizard (same screens, field ids and document types).
     */
    async declarePreviousDocuments(items: PreviousDocumentData[]): Promise<void> {
        if (items.length === 0) {
            return;
        }

        await ReportLog.step('Declare previous documents', async () => {
            for (const [index, item] of items.entries()) {
                await ReportLog.step(`Add previous document ${index + 1} of ${items.length}`, async () => {
                    await this.goodsOverviewPage.declareNewPreviousDocument();
                    await this.previousDocumentDeclarePage.declarePreviousDocument(item);
                });
            }
        });
    }

    async declareAdditionalProcedureCodes(codes: string[]): Promise<void> {
        if (codes.length === 0) {
            return;
        }

        await ReportLog.step('Declare additional procedure codes', async () => {
            for (const [index, code] of codes.entries()) {
                await ReportLog.step(`Add additional procedure code ${index + 1} of ${codes.length}`, async () => {
                    await this.goodsOverviewPage.declareNewAdditionalProcedureCode();
                    await this.additionalProcedureCodeDeclarePage.declareAdditionalProcedureCode(code);
                });
            }
        });
    }

    async declareTaricAdditionalCodes(codes: string[]): Promise<void> {
        if (codes.length === 0) {
            return;
        }

        await ReportLog.step('Declare taric additional codes', async () => {
            for (const [index, code] of codes.entries()) {
                await ReportLog.step(`Add taric additional code ${index + 1} of ${codes.length}`, async () => {
                    await this.goodsOverviewPage.declareNewTaricAdditionalCode();
                    await this.taricAdditionalCodeDeclarePage.declareTaricAdditionalCode(code);
                });
            }
        });
    }

    async declareNationalAdditionalCodes(codes: string[]): Promise<void> {
        if (codes.length === 0) {
            return;
        }

        await ReportLog.step('Declare national additional codes', async () => {
            for (const [index, code] of codes.entries()) {
                await ReportLog.step(`Add national additional code ${index + 1} of ${codes.length}`, async () => {
                    await this.goodsOverviewPage.declareNewNationalAdditionalCode();
                    await this.nationalAdditionalCodeDeclarePage.declareNationalAdditionalCode(code);
                });
            }
        });
    }
}
