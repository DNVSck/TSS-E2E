import { BasePage } from "./base-page";
import { Page, Locator} from '@playwright/test';
import { clickLinkAndWaitForRoute } from '../helper/element-helper';

/** SIT renders the portal shell client-side and can be slow under load. */
const PORTAL_RENDER_TIMEOUT = 45_000;


export class PortalPage extends BasePage {

    // Declare properties - Using stable locators (NOT text-based)
    private readonly signInBtn: Locator;
    private readonly signOutLink: Locator;
    private readonly languageSwitcher: Locator;
    private readonly startNewDeclarationLink: Locator;

    // Landing-page shortcuts. Scoped to <main> because the header menu carries the
    // same hrefs.
    private readonly draftDeclarationsLink: Locator;
    private readonly supplementaryDeclarationsLink: Locator;
    private readonly companyProfileLink: Locator;
    private readonly manageUsersLink: Locator;
    private readonly makePaymentLink: Locator;

    constructor(page: Page) {
        super(page);
        // Matched on the END of the href, never the whole path: the "/portal" prefix is
        // not there under a local dev server. Ends-with rather than contains because
        // "/company-profile" would otherwise also match "/company-profile/users".
        this.signInBtn = page.locator("a[href$='/oauth']");
        this.signOutLink = page.locator("a[href$='/logout']");
        this.languageSwitcher = page.locator("//a[contains(@href, '/change-language')]");
        this.startNewDeclarationLink = page.locator("main a[href$='/declaration/form/start']");

        this.draftDeclarationsLink = page.locator("main a[href$='/overview']");
        // Contains, not ends-with: this one carries filter state after the path.
        this.supplementaryDeclarationsLink = page.locator(
            "main a[href*='/overview?action-quick-filter=sd-Draft']"
        );
        this.companyProfileLink = page.locator("main a[href$='/company-profile']");
        this.manageUsersLink = page.locator("main a[href$='/company-profile/users']");
        this.makePaymentLink = page.locator("main a[href$='/payments/pending-payments']");
    }

    /**
     * Switch to specific language
     */
    async switchLanguage(lang: 'en' | 'cy'): Promise<void> {
        await this.languageSwitcher.click();
    }

    /**
     * The portal renders client-side, so `goto` returning does not mean the header is
     * on the page yet. Waiting for the link explicitly - on a budget of its own rather
     * than the ambient action timeout - is what stops a slow render being reported as
     * "Sign in link not clickable", which reads like the link is broken when the page
     * simply had not arrived.
     */
    async clickSignIn(): Promise<void> {
        await this.signInBtn.waitFor({ state: 'visible', timeout: PORTAL_RENDER_TIMEOUT });
        await this.signInBtn.click({ timeout: PORTAL_RENDER_TIMEOUT });
    }

    async startTssJourney(): Promise<void> {
        await this.startNewDeclarationLink.click();
    }

    // Landing-page shortcuts. Each assumes the browser is on the portal landing page.
    // clickLinkAndWaitForRoute rather than a bare click: these links can swallow a
    // click without navigating.

    /** "Manage your company profile". */
    async openCompanyProfile(): Promise<void> {
        await clickLinkAndWaitForRoute(this.page, this.companyProfileLink);
    }

    /** "Manage users" - reached without opening the company profile first. */
    async openManageUsers(): Promise<void> {
        await clickLinkAndWaitForRoute(this.page, this.manageUsersLink);
    }

    /** "View your draft declarations". */
    async openDraftDeclarations(): Promise<void> {
        await clickLinkAndWaitForRoute(this.page, this.draftDeclarationsLink);
    }

    /** "Complete your supplementary declarations" - the overview filtered to SD drafts. */
    async openSupplementaryDeclarations(): Promise<void> {
        await clickLinkAndWaitForRoute(this.page, this.supplementaryDeclarationsLink);
    }

    /** "Make a payment". */
    async openMakePayment(): Promise<void> {
        await clickLinkAndWaitForRoute(this.page, this.makePaymentLink);
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