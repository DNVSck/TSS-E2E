import { BasePage } from "./base-page";
import { Element } from "../core/element/element";


export class PortalPage extends BasePage {
    
    // Declare properties - Using stable locators (NOT text-based)
    signInBtn: Element;
    languageSwitcher: Element;
    portalTitlte: Element;
    startNowButton: Element;
    
    constructor() {
        super();
        this.signInBtn = new Element("a[href='/portal/sign-in']");
        this.languageSwitcher = new Element("//a[contains(@href, '/portal/change-language')]");
        this.portalTitlte = new Element("//h1[contains(@class,'govuk-heading')]");
        this.startNowButton = new Element("//a[contains(@data-module, 'govuk-button')]");
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

    async verifyPortalTitle(expectedTitle: string): Promise<void> {
        const actualTitle = await this.portalTitlte.getText();
        if (actualTitle !== expectedTitle) {
            throw new Error(`Portal title mismatch: expected "${expectedTitle}", but got "${actualTitle}"`);
        }
    }

    async clickOnStartNow(): Promise<void> {
        await this.startNowButton.click();
    }
}