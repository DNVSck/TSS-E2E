import { BasePage } from "./base-page";
import { Page, Locator} from '@playwright/test';


export class ConsignmentOverviewPage extends BasePage {

    // Declare properties - Using stable locators (NOT text-based)
    goodsRecordTab: Locator;
    headerPreviousDocumentTab: Locator;
    guaranteeTypeTab: Locator;
    holderOfAuthorisationTab: Locator;
    documentTab: Locator;
    newGoodsRecordBtn: Locator;


    constructor(page: Page) {
        super(page);
        this.goodsRecordTab = page.locator("//a[contains(@href, '/overview/#overview-tab')]");
        this.headerPreviousDocumentTab = page.locator("//a[contains(@href, '/previous-documents/#overview-tab')]");
        this.guaranteeTypeTab = page.locator("//a[contains(@href, '/guarantee-type#overview-tab')]");
        this.holderOfAuthorisationTab = page.locator("//a[contains(@href, '/holder-of-authorisation#overview-tab')]");
        this.newGoodsRecordBtn = page.locator("button[value='new-record']");
        this.documentTab = page.locator("//a[contains(@href, '/documents#overview-tab')]");
    }


    async clickNewGoodsRecord(): Promise<void> {
        await this.newGoodsRecordBtn.click();
    }


}