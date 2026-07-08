import { BasePage } from "./base-page";
import { Page, Locator} from '@playwright/test';


export class PortalPage extends BasePage {

    // Declare properties - Using stable locators (NOT text-based)
    signInBtn: Locator;
    languageSwitcher: Locator;
    startNowTssButton: Locator;


    constructor(page: Page) {
        super(page);
        this.signInBtn = page.locator("a[href='/portal/oauth']");
        this.languageSwitcher = page.locator("//a[contains(@href, '/portal/change-language')]");
        this.startNowTssButton = page.locator("//a[contains(@class,'govuk-button--start')]");

    }

    /**
     * Switch to specific language
     */
    async switchLanguage(lang: 'en' | 'cy'): Promise<void> {
        await this.languageSwitcher.click();
    }

    async clickSignIn(): Promise<void> {
        await this.signInBtn.click();
    }

    async startTssJourney(): Promise<void> {
        await this.startNowTssButton.click();
    }


}