import { BasePage } from "./base-page";
import { Page, Locator} from '@playwright/test';


export class PortalPage extends BasePage {

    // Declare properties - Using stable locators (NOT text-based)
    private readonly signInBtn: Locator;
    private readonly signOutLink: Locator;
    private readonly languageSwitcher: Locator;
    private readonly startNewDeclarationLink: Locator;

    constructor(page: Page) {
        super(page);
        this.signInBtn = page.locator("a[href='/portal/oauth']");
        this.signOutLink = page.locator("a[href='/portal/logout']");
        this.languageSwitcher = page.locator("//a[contains(@href, '/portal/change-language')]");
        this.startNewDeclarationLink = page.locator("//main//a[@href='/portal/declaration/form/start']");

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
        await this.startNewDeclarationLink.click();
    }

    /** Hands over to the identity provider, which then asks for confirmation. */
    async clickSignOut(): Promise<void> {
        await this.signOutLink.click();
    }

    /**
     * Waits until the portal shows the signed-in landing page. The session
     * cookies are only complete once this link is rendered, so the auth setup
     * must await it before capturing `storageState`.
     */
    async waitUntilSignedIn(timeoutMs: number): Promise<void> {
        await this.startNewDeclarationLink.waitFor({ state: 'visible', timeout: timeoutMs });
    }

    /** The "Sign in" link only reappears once the session has really ended. */
    async waitUntilSignedOut(timeoutMs: number): Promise<void> {
        await this.signInBtn.waitFor({ state: 'visible', timeout: timeoutMs });
    }

    async isSignedIn(): Promise<boolean> {
        return this.signOutLink.isVisible();
    }

    async isSignedOut(): Promise<boolean> {
        return this.signInBtn.isVisible();
    }
}