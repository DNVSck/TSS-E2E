import { BasePage } from './base-page';
import { Page, Locator } from '@playwright/test';
import { freshTotpCode } from '../auth/totp-state';
import { UserCredentials } from '../auth/credentials';
import { TFunction } from '../fixtures/locale-fixture';
import { GOVUK } from './components/govuk-selectors';

// Sized for code REUSE, not for a mistyped code. A TOTP code can be spent once: sign
// the same account in twice inside one 30-second window and the second attempt
// generates the same digits, which the provider refuses as already used. Proven on
// SIT with two clean sign-ins back to back - no failed attempt involved. Waiting for
// the next window is the fix, and that is what the loop below does.
// Most refusals clear on the second attempt; the wrong-code spec was seen needing 4.
const MAX_TOTP_ATTEMPTS = 8;

const AUTH_SCREEN_TIMEOUT = 90_000;


export class SignInPage extends BasePage {

    private readonly emailAddressInput: Locator;
    private readonly passwordInput: Locator;
    private readonly signInButton: Locator;
    private readonly totpCodeInput: Locator;
    // One summary serves every screen the provider shows - the password form and both
    // code screens. A refused code no longer marks its own field, so this is also how
    // inputTotp tells a refusal from a success.
    private readonly errorSummaryMessage: Locator;
    private readonly passwordShowHideButton: Locator;
    private readonly authenticatorAppOption: Locator;
    private readonly emailCodeOption: Locator;
    private readonly emailCodeInput: Locator;

    constructor(page: Page, t: TFunction) {
        super(page, t);
        this.emailAddressInput = page.locator("input#username");
        this.passwordInput = page.locator("input#password");
        this.signInButton = page.locator("input#kc-login");
        this.totpCodeInput = page.locator("input#totp");
        this.errorSummaryMessage = page.locator(`${GOVUK.ERROR_SUMMARY.LIST} li`);
        this.passwordShowHideButton = page.locator(GOVUK.PASSWORD_INPUT.TOGGLE);

        this.authenticatorAppOption = page.getByRole('radio', {
            name: t('signIn.verifyIdentity.authenticatorApp'), exact: true,
        });
        this.emailCodeOption = page.getByRole('radio', {
            name: t('signIn.verifyIdentity.emailCode'), exact: true,
        });

        this.emailCodeInput = page.locator('input#code');

    }

    /**
     * Get past "Choose how to verify your identity", if it is shown at all.
     *
     * Conditional: the identity provider only asks when the account has more than one
     * credential type configured, so the OTP field is RACED against the options - a
     * plain wait on either spends its whole budget whenever the other one arrived.
     *
     */
    async selectAuthenticatorApp(): Promise<void> {
        await this.totpCodeInput.or(this.authenticatorAppOption)
            .first().waitFor({ state: 'visible', timeout: AUTH_SCREEN_TIMEOUT });

        // The OTP screen won the race, so this account was never asked to choose.
        if (!await this.authenticatorAppOption.isVisible()) return;

        await this.chooseVerification(this.authenticatorAppOption);
    }

    /**
     * Ask for the code by email instead.
     *
     * Written ahead of any caller: no environment this suite runs against exposes a
     * mailbox it can read, so the journey cannot be finished here yet. Waits rather
     * than races, unlike the authenticator path - a caller asking for email wants this
     * screen, so its absence is a failure and not a branch.
     */
    async selectEmailCode(): Promise<void> {
        await this.emailCodeOption.waitFor({ state: 'visible', timeout: AUTH_SCREEN_TIMEOUT });
        await this.chooseVerification(this.emailCodeOption);
    }

    /**
     * Submit a code that arrived by email.
     *
     * Takes the code rather than generating one, unlike {@link inputTotp}: an emailed
     * code has no secret to derive it from, so whoever reads the mailbox supplies it.
     */
    async submitEmailCode(code: string): Promise<void> {
        await this.emailCodeInput.waitFor({ state: 'visible', timeout: AUTH_SCREEN_TIMEOUT });
        await this.emailCodeInput.fill(code);
        await this.signInButton.click();
        await this.page.waitForLoadState('domcontentloaded');
    }

