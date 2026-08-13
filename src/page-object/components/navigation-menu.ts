import { Page, Locator } from '@playwright/test';
import { clickLinkAndWaitForRoute } from '../../helper/element-helper';

/** The header menu is part of every signed-in page, so it renders with the layout. */
const MENU_TIMEOUT = 15_000;
/** How long one toggle click gets to actually reveal the panel. */
const PANEL_OPEN_TIMEOUT = 5_000;
const TOGGLE_ATTEMPTS = 3;

/**
 * The GOV.UK super-navigation menu in the service header - the "Menu" button and the
 * panel it opens. A component, not a page: it sits on every signed-in screen, so any
 * page object can be handed one rather than each re-declaring the header.
 */
export class NavigationMenu {
    private readonly menuToggle: Locator;
    private readonly menuPanel: Locator;
    private readonly companyProfileLink: Locator;

    constructor(private readonly page: Page) {
        this.menuToggle = page.locator('button#super-navigation-menu-toggle');
        this.menuPanel = page.locator('#super-navigation-menu');

        // Scoped INSIDE the menu panel. The same href also appears in the portal's own
        // page body, so an unscoped selector matches two elements that are both
        // visible once the menu is open - and a component should only ever reach into
        // its own markup anyway.
        this.companyProfileLink = page.locator(
            "#super-navigation-menu a[href$='/company-profile']"
        );
    }

    /**
     * Open the menu panel, and do not return until it really is open.
     *
     * Deliberately does NOT read `aria-expanded`. The page ships the button already
     * saying `aria-expanded="true"` while the panel it controls still carries
     * `hidden`, so believing the attribute means skipping the click and then waiting
     * forever on a link that never appears. The panel's own visibility is the only
     * honest signal.
     *
     * For the same reason the toggle is clicked more than once if need be: with the
     * component's idea of its state out of step with the DOM, the first click can
     * just as easily be read as "collapse".
     */
    async open(): Promise<void> {
        await this.menuToggle.waitFor({ state: 'visible', timeout: MENU_TIMEOUT });

        for (let attempt = 1; attempt <= TOGGLE_ATTEMPTS; attempt++) {
            if (await this.menuPanel.isVisible()) {
                return;
            }
            await this.menuToggle.click();

            try {
                await this.menuPanel.waitFor({ state: 'visible', timeout: PANEL_OPEN_TIMEOUT });
                return;
            } catch {
                if (attempt === TOGGLE_ATTEMPTS) {
                    throw new Error(
                        `The navigation menu did not open after ${TOGGLE_ATTEMPTS} clicks on its toggle.`
                    );
                }
            }
        }
    }

    /**
     * Open the menu and follow "View company profile".
     *
     * The click goes through clickLinkAndWaitForRoute rather than a bare click, and
     * for a reason seen on this very link: the menu opens, the link is visible, the
     * click is accepted - and nothing navigates. That helper retries the click and
     * verifies the landing, which is the only thing that helps when a click is
     * swallowed; waiting longer never does.
     */
    async openCompanyProfile(): Promise<void> {
        await this.open();
        await clickLinkAndWaitForRoute(this.page, this.companyProfileLink);
    }
}
