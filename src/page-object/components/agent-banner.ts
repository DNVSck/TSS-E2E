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
 *
 * 30s rather than 15s: under four parallel workers the portal home regularly took
 * longer than 15s to paint the bar, and every read that timed out came back as "not
 * representing".
 */
const BANNER_RENDER_TIMEOUT = 30_000;

/**
 * What the bar says about representation - three answers, not two.
 *
 * `unknown` is the one that matters: the bar never painted, so the session may be
 * representing or not and nothing on the page separates the two. Reading that as
 * "not representing" is how a test ends up declaring under an identity it did not
 * choose.
 */
export type RepresentationState = 'representing' | 'not-representing' | 'unknown';

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
     * What the bar shows, having first put the browser somewhere the bar exists.
     *
     * Waits for it to attach. A bare count() reads whatever is on the page at that
     * instant, and right after a navigation that is usually nothing - so a session that
     * IS representing reads as one that is not.
     */
    async readRepresentation(): Promise<RepresentationState> {
        if (await this.bannerIsMissing()) {
            await this.page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
        }

        if (!await this.waitForBanner()) {
            return 'unknown';
        }

        return await this.stopRepresentingLink.count() > 0
            ? 'representing'
            : 'not-representing';
    }

    /**
     * Clear any representation without waiting for the bar to paint.
     *
     * The same GET the "Stop representing" link issues, sent on the browser context's
     * cookie jar so it lands on the same server-side session. Used by the reset that runs
     * before every test: that reset must not be defeated by a portal painting slowly, and
     * reading the bar first is what made it silently skip under parallel load.
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
    }

    /**
     * Clear any representation through the screen, and say whether there was one.
     *
     * The user's own path, kept for the flows that need the bar to visibly change - see
     * RepresentTraderFlow, which relies on the link going away and coming back.
     *
     * Throws instead of answering when the bar never painted. False means "there was
     * nothing to clear", and a session that MIGHT still be representing is not that: the
     * caller would carry on under an identity it did not choose, and the service rejects
     * the declaration minutes later with "Declarant EORI: Not provided", pointing at CDS
     * rather than at the read that went wrong here.
     */
    async stopRepresenting(): Promise<boolean> {
        const state = await this.readRepresentation();

        if (state === 'unknown') {
            throw new Error(
                `The Agent banner did not render within ${BANNER_RENDER_TIMEOUT}ms at ` +
                `${this.page.url()}, so whether this session represents anybody could not ` +
                `be read. Refusing to report it as "not representing" - that answer is ` +
                `what lets a test declare under the wrong company.`
            );
        }

        if (state === 'not-representing') {
            return false;
        }

        await this.stopRepresentingLink.click();
        await this.stopRepresentingLink.waitFor({ state: 'hidden' });
        return true;
    }

    /**
     * Whether the bar is absent RIGHT NOW, read without waiting.
     *
     * Deliberately instant, unlike readRepresentation. This one only decides whether to
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
