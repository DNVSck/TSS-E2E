import { TestInfo } from '@playwright/test';
import { BasePage } from '../page-object/base-page';
import { PortalPage } from '../page-object/portal-page';
import { SignInPage } from '../page-object/sign-in-page';
import { NavigationBanner } from '../page-object/components/navigation-banner';
import { ReportLog } from '../core/report/report-log';
import { UserCredentials } from '../auth/credentials';
import { generateInvalidTotpCode } from '../core/util/totp-auth';
import { OTP_ENABLED } from '../../config/environment';
import { AccessibilityCheckpoint } from './accessibility-audit-flow';

/** The identity provider redirects twice before the portal renders signed-in. */
const SIGN_IN_TIMEOUT_MS = 60_000;

export interface OpenSignInInput {
    baseUrl: string;
    testInfo: TestInfo;
}

export interface SignInAudit {
    checkpoint?: AccessibilityCheckpoint;
    probeErrors?: boolean;
}

export interface AuthPageUrls {
    passwordPageUrl?: string;
    mfaPageUrl?: string;
}

export interface DirectAccessResult {
    /** Whether the auth screen rendered when its URL was opened directly. */
    screenVisible: boolean;
    /** Where the browser actually ended up - the same URL, or somewhere else if redirected. */
    url: string;
}

export class SignInFlow {
    private passwordToggles = 0;

