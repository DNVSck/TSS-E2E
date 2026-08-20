import { BasePage } from "./base-page";
import { Page, Locator } from '@playwright/test';
import { TFunction } from '../fixtures/locale-fixture';
import {
    switchToTabAndClickNew, summaryListValue, readFieldWhenVisible, newRecordButton,
    clickLinkAndWaitForNavigation,
} from '../helper/element-helper';
import { OPEN_TAB_RECORD, RECORD_LINK } from './components/record-tabs';


/** The goods-item overview summary list paints a beat after the item is created. */
const SUMMARY_READ_TIMEOUT = 20_000;

/** The goods-item rows the service fills in from a chosen TGP record. */
export interface TgpPopulatedFields {
    useTgp: string;
    chosenTgp: string;
    commodityCode: string;
    goodsDescription: string;
    countryOfOrigin: string;
    supplementaryUnits: string;
}

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
    async readTgpPopulatedFields(): Promise<TgpPopulatedFields> {
        return {
            useTgp: await readFieldWhenVisible(this.useTraderGoodsProfile, SUMMARY_READ_TIMEOUT),
            chosenTgp: await readFieldWhenVisible(this.chosenTraderGoodsProfile, SUMMARY_READ_TIMEOUT),
            commodityCode: await readFieldWhenVisible(this.commodityCode, SUMMARY_READ_TIMEOUT),
            goodsDescription: await readFieldWhenVisible(this.goodsDescription, SUMMARY_READ_TIMEOUT),
            countryOfOrigin: await readFieldWhenVisible(this.countryOfOrigin, SUMMARY_READ_TIMEOUT),
            supplementaryUnits: await readFieldWhenVisible(this.supplementaryUnits, SUMMARY_READ_TIMEOUT),
        };
    }

    async declareNewDocumentReference(): Promise<void> {
        await switchToTabAndClickNew(this.page,this.documentTab, this.newDocumentRefButton);
    }

    /**
     * Open a document reference that is ALREADY on this goods item, to correct it.
     *
     * There is no Change link on the record - the record IS the link, and opening it
     * re-enters the wizard that created it, the same way a holder-of-authorisation
     * record does. "start" is a launcher the service answers with a redirect, so this
     * waits for a navigation rather than for a route it can predict.
     *
     * Found by the DOCUMENT CODE it is labelled with, not by position. The route carries
     * an index, but that index is the order the service rendered - not an identity a
     * caller can rely on, and a goods item declaring two documents would hand the wrong
     * one to a correction without anything noticing. Same fix as the one made to
     * holder-of-authorisation records.
     *
     * A bare substring here, unlike the bracketed match authorisation type codes need:
     * customs document codes are four characters and none is a prefix of another, so
     * "N730" cannot pick up a neighbour the way "EXW" would pick up "EXWH".
     *
     * Scoped to the open tab panel, so a record on another tab cannot be matched.
     */
    async openDocumentReferenceRecord(documentCode: string): Promise<void> {
        const record = this.page.locator(OPEN_TAB_RECORD).filter({ hasText: documentCode });

        await clickLinkAndWaitForNavigation(this.page, record.locator(RECORD_LINK));
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