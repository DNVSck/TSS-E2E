import { BasePage } from "./base-page";
import { Page, Locator } from '@playwright/test';


export class GmrDetailsPage extends BasePage {
    private readonly submitGMRButton: Locator;
    private readonly cancelGMRButton: Locator;
    private readonly generateBarcodeButton: Locator;

    private readonly externalContactsTab: Locator;

    constructor(page: Page) {
        super(page);
        this.submitGMRButton = page.locator("button[value='submit']");
        this.cancelGMRButton = page.locator("button[value='cancel']");
        this.generateBarcodeButton = page.locator("button[value='generate-barcode']");

        this.externalContactsTab = page.locator("//a[contains(@href, '/external-contacts#overview-tab')]");
    }

    async submitGMR(): Promise<void> {
        await this.submitGMRButton.click();
    }

    async cancelGMR(): Promise<void> {
        await this.cancelGMRButton.click();
    }

    async generateBarcode(): Promise<void> {
        await this.generateBarcodeButton.click();
    }

    async clickExternalContactsTab(): Promise<void> {
        await this.externalContactsTab.click();
    }
    
}