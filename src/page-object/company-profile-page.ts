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

    constructor(page: Page) {
        super(page);

        // By href, not by its "View users" label - the label is translated.
        this.viewUsersLink = page.locator("a[href='/portal/company-profile/users']");
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
