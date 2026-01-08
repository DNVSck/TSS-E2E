import { BasePage } from '../page-object/base-page.ts';
import { PortalPage } from '../page-object/portal-page.ts';
import { SignInPage } from '../page-object/sign-in-page.ts';
import { ReportLog } from '../core/report/ReportLog.ts';

export class PortalAccessFlow {
    constructor(
        private readonly basePage: BasePage,
        private readonly portalPage: PortalPage,
        private readonly signInPage: SignInPage
    ) { }

    async accessServiceAsAdmin(
        baseUrl: string,
        testInfo: any
    ): Promise<void> {

        await ReportLog.step('Open portal', async () => {
            await this.basePage.navigateToPortal(baseUrl, testInfo);
        });

        await ReportLog.step('Open Sign In page', async () => {
            await this.portalPage.clickSignIn();
        });

        await ReportLog.step('Sign in as admin', async () => {
            await this.signInPage.signInAsAdmin();
        });

        await ReportLog.step('Start service journey', async () => {
            await this.portalPage.startTssJourney();
        });


    }
}
