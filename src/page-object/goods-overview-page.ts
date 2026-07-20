import { BasePage } from "./base-page";
import { Page, Locator } from '@playwright/test';
import { switchToTabAndClickNew } from '../core/util/element-helper';

export class GoodsOverviewPage extends BasePage {
    
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

    constructor(page: Page) {
        super(page);

        //Tab list
        this.documentTab = page.locator("//a[contains(@href, '/overview/#overview-tab')]");
        this.additionalProcedureCodesTab = page.locator("//a[contains(@href, '/additional-procedure-codes/#overview-tab')]");
        this.previousDocumentsTab = page.locator("//a[contains(@href, '/previous-documents/#overview-tab')]");
        this.additionalInformationTab = page.locator("//a[contains(@href, '/additional-information/#overview-tab')]");
        this.taricAdditionalCodesTab = page.locator("//a[contains(@href, '/taric-additional-codes/#overview-tab')]");
        this.nationalAdditionalCodesTab = page.locator("//a[contains(@href, '/national-additional-codes/#overview-tab')]");

        this.newDocumentRefButton = page.locator("form[action*='?index'] button[value='new-record']");
        this.newAdditionalProcedureCodeButton = page.locator("form[action*='/additional-procedure-codes'] button[value='new-record']");
        this.newPreviousDocumentButton = page.locator("form[action*='/previous-documents'] button[value='new-record']");
        this.newAdditionalInformationButton = page.locator("form[action*='/additional-information'] button[value='new-record']");
        this.newTaricAdditionalCodeButton = page.locator("form[action*='/taric-additional-codes'] button[value='new-record']");
        this.newNationalAdditionalCodeButton = page.locator("form[action*='/national-additional-codes'] button[value='new-record']");
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