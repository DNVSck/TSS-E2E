import { Page, Locator, expect } from '@playwright/test';
import { PortalPage } from './portal-page';

export class BasePage {
    readonly commonButton: Locator;
    readonly commonContinueButton: Locator;
    readonly commonFinishButton: Locator;

    constructor(protected readonly page: Page) {
        this.commonButton = page.locator(
            "//button[contains(@class, 'govuk-button')]"
        );

        this.commonContinueButton = page.locator(
            "//button[contains(@class, 'govuk-button') and @value='next']"
        );

        this.commonFinishButton = page.locator(
            "//button[contains(@class, 'govuk-button') and @value='finish']"
        );
    }

    /**
     * Universal portal navigation with language switching
     */
    async navigateToPortal(url: string, testInfo: any): Promise<void> {
        await this.page.goto(url);
        await this.clearBrowserStorage();
        await this.switchToWelshIfNeeded(testInfo);
    }

    /**
     * Clear browser storage safely
     */
    private async clearBrowserStorage(): Promise<void> {
        const url = this.page.url();
        if (!url || url === 'about:blank') return;

        await this.page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
        });
    }

    /**
     * Switch to Welsh language if cy project
     */
    private async switchToWelshIfNeeded(testInfo: any): Promise<void> {
        const portalPage = new PortalPage(this.page);
        const isCyProject = testInfo.project.name.includes('cy');

        if (isCyProject) {
            await portalPage.languageSwitcher.click();
            await this.waitUntilLanguageSwitchSuccess('cy');
        } else {
            await this.waitUntilLanguageSwitchSuccess('en');
        }
    }

    private async waitUntilLanguageSwitchSuccess(
        lang: 'en' | 'cy'
    ): Promise<void> {
        const portalPage = new PortalPage(this.page);

        const expectedTitles = {
            en: 'Trader Support Service',
            cy: 'Gwasanaeth Cymorth Masnachwyr'
        };

        await expect(portalPage.portalTitle).toHaveText(expectedTitles[lang]);
    }

    /**
     * Set viewport size
     */
    async setViewport(
        width: number = 1920,
        height: number = 1080
    ): Promise<void> {
        await this.page.setViewportSize({ width, height });
    }
}
