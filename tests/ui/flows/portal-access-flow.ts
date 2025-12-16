import { BasePage } from '../../../src/page-object/base-page.ts';
import { PortalPage } from '../../../src/page-object/portal-page';
import { SignInPage } from '../../../src/page-object/sign-in-page';
import { ReportLog } from '../../../src/core/report/ReportLog';

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
            await this.portalPage.clickOnStartNow();
        });
    }
}