    /** Tick one of the verification options and move on. */
    private async chooseVerification(option: Locator): Promise<void> {
        await option.check();
        await this.signInButton.click();
        await this.page.waitForLoadState('domcontentloaded');
    }

    /** Fill in the username/password and submit. */
    async signIn(credentials: UserCredentials): Promise<void> {
        await this.emailAddressInput.fill(credentials.username);
        await this.passwordInput.fill(credentials.password);
        await this.signInButton.click();
    }

    /**
     * Submit the sign-in form exactly as given - including blank values, which is a
     * case a test needs. Kept apart from {@link signIn} because that one takes a
     * whole account and this one deliberately takes strings that need not identify
     * any account at all.
     */
    async submitCredentials(username: string, password: string): Promise<void> {
        await this.emailAddressInput.waitFor({ state: 'visible', timeout: AUTH_SCREEN_TIMEOUT });
        await this.emailAddressInput.fill(username);
        await this.passwordInput.fill(password);
        await this.signInButton.click();
        await this.page.waitForLoadState('domcontentloaded');
    }

    /**
     * The sign-in error, read once it has rendered. Returned rather than asserted
     * so the caller can both report the text and assert it - a report that only
     * says "the assertion failed" cannot say what the service actually told the user.
     */
    async getSignInErrorMessage(): Promise<string> {
        await this.errorSummaryMessage.first()
            .waitFor({ state: 'visible', timeout: AUTH_SCREEN_TIMEOUT });
        return (await this.errorSummaryMessage.first().innerText()).trim();
    }

    /**
     * What the OTP screen said about a refused code.
     *
     * Reads the same summary as the password screen, but kept under its own name: the
     * caller is asking a different question, and a spec reporting "Authenticator code
     * error" should not read as if it were checking a password.
     */
    async getAuthenticatorCodeErrorMessage(): Promise<string> {
        return this.getSignInErrorMessage();
    }

    /**
     * Wait until the identity provider has handed over the authenticator-code screen.
     *
     * Answers the credential-choice step on the way when it is shown: the contract is
     * "the OTP field is up when this returns", and since that step the screen is no
     * longer reachable by waiting alone.
     */
    async waitForAuthenticatorCodeStep(): Promise<void> {
        await this.selectAuthenticatorApp();
        await this.totpCodeInput.waitFor({ state: 'visible', timeout: AUTH_SCREEN_TIMEOUT });
    }

    /**
     * Submit one specific code. Public so a test can submit a WRONG one; the
     * correct-code path goes through {@link inputTotp}, which owns the retry across
     * TOTP windows.
     */
    async submitAuthenticatorCode(code: string): Promise<void> {
        await this.submitCode(code);
    }


    async inputTotp(secret: string): Promise<void> {
        // Callers that reach here straight from signIn - globalSetup does - have not
        // passed the credential-choice step yet. A no-op once it is behind us.
        await this.selectAuthenticatorApp();

        for (let attempt = 1; attempt <= MAX_TOTP_ATTEMPTS; attempt++) {
            // freshTotpCode waits out a window ANY process has already spent - the
            // browser sign-in and the API token mint draw on one account - so the
            // FIRST attempt never burns a failed login discovering that.
            await this.submitCode(await freshTotpCode(secret));

            // On the freshly loaded page: the error present means the code was
            // refused; its absence means we are through the OTP step.
            if (!(await this.errorSummaryMessage.first().isVisible())) {
                return;
            }

            // Say so. Otherwise a sign-in waiting out a 30-second window sits there
            // silently, and the next person to watch a run has no way to tell waiting
            // from hanging.
            //
            // console, not ReportLog: this also runs in globalSetup, where there is
            // no test for an Allure step to attach to.
            console.log(
                `TOTP attempt ${attempt} of ${MAX_TOTP_ATTEMPTS} refused. Waiting for the ` +
                `next 30-second window. Usually this means the code was already spent by ` +
                `an earlier sign-in of the same account in this window.`
            );
        }

        throw new Error(
            `TOTP login failed: Keycloak refused the code on all ${MAX_TOTP_ATTEMPTS} attempts ` +
            `(about ${MAX_TOTP_ATTEMPTS * 30} seconds of windows). That is far longer than a ` +
            `spent code takes to roll over, so check the TOTP secret and the machine clock ` +
            `rather than assuming a busy account.`
        );
    }


