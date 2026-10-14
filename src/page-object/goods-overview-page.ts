import { BasePage } from "./base-page";
import { RENDER_TIMEOUT } from '../constant/timeout-constant';
import { Page, Locator, expect } from '@playwright/test';
import { TFunction } from '../fixtures/locale-fixture';
import { switchToTabAndClickNew, readFieldWhenVisible, newRecordButton, clickLinkAndWaitForNavigation, switchToTab, textsOf } from '../helper/element-helper';
import { waitForOpenTabPanel, OPEN_TAB_PANEL, OPEN_TAB_RECORD, deleteTabRecord } from './components/record-tabs';
import { GOVUK } from './components/govuk-selectors';
import { TgpRecordData } from "../test-data/tgp-record-data";
import { COUNTRY_NAME } from "../constant/country-code-dropdown-constant";

/** The goods-item overview summary list paints a beat after the item is created. */

/** One row of the "Document references" table, as the tab renders it. */
export interface DocumentReferenceRow {
    code: string;
    reference: string;
    status: string;
    reason: string;
}

export class GoodsOverviewPage extends BasePage {

    // Summary-list rows the service populates from the chosen TGP record.
    private readonly commodityCode: Locator;
    private readonly goodsDescription: Locator;
    private readonly supplementaryUnits: Locator;
    private readonly countryOfOrigin: Locator;

    private readonly documentTab: Locator;
    private readonly newDocumentRefButton: Locator;
    private readonly openTabRecords: Locator;
    private readonly documentReferenceRows: Locator;

    private readonly additionalProcedureCodesTab: Locator;
    private readonly newAdditionalProcedureCodeButton: Locator;

    private readonly previousDocumentsTab: Locator;
    private readonly newPreviousDocumentButton: Locator;

    private readonly additionalInformationTab: Locator;
    private readonly newAdditionalInformationButton: Locator;

    private readonly taricAdditionalCodesTab: Locator;
    private readonly newTaricAdditionalCodeButton: Locator;

    private readonly nationalAdditionalCodesTab: Locator;
    private readonly newNationalAdditionalCodeButton: Locator;

    constructor(page: Page, t: TFunction) {
        super(page, t);

        this.commodityCode = this.summaryList.valueOf(t('goodsItemOverview.commodityCode'));
        this.goodsDescription = this.summaryList.valueOf(t('goodsItemOverview.goodsDescription'));
        this.supplementaryUnits = this.summaryList.valueOf(t('goodsItemOverview.supplementaryUnits'));
        this.countryOfOrigin = this.summaryList.valueOf(t('goodsItemOverview.countryOfOrigin'));

        //Tab list
        this.documentTab = page.locator("//a[contains(@href, '/overview/#overview-tab')]");
        this.additionalProcedureCodesTab = page.locator("//a[contains(@href, '/additional-procedure-codes/#overview-tab')]");
        this.previousDocumentsTab = page.locator("//a[contains(@href, '/previous-documents/#overview-tab')]");
        this.additionalInformationTab = page.locator("//a[contains(@href, '/additional-information/#overview-tab')]");
        this.taricAdditionalCodesTab = page.locator("//a[contains(@href, '/taric-additional-codes/#overview-tab')]");
        this.nationalAdditionalCodesTab = page.locator("//a[contains(@href, '/national-additional-codes/#overview-tab')]");

        this.newDocumentRefButton = newRecordButton(page, '?index');
        this.newAdditionalProcedureCodeButton = newRecordButton(page, '/additional-procedure-codes');
        this.newPreviousDocumentButton = newRecordButton(page, '/previous-documents');
        this.newAdditionalInformationButton = newRecordButton(page, '/additional-information');
        this.newTaricAdditionalCodeButton = newRecordButton(page, '/taric-additional-codes');
        this.newNationalAdditionalCodeButton = newRecordButton(page, '/national-additional-codes');
        this.openTabRecords = page.locator(OPEN_TAB_RECORD);
        this.documentReferenceRows = page.locator(
            `${OPEN_TAB_PANEL} ${GOVUK.TABLE.BODY} ${GOVUK.TABLE.ROW}`
        );
    }

