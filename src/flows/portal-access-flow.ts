import { BasePage } from '../page-object/base-page';
import { PortalPage } from '../page-object/portal-page';
import { SignInPage } from '../page-object/sign-in-page';
import { ReportLog } from '../core/report/report-log';
import { TestInfo } from '@playwright/test';
import { getCredentials, UserCredentials, CompanyProfile } from '../core/auth/credentials';
import { ENV, OTP_ENABLED } from '../../config/environment';

export interface PortalAccessInput {
    baseUrl: string;
    testInfo: TestInfo;
    profile: CompanyProfile;
}

export class PortalAccessFlow {
    constructor(
        private readonly basePage: BasePage,
        private readonly portalPage: PortalPage,
        private readonly signInPage: SignInPage
    ) { }

    /**
     * Open the portal and sign in as the given company profile. Credentials and
     * the TOTP secret are resolved dynamically from the profile, so the same flow
     * works for AGENT, IMPORTER or HAULIER. Returns the resolved credentials
     * (handy for reading e.g. the account's EORI later in the test).
     */
    async accessService(input: PortalAccessInput): Promise<UserCredentials> {
        const { baseUrl, testInfo, profile } = input;
        const credentials = getCredentials(profile);

        await ReportLog.step('Open portal', async () => {
            await this.basePage.navigateToPortal(baseUrl, testInfo);
        });

        await ReportLog.step('Open Sign In page', async () => {
            await this.portalPage.clickSignIn();
        });

        await ReportLog.step(`Sign in as ${profile} company user`, async () => {
            await this.signInPage.signIn(credentials);
            await this.completeOtpIfRequired(credentials);
        });

        await ReportLog.step('Start service journey', async () => {
            await this.portalPage.startTssJourney();
        });

        return credentials;
    }

    /**
     * Complete the OTP step when the environment requires it (OTP_ENABLED).
     * Fails fast if the environment enforces OTP but the profile has no secret.
     */
    private async completeOtpIfRequired(credentials: UserCredentials): Promise<void> {
        if (!OTP_ENABLED) return;

        if (!credentials.totpSecret) {
            throw new Error(
                `OTP_ENABLED is true but no TOTP secret is set for profile "${credentials.profile}". ` +
                `Set ${credentials.profile}_TOTP_SECRET in .env.${ENV}.`
            );
        }

        await this.signInPage.inputTotp(credentials.totpSecret);
    }

}
