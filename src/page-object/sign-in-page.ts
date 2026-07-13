import { BasePage } from './base-page';
import { Page, Locator, expect } from '@playwright/test';
import { generateTotpCode } from '../core/util/totp-auth';
import { UserCredentials } from '../core/auth/credentials';

/** How many TOTP windows to try before giving up. */
const MAX_TOTP_ATTEMPTS = 5;

export class SignInPage extends BasePage {

    private readonly emailAddressInput: Locator;
    private readonly passwordInput: Locator;
    private readonly signInButton: Locator;
    private readonly totpCodeInput: Locator;
    private readonly totpErrorMessage: Locator;

    constructor(page: Page) {
        super(page);
        this.emailAddressInput = page.locator("input#username");
        this.passwordInput = page.locator("input#password");
        this.signInButton = page.locator("input#kc-login");
        this.totpCodeInput = page.locator("input#otp");
        // Keycloak's "Invalid authenticator code." message on the OTP screen.
        this.totpErrorMessage = page.locator("#input-error-otp-code");
    }

    /** Fill in the username/password and submit. */
    async signIn(credentials: UserCredentials): Promise<void> {
        await this.emailAddressInput.fill(credentials.username);
        await this.passwordInput.fill(credentials.password);
        await this.signInButton.click();
    }


    async inputTotp(secret: string): Promise<void> {
        let lastCode: string | undefined;

        for (let attempt = 1; attempt <= MAX_TOTP_ATTEMPTS; attempt++) {
            if (lastCode !== undefined) {
                // Condition-based wait: block until the generator yields a code
                // different from the rejected one, i.e. the next 30s window.
                await expect
                    .poll(() => generateTotpCode(secret), { timeout: 35_000, intervals: [500] })
                    .not.toBe(lastCode);
            }

            const code = generateTotpCode(secret);
            await this.totpCodeInput.fill(code);
            lastCode = code;

            await this.signInButton.click();
            await this.page.waitForLoadState('domcontentloaded');

            // On the freshly loaded page: the error present means the code was
            // refused; its absence means we are through the OTP step.
            if (!(await this.totpErrorMessage.isVisible())) {
                return;
            }
        }

        throw new Error(
            `TOTP login failed: Keycloak refused the code on all ${MAX_TOTP_ATTEMPTS} attempts.`
        );
    }
}