    constructor(
        private readonly basePage: BasePage,
        private readonly portalPage: PortalPage,
        private readonly signInPage: SignInPage,
        private readonly navigationBanner: NavigationBanner,
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
            ReportLog.setParameter(`${description} error`, message);
            return message;
        });
    }

    /**
     * Submit credentials that are correct, landing on the authenticator-code screen.
     *
     * Returns the password and MFA page URLs captured along the way, so callers that
     * need them later (e.g. browser-history checks) hold them explicitly rather than
     * relying on flow-internal state - which would make the order of calls matter
     * without saying so anywhere in a signature.
     */
    async submitValidCredentials(credentials: UserCredentials): Promise<AuthPageUrls> {
        return ReportLog.step('Submit valid credentials', async () => {
            const passwordPageUrl = this.basePage.getCurrentUrl();

            await this.signInPage.submitCredentials(credentials.username, credentials.password);
            await this.signInPage.waitForAuthenticatorCodeStep();

            const mfaPageUrl = this.basePage.getCurrentUrl();

            return { passwordPageUrl, mfaPageUrl };
        });
    }

    /** Submit a wrong authenticator code, and return what the user was told. */
    async submitWrongAuthenticatorCode(credentials: UserCredentials): Promise<string> {
        return ReportLog.step('Submit a wrong authenticator code', async () => {
            await this.signInPage.submitAuthenticatorCode(
                generateInvalidTotpCode(credentials.totpSecret!)
            );
            const message = await this.signInPage.getAuthenticatorCodeErrorMessage();

            ReportLog.setParameter('Wrong code error', message);
            return message;
        });
    }


    async signIn(
        credentials: UserCredentials,
        input: OpenSignInInput,
        audit?: SignInAudit
    ): Promise<void> {
        await ReportLog.step(`Sign in as ${credentials.username}`, async () => {
            await this.basePage.navigateToPortal(input.baseUrl, input.testInfo);
            await audit?.checkpoint?.('Portal landing page (signed out)');
            await this.signInFromPortal(credentials, audit);
        });
    }


    async restoreSignedInState(
        credentials: UserCredentials,
        input: OpenSignInInput
    ): Promise<void> {
        await ReportLog.step('Restore a signed-in session (clears the failed-attempt counter)', async () => {
            await this.basePage.navigateToPortal(input.baseUrl, input.testInfo);

            if (await this.navigationBanner.isSignedIn()) {
                return;
            }

            await this.signInFromPortal(credentials);
        });
    }

    /** Portal landing page -> signed in. Assumes the portal is already open. */
    private async signInFromPortal(
        credentials: UserCredentials,
        audit?: SignInAudit
    ): Promise<void> {
        if (audit) {
            await this.portalPage.openSignInChoice();
            // Not error-probed: this screen accepts an empty submit and goes on to the
            // identity provider, so a probe would advance the journey rather than
            // reach an error state.
            await audit.checkpoint?.('Portal - sign-in choice');
            await this.portalPage.confirmSignInChoice();
        } else {
            await this.portalPage.clickSignIn();
        }

        if (audit) {
            // The identity provider arrives on its own page load, so a scan fired
            // before it lands would audit the page being navigated away from. On this
            // path only: signIn below waits for the same field itself.
            await this.signInPage.waitForPasswordScreen();
            await audit.checkpoint?.('Sign-in form (identity provider)');
        }

        if (audit?.probeErrors) {
            await this.auditRefusedCredentials('', '', 'submitted empty', audit);
            await this.auditRefusedCredentials(
                credentials.username, 'not-the-password', 'wrong password', audit
            );
        }

        await this.signInPage.signIn(credentials);
        await this.completeAuthenticatorStep(credentials, audit);
    }

    private async auditRefusedCredentials(
        username: string,
        password: string,
        description: string,
        audit: SignInAudit
    ): Promise<void> {
        await this.signInPage.submitCredentials(username, password);
        await this.signInPage.getSignInErrorMessage();
        await audit.checkpoint?.(`Sign-in form - ${description} (error shown)`);
    }


    async completeSignInFromAuthenticatorStep(credentials: UserCredentials): Promise<void> {
        await ReportLog.step(`Sign in successfully as ${credentials.username}`, async () => {
            await this.completeAuthenticatorStep(credentials);
        });
    }

    private async completeAuthenticatorStep(
        credentials: UserCredentials,
        audit?: SignInAudit
    ): Promise<void> {

        if (!OTP_ENABLED) {
            await this.portalPage.waitUntilSignedIn(SIGN_IN_TIMEOUT_MS);
            await audit?.checkpoint?.('Portal home (signed in)');
            return;
        }

        // Only accounts with more than one credential type are asked to choose.
        if (audit && await this.signInPage.waitForVerificationStep() === 'choice') {
            await audit.checkpoint?.('Sign-in - choose how to verify your identity');
        }

        // The authenticator screen arrives on its own page load, so it is given a budget
        // of its own rather than the ambient action timeout. Without this, the first thing
        // to touch the field is inputTotp's fill, which auto-waits for the action timeout
        // and then reports a field it could not fill - which reads as a broken input
        // rather than a page that had simply not rendered yet.
        await this.signInPage.waitForAuthenticatorCodeStep();

        // inputTotp owns the retry across TOTP windows: a code refused because its
        // window has just rolled is resubmitted on the next one.
        await audit?.checkpoint?.('Sign-in - authenticator code');

        if (audit?.probeErrors) {
            await this.signInPage.submitAuthenticatorCode(
                generateInvalidTotpCode(credentials.totpSecret!)
            );
            await this.signInPage.getAuthenticatorCodeErrorMessage();
            await audit.checkpoint?.('Sign-in - authenticator code - wrong code (error shown)');
        }

        await this.signInPage.inputTotp(credentials.totpSecret!);
        await this.portalPage.waitUntilSignedIn(SIGN_IN_TIMEOUT_MS);
        await audit?.checkpoint?.('Portal home (signed in)');
    }

    async getPasswordFieldAutocomplete(): Promise<string | null> {
        return ReportLog.step('Get password field autocomplete attribute', async () => {
            const value = await this.signInPage.getPasswordAutocompleteAttribute();
            ReportLog.setParameter('Password autocomplete', value ?? 'not set');
            return value;
        });
    }

    async getOtpFieldAutocomplete(): Promise<string | null> {
        return ReportLog.step('Get MFA code field autocomplete attribute', async () => {
            const value = await this.signInPage.getOtpAutocompleteAttribute();
            ReportLog.setParameter('OTP autocomplete', value ?? 'not set');
            return value;
        });
    }

    async getOtpFieldValue(): Promise<string> {
        return ReportLog.step('Get MFA code field current value', async () => {
            const value = await this.signInPage.getOtpFieldValue();
            // Never log actual OTP value for security
            ReportLog.setParameter('OTP field value', value ? '[hidden for security]' : 'empty');
            return value;
        });
    }

    async getPasswordFieldValue(): Promise<string> {
        return ReportLog.step('Get password field current value', async () => {
            const value = await this.signInPage.getPasswordFieldValue();
            // Never log actual password value for security
            ReportLog.setParameter('Password field value', value ? '[hidden for security]' : 'empty');
            return value;
        });
    }

    async getEmailFieldValue(): Promise<string> {
        return ReportLog.step('Get email field current value', async () => {
            const value = await this.signInPage.getEmailFieldValue();
            ReportLog.setParameter('Email field value', value ? '[present]' : 'empty');
            return value;
        });
    }

    async isOtpFieldVisible(): Promise<boolean> {
        return ReportLog.step('Check if MFA code field is visible', async () => {
            const visible = await this.signInPage.isOtpFieldVisible();
            ReportLog.setParameter('OTP field visible', String(visible));
            return visible;
        });
    }

    /**
     * Click the browser back button and verify user is redirected appropriately.
     */
    async clickBrowserBackButton(): Promise<string> {
        return ReportLog.step('Click browser back button', async () => {
            const urlAfterBack = await this.basePage.clickBrowserBackButton();
            ReportLog.setParameter('URL after back', urlAfterBack);
            return urlAfterBack;
        });
    }

    /**
     * Open the given URL - captured earlier as the MFA screen's URL - directly, and
     * report what rendered. Whether that counts as a security issue is for the spec
     * to decide, the same way every other flow in this suite reports facts and
     * leaves the assertion to the caller.
     * Used for Test Case 2549 Step 2: Browser History Protection.
     */
    async openMfaPageDirectly(mfaUrl: string): Promise<DirectAccessResult> {
        return ReportLog.step('Open MFA page directly', async () => {
            await this.basePage.navigateToUrlDirect(mfaUrl);

            const screenVisible = await this.signInPage.isOtpScreenVisible();
            const url = this.basePage.getCurrentUrl();

            ReportLog.setParameter('Direct access to MFA', String(screenVisible));
            ReportLog.setParameter('MFA direct access URL', url);

            return { screenVisible, url };
        });
    }

    /**
     * Open the given URL - captured earlier as the password screen's URL - directly,
     * and report what rendered. Whether that counts as a security issue is for the
     * spec to decide, the same way every other flow in this suite reports facts and
     * leaves the assertion to the caller.
     * Used for Test Case 2549 Step 2: Browser History Protection.
     */
    async openPasswordPageDirectly(passwordUrl: string): Promise<DirectAccessResult> {
        return ReportLog.step('Open password page directly', async () => {
            await this.basePage.navigateToUrlDirect(passwordUrl);

            const screenVisible = await this.signInPage.isPasswordScreenVisible();
            const url = this.basePage.getCurrentUrl();

            ReportLog.setParameter('Direct access to password', String(screenVisible));
            ReportLog.setParameter('Password direct access URL', url);

            return { screenVisible, url };
        });
    }

    /**
     * Type a password into the sign-in form without submitting it.
     *
     * An action, so it is a step of its own: the toggle assertions that follow are only
     * meaningful against a field that holds something, and a report that does not show
     * the field was filled cannot say why they were meaningful.
     */
    async enterPassword(password: string): Promise<void> {
        await ReportLog.step('Enter a password without submitting', async () => {
            await this.signInPage.enterPassword(password);
        });
    }

    /**
     * Whether the password toggle button (Show/Hide) is visible on the sign-in page.
     * A pure observation, like the other isX methods on this class - the spec
     * decides whether visible-or-not is correct for the step it's in.
     */
    async isPasswordToggleButtonVisible(): Promise<boolean> {
        return ReportLog.step('Check password toggle button visible', async () => {
            const visible = await this.signInPage.isPasswordToggleButtonVisible();
            ReportLog.setParameter('Toggle button', String(visible));
            return visible;
        });
    }

    /**
     * Whether the password field is currently in masked state (type="password").
     * A pure observation, like the other isX methods on this class - the spec
     * decides whether masked-or-not is correct for the step it's in.
     */
    async isPasswordMasked(): Promise<boolean> {
        return ReportLog.step('Check password field masked state', async () =>
            this.signInPage.isPasswordMasked()
        );
    }

    /**
     * Click the password toggle button to show or hide the password.
     *
     * One parameter per toggle, numbered, because this runs several times in a test and
     * Allure appends a row per call rather than replacing one: five fixed names written
     * three times each left fifteen rows that could not be told apart.
     */
    async togglePasswordVisibility(): Promise<void> {
        return ReportLog.step('Toggle password visibility', async () => {
            const before = await this.signInPage.getPasswordToggleButtonText();
            await this.signInPage.togglePasswordVisibility();
            const after = await this.signInPage.getPasswordToggleButtonText();

            this.passwordToggles += 1;
            ReportLog.setParameter(
                `Password toggle ${this.passwordToggles}`, `${before} -> ${after}`
            );
        });
    }

    /**
     * Get the current password toggle button text ("Show" or "Hide").
     */
    async getPasswordToggleButtonText(): Promise<string> {
        return ReportLog.step('Get password toggle button text', async () =>
            this.signInPage.getPasswordToggleButtonText()
        );
    }
}
