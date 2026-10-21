import { expect, TestInfo } from '@playwright/test';
import { ReportLog } from '../../core/report/report-log';
import { GoodsOverviewPage, DocumentReferenceRow } from "../../page-object/goods-overview-page";
import { TFunction } from '../../fixtures/locale-fixture';
import { DocumentReferenceDeclarePage } from "../../page-object/document-reference-declare-page";
import { AdditionalInformationDeclarePage } from "../../page-object/additional-information-declare-page";
import { PreviousDocumentDeclarePage } from "../../page-object/header-previous-documents-declare-page";
import { AdditionalProcedureCodeDeclarePage } from "../../page-object/additional-procedure-code-declare-page";
import { TaricAdditionalCodeDeclarePage } from "../../page-object/taric-additional-code-declare-page";
import { NationalAdditionalCodeDeclarePage } from "../../page-object/national-additional-code-declare-page";
import { DocumentReferenceData, documentReference } from "../../test-data/document-reference-data";
import {
    AdditionalInformationData, additionalInformation,
} from "../../test-data/additional-information-data";
import { PreviousDocumentData, previousDocument } from "../../test-data/previous-document-data";
import { TgpRecordData } from "../../test-data/tgp-record-data";
import { hidesSupplementaryUnit } from "../../helper/procedure-code-helper";
import { nirmsDocumentCitations } from '../../test-data/nirms-data';
import { AUDIT_RECORD_SAMPLE } from '../../test-data/goods-data';
import { ADDITIONAL_PROCEDURE_CODES } from '../../constant/additional-procedure-codes-constant';
import { NATIONAL_ADDITIONAL_CODE } from '../../constant/national-additional-code-constant';
import { AccessibilityAudit } from '../accessibility-audit-flow';
import { verifySubmittedWithoutErrors } from '../../helper/declaration-status-helper';
import { DOCUMENT_CODE } from '../../constant/document-code-constant';
import { IMPORTER_NIRMS } from '../../../config/environment';