    /** Fill the OTP code, submit, and wait for the resulting page to load. */
    private async submitCode(code: string): Promise<void> {
        await this.totpCodeInput.fill(code);
        await this.signInButton.click();
        await this.page.waitForLoadState('domcontentloaded');
    }

    async getPasswordAutocompleteAttribute(): Promise<string | null> {
        return await this.passwordInput.getAttribute('autocomplete');
    }

    async getOtpAutocompleteAttribute(): Promise<string | null> {
        return await this.totpCodeInput.getAttribute('autocomplete');
    }

    async getPasswordFieldValue(): Promise<string> {
        return await this.passwordInput.inputValue();
    }

    async getOtpFieldValue(): Promise<string> {
        return await this.totpCodeInput.inputValue();
    }

    async getEmailFieldValue(): Promise<string> {
        return await this.emailAddressInput.inputValue();
    }

    async isOtpFieldVisible(): Promise<boolean> {
        return await this.totpCodeInput.isVisible({ timeout: 2000 }).catch(() => false);
    }

    /**
     * Check if the OTP/MFA screen is currently visible.
     * Used for security testing to verify MFA screen is not accessible after back button.
     */
    async isOtpScreenVisible(): Promise<boolean> {
        try {
            return await this.totpCodeInput.isVisible({ timeout: 2000 });
        } catch {
            return false;
        }
    }

    /**
     * Check if the password screen is currently visible.
     * Used for security testing to verify password screen is not accessible.
     */
    async isPasswordScreenVisible(): Promise<boolean> {
        try {
            return await this.passwordInput.isVisible({ timeout: 2000 });
        } catch {
            return false;
        }
    }

    /**
     * Get the current page URL (convenience method for testing).
     */
    async getCurrentPageUrl(): Promise<string> {
        return this.page.url();
    }

    /**
     * Toggle password visibility by clicking the Show/Hide button.
     * The button text changes from "Show" to "Hide" and vice versa.
     * The password field type changes from "password" to "text" and back.
     */
    async togglePasswordVisibility(): Promise<void> {
        await this.passwordShowHideButton.click();
    }

    /**
     * Type a password without submitting the form.
     *
     * The masking behaviour is only worth asserting on a field that HOLDS something -
     * an empty field is masked whatever the toggle does. Separate from {@link signIn}
     * because that one submits, which leaves the screen.
     */
    async enterPassword(password: string): Promise<void> {
        await this.passwordInput.waitFor({ state: 'visible', timeout: AUTH_SCREEN_TIMEOUT });
        await this.passwordInput.fill(password);
    }

    /**
     * Get the current password field type attribute.
     * Returns "password" when masked, "text" when visible.
     */
    async getPasswordFieldType(): Promise<string | null> {
        return await this.passwordInput.getAttribute('type');
    }

    /**
     * Get the current text of the password toggle button ("Show" or "Hide").
     */
    async getPasswordToggleButtonText(): Promise<string> {
        return (await this.passwordShowHideButton.innerText()).trim();
    }

    /**
     * Check if the password field is currently masked.
     * Returns true if field type is "password", false if "text".
     */
    async isPasswordMasked(): Promise<boolean> {
        const fieldType = await this.getPasswordFieldType();
        return fieldType === 'password';
    }

    /**
     * Check if the password toggle button (Show/Hide) is visible on the page.
     */
    async isPasswordToggleButtonVisible(): Promise<boolean> {
        try {
            return await this.passwordShowHideButton.isVisible({ timeout: 2000 });
        } catch {
            return false;
        }
    }
}
