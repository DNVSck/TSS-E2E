import { Page, Locator } from '@playwright/test';
import { BasePage } from '../base-page';
import { BASE_URL } from '../../../config/environment';
import { ROUTES } from '../../constant/endpoints-constant';

/**
 * The representation strip TSS renders while an Agent is acting for somebody:
 *
 *   "Representing: <company>   Switch business   Finish session"
 *
 * It exists ONLY during a representation. The bar that used to sit on every page and
 * offer "Select a company to represent" is gone, so a session representing nobody has
 * no strip at all - which is why starting one now goes through the business profile
 * (CompanyProfilePage.openTradersList) rather than through this component.
 *
 * That also removes the only positive marker for "not representing". Absence is the
 * answer now, and the way this component avoids relying on it is by not asking: the
 * one thing that must never be wrong - clearing a leftover representation before a
 * test - goes through the session rather than the screen. See clearRepresentation.
 *
 * Locators are href-based, never the link text: the labels changed from "Stop
 * representing" to "Finish session" in the same deploy that moved the strip, and both
 * are translated.
 */
export class RepresentationBanner extends BasePage {
    /** "Finish session" - present only while representing, so it IS the signal. */
    readonly stopRepresentingLink: Locator;

    constructor(page: Page) {
        super(page);
        this.stopRepresentingLink = page.locator(`a[href$='${ROUTES.PORTAL.STOP_REPRESENTING}']`);
    }

    /** Wait until the strip reflects an active representation. */
    async waitUntilRepresenting(): Promise<void> {
        await this.stopRepresentingLink.waitFor({ state: 'visible' });
    }

    /** Whether a representation is running, read from the strip on the current page. */
    async isRepresenting(): Promise<boolean> {
        return this.stopRepresentingLink.isVisible();
    }

    /**
     * Clear any representation through the session rather than the screen.
     *
     * The same GET "Finish session" issues, sent on the browser context's cookie jar so
     * it lands on the same server-side session. Nothing has to render, which matters
     * twice over: the reset that runs before every test cannot be defeated by a portal
     * painting slowly, and there is no longer any on-page marker that says "representing
     * nobody" for it to read instead.
     */
    async clearRepresentation(): Promise<void> {
        // Relative on purpose. BASE_URL ends in /portal/ and the route carries a
        // leading slash because it is matched as an href suffix, so an absolute join
        // would resolve to the origin and miss the portal entirely.
        const url = new URL(`.${ROUTES.PORTAL.STOP_REPRESENTING}`, BASE_URL);
        const response = await this.page.request.get(url.toString());

        if (!response.ok()) {
            throw new Error(
                `Could not clear representation: ${url} answered ${response.status()}. ` +
                `The next test would start acting for a company it did not choose.`
            );
        }

        await this.assertNothingRepresented(url.pathname);
    }

    /**
     * Prove the clear happened, rather than trusting the 200 it answered with.
     *
     * The route replies the same whether it ended a session or found none, so on its
     * own it says only that the request was accepted. Read back instead from the page
     * the service renders: the portal home is server-rendered, and the "Finish session"
     * anchor appears in that HTML only while a representation is running - measured on
     * sit 2026-09-03. The route name also occurs in the page's serialised route data,
     * which is why this matches the rendered href and not the bare word.
     *
     * A request, not a screen: this runs before every test, where the browser has not
     * navigated anywhere and rendering a page to look at would cost what going through
     * the session was meant to save.
     */
    private async assertNothingRepresented(stopPath: string): Promise<void> {
        const home = await this.page.request.get(BASE_URL);

        if (!home.ok()) {
            throw new Error(
                `Cleared the representation but could not confirm it: ${BASE_URL} ` +
                `answered ${home.status()}. Refusing to report a clear that cannot be ` +
                `shown - an unnoticed one lets a test declare under the wrong company.`
            );
        }

        if ((await home.text()).includes(`href="${stopPath}"`)) {
            throw new Error(
                `The representation survived being cleared: ${BASE_URL} still offers ` +
                `"Finish session" (${stopPath}). The route answered OK, so it is the ` +
                `route that has changed, not the session - check what ends a ` +
                `representation now before trusting any test that represents.`
            );
        }
    }
}
