import { Page, Locator } from '@playwright/test';
import { BasePage } from './base-page';
import { clickLinkAndWaitForRoute } from '../helper/element-helper';
import { COMPANY_PROFILE_ACTION } from '../constant/company-profile-action-constant';

/**
 * The company profile screen, reached from the header menu.
 *
 * What the permission specs read here is not a field's value but whether the page
 * offers to CHANGE it: an account holder gets a "Change" action on the editable rows,
 * an ordinary user of the same company gets none at all.
 */
export class CompanyProfilePage extends BasePage {
    private readonly viewUsersLink: Locator;
    private readonly viewTradersLink: Locator;

    constructor(page: Page) {
        super(page);

        // By href, not by its "View users" label - the label is translated. Matched on
        // the end of the href so it holds without the "/portal" prefix too.
        this.viewUsersLink = page.locator("a[href$='/company-profile/users']");

        // Scoped to <main>: while a representation is running the phase banner above
        // carries a "Switch business" link to the very same href, and an unscoped
        // selector would match both.
        this.viewTradersLink = page.locator("main a[href$='/company-profile/traders']");
    }

    /**
     * Follow "View users" into the company's user list.
     *
     * Both roles are offered this link - being able to SEE the users is not the
     * privilege; being offered anything to do with them is. Routed through
     * clickLinkAndWaitForRoute so the click is retried and the landing verified,
     * rather than the next read racing a navigation that never happened.
     */
    async openUsersList(): Promise<void> {
        await clickLinkAndWaitForRoute(this.page, this.viewUsersLink);
    }

    /**
     * Follow "View businesses you're authorised to represent".
     *
     * The only way in from a session that represents nobody. The strip that used to
     * offer "Select a company" on every page is now rendered only WHILE a
     * representation is running, so there is nothing to click until one exists.
     */
    async openTradersList(): Promise<void> {
        await clickLinkAndWaitForRoute(this.page, this.viewTradersLink);
    }

    /**
     * What the page offers this account to act on, by row name.
     *
     * NAMES rather than a count, because a count cannot fail usefully: drop 20 of the
     * 23 actions and "more than zero" still passes. Names let a caller say which rows
     * must be actionable and leave the rest alone - and when one leaks to a user who
     * should have none, the failure says which.
     *
     * Row names, not hrefs: BUSINESS_NAME and GMR_AUTOMATION mean something to a
     * reader, "?field=companyName" does not. Whether a row is edited through a form
     * or through a journey of its own is the service's business, and stays inside
     * COMPANY_PROFILE_ACTION rather than leaking into every test that reads this.
     */
    async listAvailableActions(): Promise<string[]> {
        const hrefs = await this.listActionHrefs();

        return Object.entries(COMPANY_PROFILE_ACTION)
            .filter(([, fragment]) => hrefs.some(href => href.includes(fragment)))
            .map(([name]) => name);
    }
}
