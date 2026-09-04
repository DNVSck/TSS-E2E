import { BasePage } from "./base-page";
import { Page, Locator} from '@playwright/test';
import { clickLinkAndWaitForRoute } from '../helper/element-helper';
import { BASE_URL } from '../../config/environment';
import { StringUtil } from '../core/util/string-util';
import { NavigationBanner } from './components/navigation-banner';

const PORTAL_RENDER_TIMEOUT = 90_000;


export class PortalPage extends BasePage {

    // Declare properties - Using stable locators (NOT text-based)
    private readonly signInBtn: Locator;
    // The service navigation bar, composed rather than injected: it is part of the
    // layout this page renders in, and it holds no state worth sharing.
    private readonly banner: NavigationBanner;
    private readonly startNewDeclarationLink: Locator;

    // Landing-page shortcuts. Scoped to <main> because the header menu carries the
    // same hrefs.
    private readonly draftDeclarationsLink: Locator;
    private readonly supplementaryDeclarationsLink: Locator;
    private readonly companyProfileLink: Locator;
    private readonly manageUsersLink: Locator;
    private readonly makePaymentLink: Locator;
    private readonly gmrViewLink: Locator;

    constructor(page: Page) {
        super(page);
        // Matched on the END of the href, never the whole path: the "/portal" prefix is
        // not there under a local dev server. Ends-with rather than contains because
        // "/company-profile" would otherwise also match "/company-profile/users".
        this.signInBtn = page.locator("a[href$='/oauth']");
        this.banner = new NavigationBanner(page);
        this.startNewDeclarationLink = page.locator("main a[href$='/declaration/form/start']");

        this.draftDeclarationsLink = page.locator(
            "main a[href$='/overview']:not(.govuk-button)"
        );
        // Contains, not ends-with: this one carries filter state after the path.
        this.supplementaryDeclarationsLink = page.locator(
            "main a[href*='/overview?action-quick-filter=sd-Draft']"
        );
        this.companyProfileLink = page.locator("main a[href$='/company-profile']");
        this.manageUsersLink = page.locator("main a[href$='/company-profile/users']");
        this.makePaymentLink = page.locator("main a[href$='/payments/pending-payments']");
        this.gmrViewLink = page.locator("main a[href$='/gmr-overview']");
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

    /**
     * "View business profile".
     *
     * Home first, like the other landing-page shortcuts: this is the way into the
     * traders list now, and a representation is started from wherever the journey
     * happens to have got to.
     */
    async openCompanyProfile(): Promise<void> {
        await this.returnHome();
        await clickLinkAndWaitForRoute(this.page, this.companyProfileLink);
    }

    /** "Manage users" - reached without opening the company profile first. */
    async openManageUsers(): Promise<void> {
        await clickLinkAndWaitForRoute(this.page, this.manageUsersLink);
    }

    /**
     * "View your draft declarations".
     *
     * These landing-page shortcuts exist only on the portal home, so a caller deep
     * inside a declaration is brought back to the front door first, by following the
     * header's own "Go to homepage" link - the same thing a user would do.
     */
    async openDraftDeclarations(): Promise<void> {
        await this.returnHome();
        await clickLinkAndWaitForRoute(this.page, this.draftDeclarationsLink);
    }

    private async openGmrView(): Promise<void> {
        await this.returnHome();
        await clickLinkAndWaitForRoute(this.page, this.gmrViewLink);
    }

    private async returnHome(): Promise<void> {
        await this.banner.goToHomepage();
        await this.startNewDeclarationLink.waitFor({
            state: 'visible', timeout: PORTAL_RENDER_TIMEOUT,
        });
    }

    /**
     * Land on the portal home unless we are already there.
     *
     * Decided from the URL, NOT from whether the wanted link happens to be present.
     * That was the first attempt and it is wrong: the declarations overview carries a
     * "Clear filters" link to itself, whose href ends "/overview" exactly like the
     * shortcut being looked for - so a caller already on that screen was judged to be
     * home, and then clicked something else entirely.
     */
    private async returnToHomeIfAway(): Promise<void> {
        const home = StringUtil.stripTrailingSlashes(new URL(BASE_URL).pathname);
        const here = StringUtil.stripTrailingSlashes(new URL(this.page.url()).pathname);

        if (here !== home) {
            await this.page.goto(BASE_URL);
        }
    }

    /** "Complete your supplementary declarations" - the overview filtered to SD drafts. */
    async openSupplementaryDeclarations(): Promise<void> {
        await clickLinkAndWaitForRoute(this.page, this.supplementaryDeclarationsLink);
    }

    /** "Make a payment". */
    async openMakePayment(): Promise<void> {
        await clickLinkAndWaitForRoute(this.page, this.makePaymentLink);
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


    async isSignedOut(): Promise<boolean> {
        return this.signInBtn.isVisible();
    }
}