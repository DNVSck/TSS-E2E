import { BasePage } from '../page-object/base-page';
import { PortalPage } from '../page-object/portal-page';
import { SignInPage } from '../page-object/sign-in-page';
import { ReportLog } from '../core/report/report-log';
import { expect, TestInfo } from '@playwright/test';

export interface PortalAccessInput {
    baseUrl: string;
    testInfo: TestInfo;
    expectedTitle: string;
}

export class PortalAccessFlow {
    constructor(
        private readonly basePage: BasePage,
        private readonly portalPage: PortalPage,
        private readonly signInPage: SignInPage
    ) { }

    async accessServiceAsAdmin(input: PortalAccessInput): Promise<void> {
        const { baseUrl, testInfo, expectedTitle } = input;

        await ReportLog.step('Open portal', async () => {
            await this.basePage.navigateToPortal(baseUrl, testInfo);
        });

        await ReportLog.step('Open Sign In page', async () => {
            await this.portalPage.clickSignIn();
        });

        await ReportLog.step('Sign in as admin', async () => {
            await this.signInPage.signInAsAdmin();
        });

        await ReportLog.step('Verify portal title', async () => {
            await expect(this.portalPage.portalTitleLocator).toHaveText(expectedTitle);
        });

        await ReportLog.step('Start service journey', async () => {
            await this.portalPage.startTssJourney();
        });
    }
}
