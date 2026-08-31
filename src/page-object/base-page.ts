import { Page, Locator, TestInfo } from '@playwright/test';
import { readFieldIfPresent } from '../helper/element-helper';
import { TFunction } from '../fixtures/locale-fixture';
import { PortalPage } from './portal-page';

/** Overview screens paint their list a beat after the route settles. */
const CONTENT_TIMEOUT = 20_000;

/** One action button, and whether the screen will actually let it be used. */
export interface ActionButton {
    /** The posted value that names the action, e.g. "submit-consignment". */
    value: string;
    enabled: boolean;
}
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
     *
     * `domcontentloaded`, not Playwright's default `load` - the convention every
     * navigation in this suite now follows.
     *
     * `load` waits for every subresource: images, fonts, third-party scripts. One of
     * those never completing is enough to hold the navigation open even though the
     * page is fully usable, which is exactly how it fails on CI - egress there is not
     * the same as a developer's machine, so a blocked font or analytics host hangs
     * until the navigation budget runs out. Seen on sit 2026-08-31, a 30-second
     * timeout on the portal home that loads instantly by hand.
     *
     * Nothing is lost by not waiting: whatever runs next waits for the element it
     * actually needs, so waiting for the last image only adds someone else's latency
     * to every test.
     */
    async navigateToPortal(url: string, testInfo: TestInfo): Promise<void> {
        await this.page.goto(url, { waitUntil: 'domcontentloaded' });
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

    /**
     * Click the browser back button and wait for navigation to complete.
     * Returns the URL after the back navigation.
     */
    async clickBrowserBackButton(): Promise<string> {
        await this.page.goBack();
        await this.page.waitForLoadState('domcontentloaded');
        return this.page.url();
    }

    /**
     * Get the current page URL.
     *
     * Synchronous, like the Playwright API it wraps - page.url() reads a value
     * already held by the page, it doesn't round-trip anywhere. Existing callers
     * that `await` this keep working unchanged: awaiting a non-promise value is
     * legal and resolves immediately.
     */
    getCurrentUrl(): string {
        return this.page.url();
    }

    /**
     * Navigate directly to a specific URL.
     * Handles potential redirects or auth failures gracefully.
     */
    async navigateToUrlDirect(url: string): Promise<void> {
        await this.page.goto(url, { waitUntil: 'domcontentloaded' });
    }

    /**
     * The buttons that DO something to the record - submit, cancel, delete, add.
     *
     * Every one of them posts `name="action"`, which is what separates them from the
     * page furniture (cookie banner, chat widget) that carries no name at all.
     */
    protected get actionButtons(): Locator {
        return this.page.locator('button[name="action"]');
    }

    /**
     * The screen's own heading. Located structurally, never by its words - a caller
     * that cares which screen this is compares the TEXT against t(), so the check
     * stays honest in Welsh while the selector stays free of copy.
     */
    protected get pageHeading(): Locator {
        return this.page.locator('h1');
    }

    /**
     * Wait until the screen has listed something. Throws if it never does, which is
     * what lets a caller tell "the record rendered and offers nothing" from "no
     * record rendered" - two results that look identical to any absence check.
     */
    async waitForContent(timeout = CONTENT_TIMEOUT): Promise<void> {
        await this.contentRows.first().waitFor({ state: 'visible', timeout });
    }

    /**
     * Wait for whichever the service answers with: the record, or a heading instead
     * of one.
     *
     * Both outcomes are expected when a permission test opens a record, so waiting
     * for only the record would spend the full timeout every time the answer is a
     * refusal - and waiting for only a heading would miss the record. Racing them
     * settles as soon as either arrives.
     */
    async waitForContentOrHeading(timeout = CONTENT_TIMEOUT): Promise<void> {
        await this.contentRows.first().or(this.pageHeading.first())
            .waitFor({ state: 'visible', timeout });
    }

    /** How many rows are rendered right now. Does not wait - see waitForContent. */
    async renderedRowCount(): Promise<number> {
        return this.contentRows.count();
    }

    /** The screen's heading as shown, or '' when it has none. */
    async readPageHeading(): Promise<string> {
        return readFieldIfPresent(this.pageHeading);
    }

    /**
     * Every action button the screen renders, WITH its enabled state.
     *
     * Both halves are needed because the service withholds an action in two different
     * ways, and a check that knew only one would miss the other: a company with no
     * rights over a record is simply not shown "Confirm and submit" or "Cancel" at
     * all, while "Delete" IS rendered and merely disabled (measured 2026-08-13).
     *
     * So callers should ask what is ENABLED rather than what is present - see
     * enabledActions - which is the one question both mechanisms answer the same way.
     */
    async listActionButtons(): Promise<ActionButton[]> {
        return this.actionButtons.evaluateAll(buttons =>
            buttons.map(button => ({
                value: button.getAttribute('value') ?? '',
                enabled: !(button as HTMLButtonElement).disabled,
            }))
        );
    }

}
