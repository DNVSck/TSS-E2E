import { TestInfo } from '@playwright/test';
import { BasePage } from '../page-object/base-page';
import { PortalPage } from '../page-object/portal-page';
import { SignInPage } from '../page-object/sign-in-page';
import { ReportLog } from '../core/report/report-log';
import { UserCredentials } from '../auth/credentials';
import { generateInvalidTotpCode } from '../core/util/totp-auth';

/** The identity provider redirects twice before the portal renders signed-in. */
const SIGN_IN_TIMEOUT_MS = 60_000;

export interface OpenSignInInput {
    baseUrl: string;
    testInfo: TestInfo;
}

export class SignInFlow {
    constructor(
        private readonly basePage: BasePage,
        private readonly portalPage: PortalPage,
        private readonly signInPage: SignInPage,
    ) { }

    /** Open the portal signed-out and hand over to the identity provider. */
    async openSignInScreen(input: OpenSignInInput): Promise<void> {
        await ReportLog.step('Open the sign-in screen', async () => {
            await this.basePage.navigateToPortal(input.baseUrl, input.testInfo);
            await this.portalPage.clickSignIn();
        });
    }

    async submitRejectedCredentials(
        username: string,
        password: string,
        description: string
    ): Promise<string> {
        return ReportLog.step(`Submit ${description}`, async () => {
            await this.signInPage.submitCredentials(username, password);
            const message = await this.signInPage.getSignInErrorMessage();

            // Reported here, not in the spec: a report that only says "expected X,
            // got Y" still lacks what the service actually told the user.
            ReportLog.setParameter(`Error shown for ${description}`, message);
            return message;
        });
    }

    /** Submit credentials that are correct, landing on the authenticator-code screen. */
    async submitValidCredentials(credentials: UserCredentials): Promise<void> {
        await ReportLog.step('Submit valid credentials', async () => {
            await this.signInPage.submitCredentials(credentials.username, credentials.password);
            await this.signInPage.waitForAuthenticatorCodeStep();
        });
    }

    /** Submit a wrong authenticator code, and return what the user was told. */
    async submitWrongAuthenticatorCode(credentials: UserCredentials): Promise<string> {
        return ReportLog.step('Submit a wrong authenticator code', async () => {
            await this.signInPage.submitAuthenticatorCode(
                generateInvalidTotpCode(credentials.totpSecret!)
            );
            const message = await this.signInPage.getAuthenticatorCodeErrorMessage();

            ReportLog.setParameter('Error shown for a wrong authenticator code', message);
            return message;
        });
    }


    async signIn(credentials: UserCredentials, input: OpenSignInInput): Promise<void> {
        await ReportLog.step(`Sign in as ${credentials.username}`, async () => {
            await this.basePage.navigateToPortal(input.baseUrl, input.testInfo);
            await this.signInFromPortal(credentials);
        });
    }


    async restoreSignedInState(
        credentials: UserCredentials,
        input: OpenSignInInput
    ): Promise<void> {
        await ReportLog.step('Restore a signed-in session (clears the failed-attempt counter)', async () => {
            await this.basePage.navigateToPortal(input.baseUrl, input.testInfo);

            if (await this.portalPage.isSignedIn()) {
                return;
            }

            await this.signInFromPortal(credentials);
        });
    }

    /** Portal landing page -> signed in. Assumes the portal is already open. */
    private async signInFromPortal(credentials: UserCredentials): Promise<void> {
        await this.portalPage.clickSignIn();
        await this.signInPage.signIn(credentials);
        await this.completeAuthenticatorStep(credentials);
    }


    async completeSignInFromAuthenticatorStep(credentials: UserCredentials): Promise<void> {
        await ReportLog.step(`Sign in successfully as ${credentials.username}`, async () => {
            await this.completeAuthenticatorStep(credentials);
        });
    }

    private async completeAuthenticatorStep(credentials: UserCredentials): Promise<void> {
        // inputTotp owns the retry across TOTP windows: a code refused because its
        // window has just rolled is resubmitted on the next one.
        await this.signInPage.inputTotp(credentials.totpSecret!);
        await this.portalPage.waitUntilSignedIn(SIGN_IN_TIMEOUT_MS);
    }
}
