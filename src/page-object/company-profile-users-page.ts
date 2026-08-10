import { Locator } from '@playwright/test';
import { BasePage } from './base-page';

/**
 * The company's users screen, reached from "View users" on the company profile.
 *
 * Both roles see the same table of users - name, email, role - and only the account
 * holder is offered anything to do with them. So the permission check is the same
 * question asked of a different screen, and the only thing this class contributes is
 * WHERE to look: the rows are a GOV.UK table, not the summary list every other
 * overview uses, so BasePage's two defaults are overridden and nothing else changes.
 */
export class CompanyProfileUsersPage extends BasePage {

    /** A user's own record: .../company-profile/users/<id>/overview */
    private static readonly CHANGE_USER_ROUTE = /\/company-profile\/users\/([^/]+)\/overview$/;

    /** The company-level action that brings a new user in, above the table. */
    private static readonly INVITE_USER_ROUTE = '/company-profile/invite-user';

    /** One row per user in the table body; the header row is not one. */
    protected override get contentRows(): Locator {
        return this.page.locator('main table tbody tr');
    }

    /**
     * Every action the screen offers, per user AND for the company as a whole.
     *
     * Both matter: the row actions ("Change", "Deactivate") and the management links
     * above the table ("Invite new user", "Add an agent", the notification toggle) all
     * vanish together for a user who is not the account holder, so a check that looked
     * only at the table would miss three ways in.
     *
     * Scoped to links pointing back into company-profile routes, which is what makes
     * this hold when a link is added: a new management action lands in the list
     * automatically rather than being silently unchecked.
     */
    protected override get actionLinks(): Locator {
        return this.page.locator("main a[href*='/company-profile/']");
    }

    /**
     * The users this account may change, by id.
     *
     * Ids rather than hrefs so a caller can talk about users without knowing how the
     * service addresses them - which route a user's record sits at is this page's
     * business, and a spec that knew it would break when the route moved.
     *
     * Picking these out also leaves the deactivate links and the company-level
     * actions behind, so "one Change per user listed" can be stated exactly.
     */
    async listChangeableUserIds(): Promise<string[]> {
        const hrefs = await this.listActionHrefs();

        return hrefs
            .map(href => CompanyProfileUsersPage.CHANGE_USER_ROUTE.exec(href)?.[1])
            .filter((id): id is string => id !== undefined);
    }

    /** Whether the screen offers to invite a new user into the company. */
    async offersInviteUser(): Promise<boolean> {
        const hrefs = await this.listActionHrefs();
        return hrefs.some(href => href.includes(CompanyProfileUsersPage.INVITE_USER_ROUTE));
    }
}
