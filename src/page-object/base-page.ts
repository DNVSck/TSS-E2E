import { Page, Locator, TestInfo } from '@playwright/test';
import {
    readFieldIfPresent, hrefsOf, clickLinkAndWaitForRoute,
} from '../helper/element-helper';
import { TFunction, localeForProject } from '../fixtures/locale-fixture';
import { LOCALES_CONSTANT } from '../constant/locales-constant';
import { NavigationBanner } from './components/navigation-banner';

/** Overview screens paint their list a beat after the route settles. */
const CONTENT_TIMEOUT = 20_000;

const WRONG_SCREEN_GRACE = 5_000;

/** One action button, and whether the screen will actually let it be used. */
export interface ActionButton {
    /** The posted value that names the action, e.g. "submit-consignment". */
    value: string;
    enabled: boolean;
}
export class BasePage {
    protected readonly commonContinueButton: Locator;
    protected readonly commonFinishButton: Locator;
    protected readonly commonBackLink: Locator;
    protected readonly commonSummaryValues: Locator;
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

    private readonly navigationBanner: NavigationBanner;

    protected get actionLinks(): Locator {
        return this.page.locator('.govuk-summary-list__actions a');
    }

    constructor(protected readonly page: Page, t?: TFunction) {
        this.t = t;

        // The header is on every signed-in screen, so the base holds it rather than each
        // page re-declaring it. Only the language switch is driven from here.
        this.navigationBanner = new NavigationBanner(page);

        this.commonContinueButton = page.locator(
            "button.govuk-button[value='next']"
        );

        this.commonFinishButton = page.locator(
            "button.govuk-button[value='finish']"
        )

        this.commonBackLink = page.locator("a[data-module='govuk-back-link']");

        this.commonSummaryValues = page.locator('.govuk-summary-list__value');
    }

    /** The pixels, not the Page - so a caller can name its own screenshot and no more. */
    async screenshotPng(): Promise<Buffer> {
        return this.page.screenshot();
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
        return hrefsOf(this.actionLinks);
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
 * Switch to Welsh on a cy project - or rather, where that switch used to happen.
     */
    private async switchToWelshIfNeeded(testInfo: TestInfo): Promise<void> {
        const locale = localeForProject(testInfo.project);

        if (locale === LOCALES_CONSTANT.EN_GB) {
            return;
        }

        await this.navigationBanner.switchLanguageTo(locale);
    }

    async clickContinueButton(timeout?: number): Promise<void> {
        await this.commonContinueButton.click({ timeout });
    }

    /**
     * "Complete and submit" - the button that ends a wizard.
     *
     * Through clickToLeaveScreen because these screens swallow the first click while
     * they hydrate, and a swallowed submit is not visible here: the next step goes
     * looking for a screen that never opened and blames its own locator.
     */
    async clickFinishButton(): Promise<void> {
        await this.commonFinishButton.click();
    }

    async clickBackLink(): Promise<void> {
        await clickLinkAndWaitForRoute(this.page, this.commonBackLink);
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


    protected async waitForScreenField(field: Locator, screen: string, timeout: number): Promise<void> {
        await field.or(this.pageHeading.first()).first().waitFor({ state: 'visible', timeout });

        if (await field.isVisible()) {
            return;
        }

        await field.waitFor({ state: 'visible', timeout: WRONG_SCREEN_GRACE })
            .catch(() => { /* reported below, with the page that did arrive */ });

        if (await field.isVisible()) {
            return;
        }

        throw new Error(
            `The ${screen} screen never arrived. The page showing instead is headed `
            + `"${await this.readPageHeading()}".`
        );
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
