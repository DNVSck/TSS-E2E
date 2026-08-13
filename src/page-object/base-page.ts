import { Page, Locator, TestInfo } from '@playwright/test';
import { TFunction } from '../fixtures/locale-fixture';
import { PortalPage } from './portal-page';

/** Overview screens paint their list a beat after the route settles. */
const CONTENT_TIMEOUT = 20_000;

export class BasePage {
    protected readonly commonContinueButton: Locator;
    protected readonly commonFinishButton: Locator;
    protected readonly t?: TFunction;

    /**
     * The rows of whatever the screen lists, and the actions it offers on them.
     *
     * Getters, not fields, so a screen built differently can override them - which is
     * the whole point. Most overviews are a GOV.UK summary list, so that is the
     * default; the company profile's users screen is a table, and overriding these two
     * is all it takes for every permission check below to work there unchanged.
     *
     * The actions are matched structurally, never on the word "Change": that text is
     * translated, and the links carry a visually-hidden field name after it.
     */
    protected get contentRows(): Locator {
        return this.page.locator('.govuk-summary-list__row');
    }

    protected get actionLinks(): Locator {
        return this.page.locator('.govuk-summary-list__actions a');
    }

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
     * How many rows the screen lists.
     *
     * Its job is to tell a rendered screen from a blank one. Any check that something
     * is ABSENT - no actions offered, say - passes just as happily on a page that
     * failed to load, so a caller has to establish the screen is there first.
     */
    async countContentRows(): Promise<number> {
        await this.contentRows.first().waitFor({ state: 'visible', timeout: CONTENT_TIMEOUT });
        return this.contentRows.count();
    }

    /**
     * Where every action this screen offers would take you.
     *
     * The reusable half of a permission check, and the reason it returns hrefs rather
     * than a count: a count cannot fail usefully - strip twenty of twenty-three
     * actions and "more than zero" still passes - and it cannot say WHICH action
     * leaked when a user who should have none has one.
     *
     * Hrefs, not names, because only the screen itself knows how to name them: the
     * company profile puts the field in a query parameter, the users screen keys its
     * links on a user id. A subclass with such a convention turns these into names
     * (see CompanyProfilePage.listEditableFields); one without can assert on the
     * hrefs. The check that matters most needs neither - "a non-holder is offered
     * nothing" is just this list being empty.
     */
    async listActionHrefs(): Promise<string[]> {
        const hrefs = await this.actionLinks.evaluateAll(links =>
            links.map(link => link.getAttribute('href') ?? '')
        );
        return hrefs.filter(href => href !== '');
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

    async clickContinueButton(timeout?: number): Promise<void> {
        await this.commonContinueButton.click({ timeout });
    }

    async clickFinishButton(): Promise<void> {
        await this.commonFinishButton.click();
    }

}
