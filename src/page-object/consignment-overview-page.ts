import { BasePage } from "./base-page";
import { Page, Locator} from '@playwright/test';


export class ConsignmentOverviewPage extends BasePage {

    // Locators. NOTE: tab links use href-based xpath (not text), reasonably stable.
    private readonly goodsRecordTab: Locator;
    private readonly headerPreviousDocumentTab: Locator;
    private readonly guaranteeTypeTab: Locator;
    private readonly holderOfAuthorisationTab: Locator;
    private readonly documentTab: Locator;
    private readonly newGoodsRecordBtn: Locator;
    private readonly newPreviousDocumentBtn: Locator;
    private readonly newHolderOfAuthorisationBtn: Locator;
    private readonly confirmAndSubmitButton: Locator;
    private readonly consignmentBreadcrumbLink: Locator;

    constructor(page: Page) {
        super(page);

        this.consignmentBreadcrumbLink = page.locator("//nav[contains(@class,'breadcrumb')]//a[starts-with(normalize-space(.),'DEC')]");
        this.goodsRecordTab = page.locator("//a[contains(@href, '/overview/#overview-tab')]");
        this.headerPreviousDocumentTab = page.locator("//a[contains(@href, '/overview/previous-documents#overview-tab')]");
        this.guaranteeTypeTab = page.locator("//a[contains(@href, '/guarantee-type#overview-tab')]");
        this.holderOfAuthorisationTab = page.locator("//a[contains(@href, '/overview/holder-of-authorisation#overview-tab')]");

        // The goods-records list is the overview root, whose form action carries the
        // "?index" marker (named tabs post to "/<tab-name>"). Scoped by form action (a
        // URL, locale-independent) not the label — same convention as movement-overview.
        this.newGoodsRecordBtn = page.locator("form[action*='?index'] button[value='new-record']");
        // Scoped to the "Header previous documents" tab panel so it is not confused
        // with the other tabs' own "new-record" buttons.
        this.newPreviousDocumentBtn = page.locator("//form[contains(@action,'previous-documents')]//button[@value='new-record']");
        this.newHolderOfAuthorisationBtn = page.locator("//form[contains(@action,'holder-of-authorisation')]//button[@value='new-record']");
        this.documentTab = page.locator("//a[contains(@href, '/documents#overview-tab')]");
        this.confirmAndSubmitButton = page.locator("button[value='submit-consignment']");
    }


    async clickNewGoodsRecord(): Promise<void> {
        await this.newGoodsRecordBtn.click();
    }

    async clickHeaderPreviousDocumentTab(): Promise<void> {
        await this.headerPreviousDocumentTab.click();
    }

    async clickNewPreviousDocument(): Promise<void> {
        await this.newPreviousDocumentBtn.click();
    }

    /** Open the "New previous document" wizard from the Header previous documents tab. */
    async openNewHeaderPreviousDocument(): Promise<void> {
        await this.clickHeaderPreviousDocumentTab();
        await this.clickNewPreviousDocument();
    }

    async clickHolderOfAuthorisationTab(): Promise<void> {
        await this.holderOfAuthorisationTab.click();
    }

    async clickNewHolderOfAuthorisation(): Promise<void> {
        await this.newHolderOfAuthorisationBtn.click();
    }

    /** Open the "New holder of authorisation" wizard from the Holder of authorisation tab. */
    async openNewHolderOfAuthorisation(): Promise<void> {
        await this.clickHolderOfAuthorisationTab();
        await this.clickNewHolderOfAuthorisation();
    }


    async openNewGoodsRecord(): Promise<void> {
        await this.goodsRecordTab.click();
        await this.newGoodsRecordBtn.click();
    }

    async goToConsignmentOverview(): Promise<void> {
        await this.consignmentBreadcrumbLink.click();
    }

    /**
     * The consignment reference (DEC...) shown in the breadcrumb. Read it while a
     * child page (e.g. goods-item overview) is open, where the consignment is a
     * breadcrumb *link*; on the consignment overview itself it is the current
     * crumb and no longer an anchor.
     */
    async getConsignmentReference(): Promise<string> {
        return (await this.consignmentBreadcrumbLink.innerText()).trim();
    }

    async clickConfirmAndSubmit(): Promise<void> {
        await this.confirmAndSubmitButton.click();
    }

}