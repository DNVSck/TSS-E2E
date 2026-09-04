import { BasePage } from './base-page';
import { Page, Locator, expect } from '@playwright/test';
import { generateTotpCode } from '../core/util/totp-auth';
import { UserCredentials } from '../auth/credentials';
import { LOGIN_ACTIONS } from '../constant/login-actions-constants';

// Sized for code REUSE, not for a mistyped code. A TOTP code can be spent once: sign
// the same account in twice inside one 30-second window and the second attempt
// generates the same digits, which the provider refuses as already used. Proven on
// SIT with two clean sign-ins back to back - no failed attempt involved. Waiting for
// the next window is the fix, and that is what the loop below does.
// Most refusals clear on the second attempt; the wrong-code spec was seen needing 4.
const MAX_TOTP_ATTEMPTS = 8;

const AUTH_SCREEN_TIMEOUT = 90_000;

/**
 * The last TOTP code this process submitted, per secret.
 *
 * A code can be spent once. Without this, the only way a sign-in learns the current
 * window is already spent is by SUBMITTING the spent code and being refused - and
 * every refusal is a failed login attempt, which Keycloak's brute-force detector
 * counts. A suite that signs the same account in for every test therefore spends its
 * way towards a temporary lockout, and a locked account answers correct credentials
 * with 'Invalid username or password' - indistinguishable from a wrong password, so
 * the lockout arrives disguised as a product bug.
 *
 * Remembering what was spent turns that failed login into a wait. Module scope, so
 * every page object in the worker shares it; a secret whose window has already
 * rolled costs nothing, because waitForNextCode returns as soon as the code differs.
 */
const spentTotpCodes = new Map<string, string>();

export class SignInPage extends BasePage {

    private readonly emailAddressInput: Locator;
    private readonly passwordInput: Locator;
    private readonly signInButton: Locator;
    private readonly authenticatorAppRadio: Locator;
    private readonly totpCodeInput: Locator;
    private readonly totpErrorMessage: Locator;
    private readonly errorSummaryMessage: Locator;
    private readonly passwordShowHideButton: Locator;

    constructor(page: Page) {
        super(page);
        this.emailAddressInput = page.locator("input#username");
        this.passwordInput = page.locator("input#password");
        this.signInButton = page.locator("input#kc-login");
        // "Choose how to verify your identity" screen. Its radio inputs carry
        // session-scoped UUIDs for id/value (authenticationExecution-<uuid>),
        // regenerated on every login attempt, so the visible label is the only
        // stable way to select one - never key this off id or value.
        this.authenticatorAppRadio = page.getByRole('radio', {
            name: LOGIN_ACTIONS.AUTHENTICATOR_APP_OPTION_LABEL,
        });
        // Renamed from "otp" to "totp" by Keycloak - confirmed live on sit,
        // 2026-09-02, alongside the new verification-method screen.
        this.totpCodeInput = page.locator("input#totp");
        // The OTP screen's error moved into the shared .govuk-error-summary
        // component - it is no longer a field-level message under its own id.
        // Kept as its own named field for readability at call sites even
        // though it now aliases errorSummaryMessage.
        // Keycloak's "Invalid authenticator code." message on the OTP screen.
        this.errorSummaryMessage = page.locator('.govuk-error-summary__list li');
        this.totpErrorMessage = this.errorSummaryMessage;
        // The GOV.UK password-input component's own JS hook. NOT the aria-label: that
        // reads 'Show password' before the first click and 'Hide password' after it, so
        // a locator keyed on it stops matching the moment the button is used - measured
        // on sit, 2026-08-21. This class is the same in both states.
        this.passwordShowHideButton = page.locator('.govuk-js-password-input-toggle');
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

    /** The OTP screen's field-level error, read once it has rendered. */
    async getAuthenticatorCodeErrorMessage(): Promise<string> {
        await this.totpErrorMessage
            .waitFor({ state: 'visible', timeout: AUTH_SCREEN_TIMEOUT });
        return (await this.totpErrorMessage.innerText()).trim();
    }

    /** Wait until the identity provider has handed over the authenticator-code screen. */
    async waitForAuthenticatorCodeStep(): Promise<void> {
        await this.totpCodeInput.waitFor({ state: 'visible', timeout: AUTH_SCREEN_TIMEOUT });
    }

    /**
     * Pick the authenticator-app option on Keycloak's "Choose how to verify
     * your identity" screen and submit. Always this option, never email: it's
     * the only method every test account has a working secret for - see
     * UserCredentials.totpSecret - email delivery has no automatable inbox in
     * this suite.
     */
    async chooseAuthenticatorAppVerification(): Promise<void> {
        await this.authenticatorAppRadio.waitFor({ state: 'visible', timeout: AUTH_SCREEN_TIMEOUT });
        await this.authenticatorAppRadio.check();
        await this.signInButton.click();
        await this.page.waitForLoadState('domcontentloaded');
    }

    /**
     * Get from submitted-credentials to OTP-screen-ready, whether or not
     * Keycloak inserts the "Choose how to verify your identity" screen in
     * between. Races the two possible next screens rather than probing one -
     * locator.isVisible() checks the DOM synchronously and does not wait for
     * an element to appear, so a probe taken right after signIn() (which has
     * no waitForLoadState) can land mid-navigation and read false on a method
     * screen that hasn't rendered yet. Waiting on whichever screen shows up
     * keeps this working unchanged on an environment/account where the method
     * screen never appears at all.
     */
    async completeVerificationMethodSelection(): Promise<void> {
        await this.totpCodeInput.or(this.authenticatorAppRadio)
            .first().waitFor({ state: 'visible', timeout: AUTH_SCREEN_TIMEOUT });

        if (!(await this.authenticatorAppRadio.isVisible())) {
            return;
        }

        await this.chooseAuthenticatorAppVerification();
        await this.waitForAuthenticatorCodeStep();
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
        // Seeded from what this process already spent for this secret rather than from
        // undefined, so the FIRST attempt waits out a spent window instead of burning a
        // failed login attempt to discover it - see spentTotpCodes.
        let lastCode: string | undefined = spentTotpCodes.get(secret);

        for (let attempt = 1; attempt <= MAX_TOTP_ATTEMPTS; attempt++) {
            if (lastCode !== undefined) {
                await this.waitForNextCode(secret, lastCode);
            }

            const code = generateTotpCode(secret);
            lastCode = code;
            spentTotpCodes.set(secret, code);
            await this.submitCode(code);

            // On the freshly loaded page: the error present means the code was
            // refused; its absence means we are through the OTP step.
            if (!(await this.totpErrorMessage.isVisible())) {
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

    /**
     * Condition-based wait: block until the generator yields a code different from
     * the rejected one, i.e. the next 30-second window has begun.
     */
    private async waitForNextCode(secret: string, lastCode: string): Promise<void> {
        await expect
            .poll(() => generateTotpCode(secret), { timeout: 35_000, intervals: [500] })
            .not.toBe(lastCode);
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