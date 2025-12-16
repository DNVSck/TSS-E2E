import { BasePage } from "./base-page";
import { Page, Locator } from '@playwright/test';

export class SignInPage extends BasePage {

    readonly emailAddressInput: Locator;
    readonly passwordInput: Locator;
    readonly signInButton: Locator;

    constructor(page: Page) {
        super(page);
        this.emailAddressInput = page.locator("input#email");
        this.passwordInput = page.locator("input#password");
        this.signInButton = page.locator("//form[contains(@action, 'sign-in')]//button[@type='submit']");
    }


    async signIn(email: string, password: string): Promise<void> {
        await this.emailAddressInput.fill(email);
        await this.passwordInput.fill(password);
        await this.signInButton.click();
    }

    async signInAsAdmin(): Promise<void> {
        const adminEmail = process.env.USER_NAME || '';
        const adminPassword = process.env.PASSWORD || '';
        await this.signIn(adminEmail, adminPassword);
    }


}