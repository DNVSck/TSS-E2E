import { Page, Locator, TestInfo } from '@playwright/test';
import { TFunction } from '../fixtures/locale-fixture';
import { PortalPage } from './portal-page';

export class BasePage {
    protected readonly commonContinueButton: Locator;
    protected readonly commonFinishButton: Locator;

    protected readonly t?: TFunction;

    constructor(protected readonly page: Page, t?: TFunction) {
        this.t = t;

        this.commonContinueButton = page.locator(
            "button.govuk-button[value='next']"
        );

        this.commonFinishButton = page.locator(
            "button.govuk-button[value='finish']"
        )
    }

    /**
     * Universal portal navigation with language switching.
     *
     * Browser storage is deliberately NOT cleared here: tests restore a
     * signed-in session via `storageState`, and `storageState` replays
     * localStorage as well as cookies. Clearing it would sign the test out.
     * Each test already starts from a fresh browser context anyway.
     */
    async navigateToPortal(url: string, testInfo: TestInfo): Promise<void> {
        await this.page.goto(url);
        await this.switchToWelshIfNeeded(testInfo);
    }

    /**
     * Switch to Welsh language if cy project
     */
    private async switchToWelshIfNeeded(testInfo: TestInfo): Promise<void> {
        const portalPage = new PortalPage(this.page);
        const isCyProject = testInfo.project.name.includes('cy');

        if (isCyProject) {
            await portalPage.switchLanguage('cy');
            await this.waitUntilLanguageSwitchSuccess('cy');
        } else {
            await this.waitUntilLanguageSwitchSuccess('en');
        }
    }

     // TO DO: Update this method after enabling the language switcher on the portal page. Currently, the language switcher is not available on the portal page, so this method is a placeholder for future implementation.
    private async waitUntilLanguageSwitchSuccess(
        lang: 'en' | 'cy'
    ): Promise<void> {
        const portalPage = new PortalPage(this.page);

        const expectedTitles = {
            en: 'Trader Support Service',
            cy: 'Gwasanaeth Cymorth Masnachwyr'
        };

    }

    async clickContinueButton(): Promise<void> {
        await this.commonContinueButton.click();
    }

    async clickFinishButton(): Promise<void> {
        await this.commonFinishButton.click();
    }

}
