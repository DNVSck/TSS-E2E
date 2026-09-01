import { BasePage } from "./base-page";
import { Page, Locator, expect } from '@playwright/test';
import { TFunction } from '../fixtures/locale-fixture';
import { switchToTabAndClickNew, summaryListValue, readFieldWhenVisible, newRecordButton } from '../helper/element-helper';
import { TgpRecordData } from "../test-data/tgp-record-data";
import { COUNTRY_NAME } from "../constant/country-code-dropdown-constant";

/** The goods-item overview summary list paints a beat after the item is created. */
const SUMMARY_READ_TIMEOUT = 20_000;

export class GoodsOverviewPage extends BasePage {

    // Summary-list rows the service populates from the chosen TGP record.
    private readonly useTraderGoodsProfile: Locator;
    private readonly chosenTraderGoodsProfile: Locator;
    private readonly commodityCode: Locator;
    private readonly goodsDescription: Locator;
    private readonly supplementaryUnits: Locator;
    private readonly countryOfOrigin: Locator;

    private readonly documentTab: Locator;
    private readonly newDocumentRefButton: Locator;

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

        this.useTraderGoodsProfile = summaryListValue(page, t('goodsItemOverview.useTraderGoodsProfile'));
        this.chosenTraderGoodsProfile = summaryListValue(page, t('goodsItemOverview.chosenTraderGoodsProfile'));
        this.commodityCode = summaryListValue(page, t('goodsItemOverview.commodityCode'));
        this.goodsDescription = summaryListValue(page, t('goodsItemOverview.goodsDescription'));
        this.supplementaryUnits = summaryListValue(page, t('goodsItemOverview.supplementaryUnits'));
        this.countryOfOrigin = summaryListValue(page, t('goodsItemOverview.countryOfOrigin'));

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
    }

    /**
     * Assert the goods-item fields the service fills in from the chosen TGP record.
     * The test never types these — that is the point of TGP — so this is the only
     * check that the record was applied rather than merely selected.
     *
     * Soft, and every field is read before any of them is asserted, so one wrong
     * value neither hides the others nor stops the journey completing.
     */
    async assertTgpPopulatedFields(record: TgpRecordData, showsSupplementaryUnits: boolean): Promise<void> {
        const useTgp = await readFieldWhenVisible(this.useTraderGoodsProfile, SUMMARY_READ_TIMEOUT);
        const chosenTgp = await readFieldWhenVisible(this.chosenTraderGoodsProfile, SUMMARY_READ_TIMEOUT);
        const commodityCode = await readFieldWhenVisible(this.commodityCode, SUMMARY_READ_TIMEOUT);
        const goodsDescription = await readFieldWhenVisible(this.goodsDescription, SUMMARY_READ_TIMEOUT);
        const countryOfOrigin = await readFieldWhenVisible(this.countryOfOrigin, SUMMARY_READ_TIMEOUT);

        // The row is read when it should be there and COUNTED when it should not, so both
        // outcomes are read before anything is asserted, as above.
        const supplementaryUnits = showsSupplementaryUnits
            ? await readFieldWhenVisible(this.supplementaryUnits, SUMMARY_READ_TIMEOUT)
            : undefined;
        const supplementaryUnitRows = showsSupplementaryUnits
            ? undefined
            : await this.supplementaryUnits.count();

        expect.soft(useTgp, 'Use a Trader Goods Profile').toBe(this.t!('common.yes'));
        expect.soft(chosenTgp, 'Chosen TGP record').toBe(record.recordId);
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
            // summary list drops the row with it. Asserted rather than skipped: the five
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

}