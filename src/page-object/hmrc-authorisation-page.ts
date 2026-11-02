import { Page, Locator } from '@playwright/test';
import { BasePage } from './base-page';
import { GOVUK } from './components/govuk-selectors';

export class HmrcAuthorisationPage extends BasePage {
    private readonly continueButton: Locator;
    private readonly signInLink: Locator;
    private readonly userIdInput: Locator;
    private readonly passwordInput: Locator;
    private readonly signInButton: Locator;
    private readonly givePermissionButton: Locator;

    constructor(page: Page) {
        super(page);
        this.continueButton = page.locator(`main a${GOVUK.BUTTON.ROOT}`);
        this.signInLink = page.locator('a#signIn');
        this.userIdInput = page.locator('input#userId');
        this.passwordInput = page.locator('input#password');
        this.signInButton = page.locator('button#submit');
        this.givePermissionButton = page.locator('button#givePermission');
    }

    async open(authorizeUrl: string): Promise<void> {
        await this.page.goto(authorizeUrl);
    }

    async signIn(userId: string, password: string): Promise<void> {
        await this.continueButton.click();
        await this.signInLink.click();
        await this.userIdInput.fill(userId);
        await this.passwordInput.fill(password);
        await this.signInButton.click();
    }

    async givePermission(redirectUri: string): Promise<URL> {
        const [redirect] = await Promise.all([
            this.page.waitForRequest(request => request.url().startsWith(redirectUri)),
            this.givePermissionButton.click(),
        ]);
        return new URL(redirect.url());
    }
}
