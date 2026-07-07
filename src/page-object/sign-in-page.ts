import { BasePage } from './base-page';
import { Page, Locator } from '@playwright/test';
import { generateTotpCode } from '../core/util/totp-auth';
import { UserCredentials } from '../core/auth/credentials';

export class SignInPage extends BasePage {

    readonly emailAddressInput: Locator;
    readonly passwordInput: Locator;
    readonly signInButton: Locator;
    readonly totpCodeInput: Locator;

    constructor(page: Page) {
        super(page);
        this.emailAddressInput = page.locator("input#username");
        this.passwordInput = page.locator("input#password");
        this.signInButton = page.locator("input#kc-login");
        this.totpCodeInput = page.locator("input#otp");
    }

    /** Fill in the username/password and submit. */
    async signIn(credentials: UserCredentials): Promise<void> {
        await this.emailAddressInput.fill(credentials.username);
        await this.passwordInput.fill(credentials.password);
        await this.signInButton.click();
    }

    /** Complete the TOTP/OTP step using the account's own secret. */
    async inputTotp(secret: string): Promise<void> {
        await this.totpCodeInput.fill(generateTotpCode(secret));
        await this.signInButton.click();
    }
}
