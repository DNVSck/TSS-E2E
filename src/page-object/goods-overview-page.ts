import { BasePage } from "./base-page";
import { Page, Locator } from '@playwright/test';

export class GoodsOverviewPage extends BasePage {
    
    private readonly documentTab: Locator;
    private readonly newDocumentRefButton: Locator;

    private readonly attachmentsTab: Locator;

    private readonly additionalProcedureCodesTab: Locator;
    private readonly newAdditionalProcedureCodeButton: Locator;

    private readonly previousDocumentsTab: Locator;
    private readonly newPreviousDocumentButton: Locator;

    private readonly additionalInformationTab: Locator;
    private readonly newAdditionalInformationButton: Locator;

    constructor(page: Page) {
        super(page);

        //Tab list
        this.documentTab = page.locator("//a[contains(@href, '/overview/#overview-tab')]");
        this.attachmentsTab = page.locator("//a[contains(@href, '/attachments/#overview-tab')]");
        this.additionalProcedureCodesTab = page.locator("//a[contains(@href, '/additional-procedure-codes/#overview-tab')]");
        this.previousDocumentsTab = page.locator("//a[contains(@href, '/previous-documents/#overview-tab')]");
        this.additionalInformationTab = page.locator("//a[contains(@href, '/additional-information/#overview-tab')]");

        //Document tab
        this.newDocumentRefButton = page.locator("//form[contains(@action,'/overview/?index')]//button[@value='new-record']");
        //Additional Procedure Codes tab
        this.newAdditionalProcedureCodeButton = page.locator("//form[contains(@action,'/additional-procedure-codes')]//button[@value='new-record']");
        //Previous Documents tab
        this.newPreviousDocumentButton = page.locator("//form[contains(@action,'/previous-documents')]//button[@value='new-record']");
        //Additional Information tab
        this.newAdditionalInformationButton = page.locator("//form[contains(@action,'/additional-information')]//button[@value='new-record']");
    }

    async clickDocumentTab(): Promise<void> {
        await this.documentTab.click();
    }

    async clickAttachmentsTab(): Promise<void> {
        await this.attachmentsTab.click();
    }

    async clickAdditionalProcedureCodesTab(): Promise<void> {
        await this.additionalProcedureCodesTab.click();
    }

    async clickPreviousDocumentsTab(): Promise<void> {
        await this.previousDocumentsTab.click();
    }

    async clickAdditionalInformationTab(): Promise<void> {
        await this.additionalInformationTab.click();
    }

    async clickNewDocumentReference(): Promise<void> {
        await this.newDocumentRefButton.click();
    }

    async clickNewAdditionalProcedureCode(): Promise<void> {
        await this.newAdditionalProcedureCodeButton.click();
    }

    async clickNewPreviousDocument(): Promise<void> {
        await this.newPreviousDocumentButton.click();
    }

    async clickNewAdditionalInformation(): Promise<void> {
        await this.newAdditionalInformationButton.click();
    }

    async declareNewDocumentReference(): Promise<void> {
            await this.clickDocumentTab();
            await this.clickNewDocumentReference();
    }

    async declareNewAdditionalProcedureCode(): Promise<void> {
        await this.clickAdditionalProcedureCodesTab();
        await this.clickNewAdditionalProcedureCode();
    }

    async declareNewPreviousDocument(): Promise<void> {
        await this.clickPreviousDocumentsTab();
        await this.clickNewPreviousDocument();
    }

    async declareNewAdditionalInformation(): Promise<void> {
        await this.clickAdditionalInformationTab();
        await this.clickNewAdditionalInformation();
    }

}