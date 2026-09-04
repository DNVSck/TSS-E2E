import { Page, Locator } from '@playwright/test';
import { clickLinkAndWaitForRoute } from '../../helper/element-helper';
import { BASE_URL } from '../../../config/environment';

/** The switch is a client-side route, so the document reports it a beat after the click. */
const LANGUAGE_SWITCH_TIMEOUT = 15_000;

/**
 * The service navigation bar TSS renders at the top of every signed-in page - "Go to
 * homepage", "Sign out", and the ENG/CYM language switch.
 *
 * A component, not a page: it belongs to the layout rather than to any one screen, so
 * a page object composes it instead of re-declaring the header. That is also why the
 * signed-in question lives here. PortalPage used to answer it, but PortalPage
 * describes the landing screen, and a caller deep inside a wizard is just as signed in
 * as one standing on the home page.
 *
 * Locators are scoped to the bar and keyed on href, never on the link text - the text
 * is translated, and the same hrefs appear again in the page body.
 */
export class NavigationBanner {
    private readonly banner: Locator;
    private readonly goToHomepageLink: Locator;
    private readonly signOutLink: Locator;

    constructor(private readonly page: Page) {
        const banner = page.locator('nav.govuk-service-navigation__wrapper');
        this.banner = banner;

        // The only link in the bar pointing at the service root. Matched on a trailing
        // slash rather than on "/portal/" because that prefix is absent under a local
        // dev server; the other two hrefs here end in "/logout" and a query string, so
        // this stays unambiguous either way.
        this.goToHomepageLink = banner.locator("a[href$='/']");
        this.signOutLink = banner.locator("a[href$='/logout']");
    }

    /**
     * Land on the portal home, by the header link when there is one.
     *
     * A browser that has not navigated anywhere yet carries no header, and a spec
     * that represents a trader in beforeEach starts exactly there - so the absence of
     * the link means "not in the app yet", not "the link is broken". Going straight
     * to the front door is what a user does then, and it is where the link would have
     * led anyway.
     *
     * Read without waiting: being wrong costs one redundant navigation, and it lands
     * on the same page either way.
     *
     * clickLinkAndWaitForRoute rather than a bare click: these header links can accept
     * a click without navigating, and waiting longer never helps - only retrying and
     * verifying the landing does.
     */
    async goToHomepage(): Promise<void> {
        if (await this.goToHomepageLink.count() === 0) {
            await this.page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
            return;
        }

        await clickLinkAndWaitForRoute(this.page, this.goToHomepageLink);
    }

    /** Hands over to the identity provider, which then asks for confirmation. */
    async clickSignOut(): Promise<void> {
        await this.signOutLink.click();
    }

    async switchLanguageTo(locale: string): Promise<void> {
        const link = this.banner.locator(`a[href*='change-language'][lang='${locale}']`);

        if (await link.count() === 0) {
            return;
        }

        await link.click();
        await this.page.waitForFunction(
            expected => document.documentElement.lang === expected,
            locale,
            { timeout: LANGUAGE_SWITCH_TIMEOUT }
        );
    }

    /**
     * Whether the session is signed in, asked from any screen.
     *
     * "Sign out" is only rendered for a session that has one to end, which makes it the
     * signal that does not depend on where the browser happens to be standing.
     */
    async isSignedIn(): Promise<boolean> {
        return this.signOutLink.isVisible();
    }
}
