import { Page, Locator } from '@playwright/test';
import { BasePage } from '../base-page';
import { BASE_URL } from '../../../config/environment';
import { ROUTES } from '../../constant/endpoints-constant';

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
            await this.page.goto(BASE_URL);
        }
        await this.selectCompanyLink.click();
        await this.page.waitForURL(url => url.pathname.endsWith(ROUTES.PORTAL.TRADERS));
    }

    /** Wait until the banner reflects an active representation. */
    async waitUntilRepresenting(): Promise<void> {
        await this.stopRepresentingLink.waitFor({ state: 'visible' });
    }

    async isRepresenting(): Promise<boolean> {
        return await this.stopRepresentingLink.count() > 0;
    }

    /** Stop representing if currently representing (no-op otherwise). */
    async stopRepresenting(): Promise<void> {
        if (!await this.isRepresenting()) {
            return;
        }
        await this.stopRepresentingLink.click();
        await this.stopRepresentingLink.waitFor({ state: 'hidden' });
    }
}
