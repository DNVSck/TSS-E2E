import { PortalPage } from '../page-object/portal-page';
import { BasePage } from '../page-object/base-page';
import { CompanyProfilePage } from '../page-object/company-profile-page';
import { CompanyProfileUsersPage } from '../page-object/company-profile-users-page';
import { ReportLog } from '../core/report/report-log';

/** What a screen offered the signed-in user. */
export interface ScreenPermissions {
    /** Rows the screen listed - proof it is really there. */
    rowCount: number;
    /** Where every action it offers would lead. Empty for a user with no rights. */
    actionHrefs: string[];
}

/** The company profile names what it offers; see listAvailableActions. */
export interface CompanyProfilePermissions extends ScreenPermissions {
    /** Rows this account is offered an action on, by name. */
    availableActions: string[];
}

/**
 * The users screen names its actions too, in its own terms: which users may be
 * changed, and whether a new one may be invited. Named here so a spec can state the
 * rule without knowing a single URL.
 */
export interface CompanyUsersPermissions extends ScreenPermissions {
    changeableUserIds: string[];
    canInviteUser: boolean;
}

export class CompanyProfileFlow {
    constructor(
        private readonly portalPage: PortalPage,
        private readonly companyProfilePage: CompanyProfilePage,
        private readonly companyProfileUsersPage: CompanyProfileUsersPage,
    ) { }

    /**
     * Open the company profile and read what it offers.
     *
     * From the portal landing page, not the header: the super-navigation menu that
     * used to carry this link is gone from the service - measured on sit, where its
     * toggle renders nowhere in either language - and "View business profile" in the
     * page body is the way in now.
     */
    async openCompanyProfile(): Promise<CompanyProfilePermissions> {
        return ReportLog.step('Open the company profile', async () => {
            await this.portalPage.openCompanyProfile();

            const permissions = await this.readPermissions(this.companyProfilePage, 'Company profile');
            const availableActions = await this.companyProfilePage.listAvailableActions();

            // Names, not hrefs: what a holder may act on is the thing a reviewer wants
            // to see, and "?field=companyName" tells them nothing.
            ReportLog.setParameter(
                'Company profile - actions offered on',
                availableActions.length > 0 ? availableActions.join(', ') : 'none'
            );

            return { ...permissions, availableActions };
        });
    }

    /**
     * Follow "View users" and read what THAT screen offers.
     *
     * Assumes the company profile is open - the two are read in sequence by the same
     * test, one sign-in covering both screens.
     */
    async openUsersList(): Promise<CompanyUsersPermissions> {
        return ReportLog.step('Open the company users list', async () => {
            await this.companyProfilePage.openUsersList();

            const permissions = await this.readPermissions(this.companyProfileUsersPage, 'Company users');
            const changeableUserIds = await this.companyProfileUsersPage.listChangeableUserIds();
            const canInviteUser = await this.companyProfileUsersPage.offersInviteUser();

            ReportLog.setParameter('Company users - changeable', String(changeableUserIds.length));
            ReportLog.setParameter('Company users - can invite', String(canInviteUser));

            return { ...permissions, changeableUserIds, canInviteUser };
        });
    }


    private async readPermissions(page: BasePage, screen: string): Promise<ScreenPermissions> {
        // Waited for, not merely counted: any check that something is ABSENT passes
        // just as happily on a page that failed to load.
        await page.waitForContent();
        const rowCount = await page.renderedRowCount();
        const actionHrefs = await page.listActionHrefs();

        ReportLog.setParameter(`${screen} - rows`, String(rowCount));
        ReportLog.setParameter(`${screen} - actions offered`, String(actionHrefs.length));

        return { rowCount, actionHrefs };
    }
}
