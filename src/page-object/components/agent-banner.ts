import { Page, Locator } from '@playwright/test';
import { BasePage } from '../base-page';
import { BASE_URL } from '../../../config/environment';
import { ROUTES } from '../../constant/endpoints-constant';

/**
 * How long the banner gets to paint after a navigation.
 *
 * The portal renders client-side, so a settled navigation does not mean the bar is
 * on the page yet - the same reason PortalPage waits for its sign-in link. It
 * matters more here than there, because the question asked of this bar is whether
 * something is ABSENT, and an unpainted page answers that wrongly.
 */
const BANNER_RENDER_TIMEOUT = 15_000;

/**
 * The "Agent" phase banner TSS renders on every authenticated portal page (the
 * portal home, and the movement/consignment/goods overviews). It shows the Agent's
 * representation state and carries the links to change it:
 *
 *   - not representing:  "Agent | Select a company to represent."
 *   - representing:      "Agent | You are representing <company>. Select a
 *                         different company to represent or Stop representing."
 *
 * Modelled once here rather than on each page: the bar is identical everywhere and
 * representation is a cross-page session state. Locators are href-based (never the
 * "Agent"/"Select" text) so they survive the Welsh language switch. A page that
 * carries the bar composes this via `new AgentBanner(page)`.
 */
export class AgentBanner extends BasePage {
    /** "Select [a company / a different company]" — opens the traders list. */
    private readonly selectCompanyLink: Locator;
    /** Only present while representing — the locale-safe "is representing" signal. */
    readonly stopRepresentingLink: Locator;

    constructor(page: Page) {
        super(page);
        this.selectCompanyLink = page.locator(`a[href$='${ROUTES.PORTAL.TRADERS}']`);
        this.stopRepresentingLink = page.locator(`a[href$='${ROUTES.PORTAL.STOP_REPRESENTING}']`);
    }

    /**
     * Open the "Traders that you can represent" list via the banner's "Select" link
     * — the intended user path — rather than deep-linking the traders URL. The bar
     * only renders on authenticated portal pages, so if it is not present yet (e.g.
     * a test that has not navigated), land on the portal home first (the app's front
     * door, not the represent screen itself) and follow the link from there.
     */
    async openTradersList(): Promise<void> {
        if (await this.selectCompanyLink.count() === 0) {
            await this.page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
        }
        await this.selectCompanyLink.click();
        await this.page.waitForURL(url => url.pathname.endsWith(ROUTES.PORTAL.TRADERS));
    }

    /** Wait until the banner reflects an active representation. */
    async waitUntilRepresenting(): Promise<void> {
        await this.stopRepresentingLink.waitFor({ state: 'visible' });
    }

    /**
     * Whether the bar shows an active representation.
     *
     * Waits for the bar to exist first. A bare count() reads whatever is on the page at
     * that instant, and right after a navigation that is usually nothing - so a session
     * that IS representing reads as one that is not, and a caller guarding on this
     * silently skips its guard.
     *
     * Returns false, rather than throwing, when the bar never appears: a page without an
     * agent bar is not representing, which is the honest answer for every non-agent
     * profile and every screen outside the portal.
     */
    async isRepresenting(): Promise<boolean> {
        if (!await this.waitForBanner()) {
            return false;
        }
        return await this.stopRepresentingLink.count() > 0;
    }

    async stopRepresenting(): Promise<boolean> {
        if (await this.bannerIsMissing()) {
            await this.page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
        }

        if (!await this.isRepresenting()) {
            return false;
        }

        await this.stopRepresentingLink.click();
        await this.stopRepresentingLink.waitFor({ state: 'hidden' });
        return true;
    }

    /**
     * Whether the bar is absent RIGHT NOW, read without waiting.
     *
     * Deliberately instant, unlike isRepresenting. This one only decides whether to
     * navigate to the portal first, and being wrong costs a redundant navigation - while
     * waiting would cost the full render budget on every first call, where the page is
     * about:blank and the bar is never going to appear.
     */
    private async bannerIsMissing(): Promise<boolean> {
        return await this.selectCompanyLink.count() === 0
            && await this.stopRepresentingLink.count() === 0;
    }

    /**
     * Wait until either half of the bar is on the page, and say whether it arrived.
     *
     * Either link, because which one renders IS the state being read: "Select a company"
     * when not representing, plus "Stop representing" when it is. Waiting for one alone
     * would time out on exactly the state the caller wanted to detect.
     */
    private async waitForBanner(): Promise<boolean> {
        try {
            await this.selectCompanyLink.or(this.stopRepresentingLink).first()
                .waitFor({ state: 'attached', timeout: BANNER_RENDER_TIMEOUT });
            return true;
        } catch {
            return false;
        }
    }
}
