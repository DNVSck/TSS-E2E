import { TestInfo } from '@playwright/test';
import { BasePage } from '../page-object/base-page';
import { PortalPage } from '../page-object/portal-page';
import { SignInPage } from '../page-object/sign-in-page';
import { ReportLog } from '../core/report/report-log';
import { UserCredentials } from '../auth/credentials';

export interface ConcurrentLoginResult {
    deviceASignedIn: boolean;
    deviceBSignedIn: boolean;
    deviceAErrorMessage: string | null;
    deviceBErrorMessage: string | null;
}

export interface ConcurrentLoginInput {
    credentials: UserCredentials;
    baseUrl: string;
    testInfo: TestInfo;
}

/** Orchestrates sign-in on two separate browser contexts to verify concurrent session behavior. */
export class ConcurrentLoginFlow {
    constructor(
        private readonly deviceABasePage: BasePage,
        private readonly deviceAPortalPage: PortalPage,
        private readonly deviceASignInPage: SignInPage,
        private readonly deviceBBasePage: BasePage,
        private readonly deviceBPortalPage: PortalPage,
        private readonly deviceBSignInPage: SignInPage,
    ) {}

    async signInOnBothDevices(input: ConcurrentLoginInput): Promise<ConcurrentLoginResult> {
        const { credentials, baseUrl, testInfo } = input;

        await ReportLog.step('Device A: Navigate to sign-in page', async () => {
            await this.deviceABasePage.navigateToPortal(baseUrl, testInfo);
            await this.deviceAPortalPage.clickSignIn();
        });

        await ReportLog.step('Device A: Enter email and password, click Sign in', async () => {
            await this.deviceASignInPage.submitCredentials(credentials.username, credentials.password);
        });

        await ReportLog.step('Device A: Verify MFA code entry screen is displayed', async () => {
            await this.deviceASignInPage.waitForAuthenticatorCodeStep();
        });

        await ReportLog.step('Device A: Enter valid MFA code and click Continue', async () => {
            await this.deviceASignInPage.inputTotp(credentials.totpSecret!);
            await this.deviceAPortalPage.waitUntilSignedIn(60_000);
        });

        await ReportLog.step('Device B: Navigate to sign-in page', async () => {
            await this.deviceBBasePage.navigateToPortal(baseUrl, testInfo);
            await this.deviceBPortalPage.clickSignIn();
        });

        await ReportLog.step('Device B: Enter same email and password, click Sign in', async () => {
            await this.deviceBSignInPage.submitCredentials(credentials.username, credentials.password);
        });

        await ReportLog.step('Device B: Verify MFA code entry screen is displayed', async () => {
            await this.deviceBSignInPage.waitForAuthenticatorCodeStep();
        });

        await ReportLog.step('Device B: Enter valid MFA code and click Continue', async () => {
            await this.deviceBSignInPage.inputTotp(credentials.totpSecret!);
            await this.deviceBPortalPage.waitUntilSignedIn(60_000);
        });

        const deviceASignedIn = await this.deviceAPortalPage.isSignedIn();
        const deviceBSignedIn = await this.deviceBPortalPage.isSignedIn();

        ReportLog.setParameter('Device A signed in', String(deviceASignedIn));
        ReportLog.setParameter('Device B signed in', String(deviceBSignedIn));

        return {
            deviceASignedIn,
            deviceBSignedIn,
            deviceAErrorMessage: null,
            deviceBErrorMessage: null,
        };
    }
}
