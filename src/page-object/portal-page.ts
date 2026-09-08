import { BasePage } from "./base-page";
import { Page, Locator} from '@playwright/test';
import { clickLinkAndWaitForRoute } from '../helper/element-helper';
import { BASE_URL } from '../../config/environment';
import { StringUtil } from '../core/util/string-util';

const PORTAL_RENDER_TIMEOUT = 90_000;


export class PortalPage extends BasePage {

    // Declare properties - Using stable locators (NOT text-based)
    private readonly signInBtn: Locator;
    private readonly signOutLink: Locator;
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

    /**
     * "Start a new declaration" - the front door of every journey.
     *
     * Races the link against the sign-in link rather than waiting for the one that is
     * wanted. A context replays a session signed in once per run, so a run that
     * outlives it serves the signed-out landing page here - where this link never
     * arrives, and a plain click spends its whole budget before reporting a locator
     * that was never the problem. Same budget as the other portal waits: the landing
     * page renders client-side and the ambient action timeout is lower.
     */
    async startTssJourney(): Promise<void> {
        await this.startNewDeclarationLink.or(this.signInBtn).first()
            .waitFor({ state: 'visible', timeout: PORTAL_RENDER_TIMEOUT });

        if (await this.isSignedOut()) {
            throw new Error(
                'Portal home offered "Sign in" instead of "Start a new declaration" - the ' +
                'session replayed into this context is no longer valid. It is signed in ' +
                'once per run and renewed per test in worker-auth-fixture, so reaching ' +
                'here signed out means the session died mid-test, not between tests.'
            );
        }

        await this.startNewDeclarationLink.click({ timeout: PORTAL_RENDER_TIMEOUT });
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

    /**
     * "View your draft declarations".
     *
     * These landing-page shortcuts exist only on the portal home, so a caller deep
     * inside a declaration is brought back to the front door first - the same thing
     * a user would do, and the same guard AgentBanner uses for its own links.
     */
    async openDraftDeclarations(): Promise<void> {
        await this.returnToHomeIfAway();
        await clickLinkAndWaitForRoute(this.page, this.draftDeclarationsLink);
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