const DESCRIPTION_ATTEMPTS = 3;

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
        // Held for the same reason the other flows hold it: the values below are compared
        // against translated text, but deciding whether the record was applied is this
        // layer's judgement, not the page's.
        private readonly t: TFunction,
    ) { }

    /**
     * Verify the goods-item fields the service populated from the chosen TGP record.
     * A no-op unless the item was actually declared from a TGP, so every other
     * journey is unaffected.
     *
     * The additional procedure code comes in because it decides whether one of those
     * rows exists at all - the same rule the wizard applies to the field itself, read
     * here from the same helper so the two cannot drift apart.
     */
    async verifyTgpPopulatedFields(
        record: TgpRecordData | undefined,
        additionalProcedureCode: string
    ): Promise<void> {
        if (!record) {
            return;
        }

        await ReportLog.step('Verify the goods item was populated from the TGP record', async () => {
            await this.goodsOverviewPage.assertTgpPopulatedFields(
                record,
                !hidesSupplementaryUnit(additionalProcedureCode)
            );
        });
    }



    async verifyDocumentReferences(
        expected: DocumentReferenceData[], on = 'Goods'
    ): Promise<void> {
        await ReportLog.step(`Validate the ${on} document references`, async () => {
            const rows = await this.goodsOverviewPage.listDocumentReferenceRecords();

            ReportLog.setParameter(`${on} document references`, this.describeDocumentRows(rows));

            for (const document of expected) {
                const row = rows.find(listed => listed.code === document.documentCode);

                expect.soft(row,
                    `documents cited by the goods item should include ${document.documentCode} `
                    + `- codes listed (${rows.map(listed => listed.code).join(', ') || 'none'})`)
                    .toBeDefined();

                if (!row) {
                    continue;
                }

                this.verifyDocumentCell(row.reference, document.documentReference, document.documentCode, 'reference');
                this.verifyDocumentCell(row.status, document.documentStatus, document.documentCode, 'status');
                this.verifyDocumentCell(row.reason, document.documentReason, document.documentCode, 'reason');
            }
        });
    }

    /** A no-op without an audit, so a functional run never opens these wizards. */
    async auditRecordWizards(
        audit: AccessibilityAudit | undefined,
        testInfo: TestInfo
    ): Promise<void> {
        if (!audit) {
            return;
        }

        const record = 'Goods item';

        await audit.verifyWizard({
            testInfo, record, name: 'document reference',
            open: () => this.goodsOverviewPage.declareNewDocumentReference(),
            steps: () => this.documentReferenceDeclarePage.steps(documentReference()),
        });

        await audit.verifyWizard({
            testInfo, record, name: 'additional information',
            open: () => this.goodsOverviewPage.declareNewAdditionalInformation(),
            steps: () => this.additionalInformationDeclarePage.steps(additionalInformation()),
        });

        await audit.verifyWizard({
            testInfo, record, name: 'previous document',
            open: () => this.goodsOverviewPage.declareNewPreviousDocument(),
            steps: () => this.previousDocumentDeclarePage.steps(previousDocument()),
        });

        await audit.verifyWizard({
            testInfo, record, name: 'additional procedure code',
            open: () => this.goodsOverviewPage.declareNewAdditionalProcedureCode(),
            steps: () => this.additionalProcedureCodeDeclarePage.steps(
                ADDITIONAL_PROCEDURE_CODES.SPIMM_STANDARD_GOODS_1SG),
        });

        await audit.verifyWizard({
            testInfo, record, name: 'TARIC additional code',
            open: () => this.goodsOverviewPage.declareNewTaricAdditionalCode(),
            steps: () => this.taricAdditionalCodeDeclarePage.steps(
                AUDIT_RECORD_SAMPLE.taricAdditionalCode),
        });

        await audit.verifyWizard({
            testInfo, record, name: 'national additional code',
            open: () => this.goodsOverviewPage.declareNewNationalAdditionalCode(),
            steps: () => this.nationalAdditionalCodeDeclarePage.steps(
                NATIONAL_ADDITIONAL_CODE.VATZ),
        });
    }

    /** One entry per row, so a failure names every document that WAS cited. */
    private describeDocumentRows(rows: DocumentReferenceRow[]): string {
        return rows
            .map(row => [row.code, row.reference, row.status, row.reason]
                .filter(Boolean).join(' / '))
            .join(' | ') || 'none';
    }

    private verifyDocumentCell(
        actual: string,
        expected: string | undefined,
        documentCode: string,
        field: string
    ): void {
        if (expected === undefined) {
            return;
        }

        const wanted = expected === '' ? 'to be empty' : `"${expected}"`;

        expect.soft(actual,
            `${documentCode} ${field} on the goods item (expected ${wanted})`)
            .toBe(expected);
    }

    async verifyNirmsDocumentReferences(nirmsDocumentCodes: string[]): Promise<void> {
        if (nirmsDocumentCodes.length === 0) {
            return;
        }

        const citations = nirmsDocumentCitations(nirmsDocumentCodes, new Date().getFullYear());

        await this.verifyDocumentReferences(citations);
    }

    async verifyAdditionalProcedureCodes(expected: string[]): Promise<void> {
        await ReportLog.step('Validate the goods item additional procedure codes', async () => {
            const codes = await this.goodsOverviewPage.listAdditionalProcedureCodes();
            ReportLog.setParameter('Additional procedure codes', codes.join(', '));

            for (const code of expected) {
                expect.soft(codes,
                    `additional procedure codes on the goods item (must include ${code})`)
                    .toContain(code);
            }
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
                    verifySubmittedWithoutErrors(await this.documentReferenceDeclarePage.declareDocumentReference(item), 'the document reference');
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
                    await this.additionalInformationDeclarePage.selectAdditionalInformationCode(item.code);
                    await this.additionalInformationDeclarePage.enterDescription(item.description);
                    await this.ensureDescriptionReachedTheRecord(item);
                    verifySubmittedWithoutErrors(await this.additionalInformationDeclarePage.confirmAndSubmit(), 'the additional information');
                });
            }
        });
    }


    private async ensureDescriptionReachedTheRecord(item: AdditionalInformationData): Promise<void> {
        let summary: string[] = [];

        for (let attempt = 1; attempt <= DESCRIPTION_ATTEMPTS; attempt++) {
            summary = await this.additionalInformationDeclarePage.listSummaryValues();

            if (summary.includes(item.description)) {
                return;
            }

            if (attempt === DESCRIPTION_ATTEMPTS) {
                break;
            }

            await ReportLog.info(
                `Additional information "${item.code}" reached Check your answers without its `
                + `description on attempt ${attempt}; going back to enter it again.`
            );

            await this.additionalInformationDeclarePage.clickBackLink();
            await this.additionalInformationDeclarePage.enterDescription(item.description);
        }

        ReportLog.setParameter(`Additional info ${item.code}`, summary.join(' | '));

        expect(
            summary,
            `additional information "${item.code}" should carry its description after `
            + `${DESCRIPTION_ATTEMPTS} attempts - values shown on Check your answers `
            + `(a dropped field reads "Not provided")`
        ).toContain(item.description);
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
                    verifySubmittedWithoutErrors(await this.previousDocumentDeclarePage.declarePreviousDocument(item), 'the previous document');
                });
            }
        });
    }

    async verifyImmiNirmsDocumentReference(): Promise<void> {
        await this.verifyDocumentReferences([
            documentReference({
                documentCode: DOCUMENT_CODE['1RMS'],
                documentReference: IMPORTER_NIRMS,
                documentStatus: undefined,
                documentReason: undefined,
            }),
        ], 'IMMI');
    }

    async removeAdditionalProcedureCode(code: string): Promise<void> {
        await ReportLog.step(`Remove the "${code}" additional procedure code`, () =>
            this.goodsOverviewPage.deleteAdditionalProcedureCode(code)
        );
    }

    async declareAdditionalProcedureCodes(codes: string[]): Promise<void> {
        if (codes.length === 0) {
            return;
        }

        await ReportLog.step('Declare additional procedure codes', async () => {
            for (const [index, code] of codes.entries()) {
                await ReportLog.step(`Add additional procedure code ${index + 1} of ${codes.length}`, async () => {
                    await this.goodsOverviewPage.declareNewAdditionalProcedureCode();
                    verifySubmittedWithoutErrors(await this.additionalProcedureCodeDeclarePage.declareAdditionalProcedureCode(code), 'the additional procedure code');
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
                    verifySubmittedWithoutErrors(await this.taricAdditionalCodeDeclarePage.declareTaricAdditionalCode(code), 'the TARIC additional code');
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
                    verifySubmittedWithoutErrors(await this.nationalAdditionalCodeDeclarePage.declareNationalAdditionalCode(code), 'the national additional code');
                });
            }
        });
    }

    /**
     * Correct a document reference already on this goods item.
     *
     * Opening the record re-enters the wizard it was created through, so the same step
     * that declared it declares it again - exactly as correcting a holder-of-authorisation
     * record does. Assumes the goods item is open on its Document references tab, which
     * is the tab it opens on.
     */
    async correctDocumentReference(
        item: DocumentReferenceData,
        documentCode: string = item.documentCode
    ): Promise<void> {
        await ReportLog.step(`Correct the "${documentCode}" document reference`, async () => {
            await this.goodsOverviewPage.openDocumentReferenceRecord(documentCode);
            verifySubmittedWithoutErrors(await this.documentReferenceDeclarePage.declareDocumentReference(item), 'the document reference');
        });
    }
}