    /**
     * Assert the goods-item fields the service fills in from the chosen TGP record.
     * The test never types these — that is the point of TGP — so this is the only
     * check that the record was applied rather than merely selected. The overview no
     * longer states WHICH record was chosen, so the record's own values are what
     * identify it: two records that differ at all differ in these.
     *
     * Soft, and every field is read before any of them is asserted, so one wrong
     * value neither hides the others nor stops the journey completing.
     */
    async assertTgpPopulatedFields(record: TgpRecordData, showsSupplementaryUnits: boolean): Promise<void> {
        const commodityCode = await readFieldWhenVisible(this.commodityCode, RENDER_TIMEOUT.SUMMARY_LIST);
        const goodsDescription = await readFieldWhenVisible(this.goodsDescription, RENDER_TIMEOUT.SUMMARY_LIST);
        const countryOfOrigin = await readFieldWhenVisible(this.countryOfOrigin, RENDER_TIMEOUT.SUMMARY_LIST);

        // The row is read when it should be there and COUNTED when it should not, so both
        // outcomes are read before anything is asserted, as above.
        const supplementaryUnits = showsSupplementaryUnits
            ? await readFieldWhenVisible(this.supplementaryUnits, RENDER_TIMEOUT.SUMMARY_LIST)
            : undefined;
        const supplementaryUnitRows = showsSupplementaryUnits
            ? undefined
            : await this.supplementaryUnits.count();

        expect.soft(commodityCode, 'Commodity code from TGP').toBe(record.commodityCode);
        expect.soft(goodsDescription, 'Goods description from TGP').toBe(record.goodsDescription);
        // The record holds the code; the summary list prints the name.
        expect.soft(countryOfOrigin, 'Country of origin from TGP').toBe(COUNTRY_NAME[record.countryOfOrigin]);

        if (showsSupplementaryUnits) {
            // Supplementary units are optional on the record. The row is rendered either
            // way, showing "Not provided" when the record carries none - so that absence
            // is asserted too rather than skipped.
            expect.soft(supplementaryUnits, 'Supplementary units from TGP')
                .toBe(record.supplementaryUnits || this.t!('common.notProvided'));
        } else {
            // Some additional procedure codes take the field off the wizard, and the
            // summary list drops the row with it. Asserted rather than skipped: the three
            // reads above have already established that the screen rendered, so an empty
            // count here means the row is genuinely gone - and this fails loudly if the
            // service ever starts showing it again.
            expect.soft(supplementaryUnitRows, 'Supplementary units row, hidden by the additional procedure code')
                .toBe(0);
        }
    }

    async declareNewDocumentReference(): Promise<void> {
        await switchToTabAndClickNew(this.page,this.documentTab, this.newDocumentRefButton);
    }

    async declareNewAdditionalProcedureCode(): Promise<void> {
        await switchToTabAndClickNew(this.page,this.additionalProcedureCodesTab, this.newAdditionalProcedureCodeButton);
    }

    async declareNewPreviousDocument(): Promise<void> {
        await switchToTabAndClickNew(this.page,this.previousDocumentsTab, this.newPreviousDocumentButton);
    }

    async declareNewAdditionalInformation(): Promise<void> {
        await switchToTabAndClickNew(this.page,this.additionalInformationTab, this.newAdditionalInformationButton);
    }

    async declareNewTaricAdditionalCode(): Promise<void> {
        await switchToTabAndClickNew(this.page,this.taricAdditionalCodesTab, this.newTaricAdditionalCodeButton);
    }

    async declareNewNationalAdditionalCode(): Promise<void> {
        await switchToTabAndClickNew(this.page,this.nationalAdditionalCodesTab, this.newNationalAdditionalCodeButton);
    }


    async listDocumentReferenceRecords(): Promise<DocumentReferenceRow[]> {
        await switchToTab(this.page, this.documentTab);
        await waitForOpenTabPanel(this.page, RENDER_TIMEOUT.TAB_PANEL);

        const rows = await this.documentReferenceRows.all();

        return Promise.all(rows.map(async row => {
            const [code, reference, status, reason] =
                await row.locator(GOVUK.TABLE.CELL).allTextContents();

            return {
                code: code?.trim() ?? '',
                reference: reference?.trim() ?? '',
                status: status?.trim() ?? '',
                reason: reason?.trim() ?? '',
            };
        }));
    }

    async deleteAdditionalProcedureCode(code: string): Promise<void> {
        await switchToTab(this.page, this.additionalProcedureCodesTab);
        await waitForOpenTabPanel(this.page, RENDER_TIMEOUT.TAB_PANEL);
        await deleteTabRecord(this.openTabRecords, `${code}:`);
    }

    async listAdditionalProcedureCodes(): Promise<string[]> {
        await switchToTab(this.page, this.additionalProcedureCodesTab);
        await waitForOpenTabPanel(this.page, RENDER_TIMEOUT.TAB_PANEL);
        const records = await textsOf(this.openTabRecords);
        return records.map(record => record.split(':')[0].trim());
    }

    /**
     * Open one document-reference record for editing, found by its DOCUMENT CODE.
     *
     * Never by position: the route carries an index, which makes "the first record" look
     * like a stable address when it is only the order the service rendered, and a goods
     * item declaring two documents would hand the wrong one to a correction without
     * anything noticing.
     *
     * The table gives the code its own link, carrying it in `title`, so the record is
     * addressed by that rather than by matching text across the row. A row's other
     * cells can hold anything, and a reference that happened to contain a document
     * code would otherwise match it.
     *
     * Scoped to the open tab panel, so a record on another tab cannot be matched.
     */
    async openDocumentReferenceRecord(documentCode: string): Promise<void> {
        const link = this.page.locator(OPEN_TAB_PANEL)
            .locator(`a[title="${documentCode}"]`);

        await clickLinkAndWaitForNavigation(this.page, link);
    }
}