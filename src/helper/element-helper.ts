import { expect, Locator, Page } from '@playwright/test';
import { StringUtil } from '../core/util/string-util';
import { ReportLog } from '../core/report/report-log';

// This class provides utility functions for interacting with web elements in a consistent way across the test suite. 
// It can be imported and used in any page object or test file to perform common actions on web elements, such as clicking, filling forms, 
// or selecting dropdown values. By centralizing these interactions, we can ensure that all tests follow the same patterns and reduce code duplication.

// Utility function to select a value from a dropdown
export async function selectDropdownValue(
    dropdown: Locator,
    value: string
): Promise<void> {
    await dropdown.selectOption({ value });
    await expect(dropdown).toHaveValue(value);
}

// Locate a GOV.UK summary-list row's value by its label. The label is exact-matched
// (:text-is) so e.g. "Status" is not also satisfied by a "Goods domestic status" row
// on the same list. Callers pass the label already resolved through t(), keeping the
// lookup locale-safe. Centralises the govuk-summary-list DOM shape that the movement-,
// consignment- and goods-overview/detail pages would otherwise each hand-build.
export function summaryListValue(page: Page, label: string): Locator {
    return page.locator(
        `.govuk-summary-list__row:has(dt:text-is("${label}")) .govuk-summary-list__value`
    );
}

// Read a summary-list field's text once it has painted. The overview and detail
// pages are heavy and paint their summary list a beat after load, so a bare
// innerText() races that paint and fails at the default action timeout - hence the
// visibility wait. .first() keeps a label rendered more than once (the same row
// repeated across tab panels) from tripping strict mode, and the value is trimmed
// because the GOV.UK markup pads it with the row's own whitespace. The timeout is
// the caller's because how slow a page paints is a fact about that page.
export async function readFieldWhenVisible(field: Locator, timeout: number): Promise<string> {
    await field.first().waitFor({ state: 'visible', timeout });
    return (await field.first().innerText()).trim();
}

// Read a field that may not have rendered yet as '' instead of throwing - the
// counterpart to readFieldWhenVisible for values the backend populates
// asynchronously (MRN, GMR ID, the post-submit status). Callers poll on this and
// decide themselves when to give up, so it must never wait and never throw.
export async function readFieldIfPresent(field: Locator): Promise<string> {
    if (await field.count() === 0) {
        return '';
    }
    return (await field.first().innerText()).trim();
}


// Commit a value on a GOV.UK accessible-autocomplete (commodity code, TGP number,
// additional-information code, ...). A plain fill() leaves the component's value
// empty - the typed text is only a query until a suggestion is picked.
//
// The suggestion is committed by CLICKING it. Do not "simplify" this back to the
// keyboard: locator.press() focuses its element first, so input.press('ArrowDown')
// moves focus onto the option and a following input.press('Enter') pulls focus back
// to the input - the highlight is lost and nothing is selected. That was the original
// implementation and it went unnoticed for a long time, because the commodity screen
// types a value the service also accepts as a bare query; the TGP screen, which needs
// a real record, rejected it outright.

const AUTOCOMPLETE_ENHANCED_TIMEOUT = 25_000;
const AUTOCOMPLETE_SUGGESTIONS_TIMEOUT = 8_000;

export async function selectAutocompleteValue(
    input: Locator,
    firstOption: Locator,
    value: string
): Promise<void> {
    await expect(input).toHaveAttribute('role', 'combobox', { timeout: AUTOCOMPLETE_ENHANCED_TIMEOUT });

    for (let attempt = 1; attempt <= 3; attempt++) {
        await input.click();
        await input.fill('');
        await input.pressSequentially(value, { delay: 120 });

        try {
            await firstOption.waitFor({ state: 'visible', timeout: AUTOCOMPLETE_SUGGESTIONS_TIMEOUT });
            await firstOption.click();
            // The open list overlays whatever sits below it — the Continue button,
            // typically — and swallows the next click, so see it close before moving on.
            await firstOption.waitFor({ state: 'hidden' });
            return;
        } catch {
            if (attempt === 3) {
                throw new Error(`Autocomplete suggestions never loaded for "${value}" after 3 attempts.`);
            }
        }
    }
}


/** How long the link itself gets to render, and to be actionable once it has. */
const LINK_VISIBLE_TIMEOUT = 15_000;
/**
 * How long ONE click gets to land on the target route. Deliberately short: a
 * navigation that is going to happen commits well inside this, so a longer wait only
 * buys time for the failure this retries — a click the app swallowed, which no amount
 * of waiting will fix. Short budget x several clicks beats one long wait x one click.
 */
const ROUTE_LANDING_TIMEOUT = 8_000;
const ROUTE_CLICK_ATTEMPTS = 3;

// Click a GOV.UK link that navigates to another server route (an overview tab, a
// breadcrumb, ...) and wait until the page has actually landed on that route. These
// routes are server sub-routes, so the active page is reflected in the URL — a more
// reliable signal than waiting on the panel to paint (a bare click-then-interact
// races that paint and flakes). The expected route is read from the link's own href,
// so callers do not repeat it. Named generically because it drives both the overview
// tabs and the "DEC…" consignment breadcrumb.
//
// STRICTLY for links that only navigate: the click is retried, so a link that also
// changes state (deletes a record, submits a form) does not belong here.
export async function clickLinkAndWaitForRoute(page: Page, link: Locator): Promise<void> {
    // Wait for the link to render first: it arrives with the overview after the
    // previous step's navigation, which under load can take longer than the default
    // action timeout — so reading/clicking it straight away can race that.
    await link.waitFor({ state: 'visible', timeout: LINK_VISIBLE_TIMEOUT });

    const href = await link.getAttribute('href');
    if (!href) {
        await link.click({ timeout: LINK_VISIBLE_TIMEOUT });
        return;
    }
    // Resolve against the current URL, which drops the "#overview-tab" anchor and any
    // query, and copes with an absolute href as readily as a relative one. Trailing
    // slashes go too, then the path is matched exactly (so the root tab's "/overview"
    // is not satisfied by a sub-route).
    const route = StringUtil.stripTrailingSlashes(new URL(href, page.url()).pathname);

    for (let attempt = 1; attempt <= ROUTE_CLICK_ATTEMPTS; attempt++) {
        try {
            await link.click({ timeout: LINK_VISIBLE_TIMEOUT });
            // Wait only for the route to be committed and parsed, NOT for the page to
            // finish loading. waitForURL defaults to "load", and these overview pages
            // keep requests in flight well after the panel is usable — so a page that
            // did arrive still burns the full navigation timeout. What comes next is
            // gated on a real element anyway.
            await page.waitForURL(
                url => StringUtil.stripTrailingSlashes(url.pathname) === route,
                { waitUntil: 'domcontentloaded', timeout: ROUTE_LANDING_TIMEOUT }
            );
            return;
        } catch (error) {
            // Report where the page actually is. "Timeout exceeded" alone cannot tell
            // a swallowed click (still on the old route) from a link that led somewhere
            // unexpected, and those want opposite fixes.
            if (attempt === ROUTE_CLICK_ATTEMPTS) {
                throw new Error(
                    `Link did not reach "${route}" after ${ROUTE_CLICK_ATTEMPTS} clicks; ` +
                    `the page is on "${new URL(page.url()).pathname}". ` +
                    `Last failure: ${(error as Error).message}`
                );
            }
            await ReportLog.info(
                `Link did not navigate on attempt ${attempt}; clicking it again and retrying.`
            );
        }
    }
}

// Click a link whose destination is NOT its href, and wait until the page has moved.
//
// The sibling of clickLinkAndWaitForRoute, for links the server resolves rather than
// serves: a summary list's "Change" action points at ".../edit/_edit_?field=x", and
// the app answers by redirecting to whichever wizard screen that field lives on. The
// href therefore cannot say where the click lands, so the only honest expectation is
// that we are no longer where we started.
//
// Weaker than matching a route, deliberately. Use it only where the destination is
// genuinely unknowable in advance; anywhere else, assert the route.
export async function clickLinkAndWaitForNavigation(page: Page, link: Locator): Promise<void> {
    await link.waitFor({ state: 'visible', timeout: LINK_VISIBLE_TIMEOUT });
    const from = StringUtil.stripTrailingSlashes(new URL(page.url()).pathname);

    for (let attempt = 1; attempt <= ROUTE_CLICK_ATTEMPTS; attempt++) {
        try {
            await link.click({ timeout: LINK_VISIBLE_TIMEOUT });
            await page.waitForURL(
                url => StringUtil.stripTrailingSlashes(url.pathname) !== from,
                { waitUntil: 'domcontentloaded', timeout: ROUTE_LANDING_TIMEOUT }
            );
            return;
        } catch (error) {
            if (attempt === ROUTE_CLICK_ATTEMPTS) {
                throw new Error(
                    `Link did not navigate away from "${from}" after ${ROUTE_CLICK_ATTEMPTS} clicks. ` +
                    `Last failure: ${(error as Error).message}`
                );
            }
            await ReportLog.info(
                `Link did not navigate on attempt ${attempt}; clicking it again and retrying.`
            );
        }
    }
}

// How long to wait for a tab's "add new record" button after the tab has become
// active — the panel paints a beat after the tab's route settles. Also bounds the
// click, so an unactionable button fails on this budget rather than the ambient
// action timeout, and the retries below stay well inside the test timeout.
const NEW_RECORD_BUTTON_TIMEOUT = 15_000;
/** How long the record wizard gets to open once its button has been clicked. */
const WIZARD_OPEN_TIMEOUT = 10_000;
const TAB_SWITCH_ATTEMPTS = 3;

// Utility function to switch to a GOV.UK overview tab and click its "add new record"
// button. Composes clickLinkAndWaitForRoute (which waits for the tab's route to become
// active) with a visibility wait on the button, so the click never races the panel
// paint. Shared by the consignment- and goods-overview pages, which drive the identical
// tab -> add-new flow across their several record tabs.
export async function switchToTabAndClickNew(
    page: Page,
    tab: Locator,
    newButton: Locator
): Promise<void> {
    for (let attempt = 1; attempt <= TAB_SWITCH_ATTEMPTS; attempt++) {
        try {
            await clickLinkAndWaitForRoute(page, tab);
            await newButton.waitFor({ state: 'visible', timeout: NEW_RECORD_BUTTON_TIMEOUT });

            const tabRoute = StringUtil.stripTrailingSlashes(new URL(page.url()).pathname);
            await newButton.click({ timeout: NEW_RECORD_BUTTON_TIMEOUT });

            // The wizard lives on its own route, so still being on the tab means the
            // click was SWALLOWED - dispatched, accepted by Playwright, ignored by the
            // app. Without this the run carries on and dies a screen later, hunting for
            // a field of a wizard that never opened.
            //
            // Retrying is safe precisely because nothing happened: a click that did not
            // navigate created no record, so clicking again cannot duplicate one.
            await page.waitForURL(
                url => StringUtil.stripTrailingSlashes(url.pathname) !== tabRoute,
                { waitUntil: 'domcontentloaded', timeout: WIZARD_OPEN_TIMEOUT }
            );
            return;
        } catch (error) {
            // Carry the last underlying failure. A tab that never opened, a panel that
            // never painted, a button that is genuinely absent and a click the app
            // ignored all end up here, and only the original message tells the reader
            // which one it was.
            if (attempt === TAB_SWITCH_ATTEMPTS) {
                throw new Error(
                    `Could not open a new record from this tab after ${TAB_SWITCH_ATTEMPTS} attempts; ` +
                    `the page is on "${new URL(page.url()).pathname}". Last failure: ${(error as Error).message}`
                );
            }
            // Say so in the report. A retry that passes silently reads as a clean run,
            // and the app needing a second tab click is worth someone knowing about.
            await ReportLog.info(
                `Tab did not open on attempt ${attempt}; clicking it again and retrying.`
            );
        }
    }
}

// Utility function to tick a radio button identified by its `name` and `value`.
// Centralizes the `input[name="…"][value="…"]` selector that would otherwise be
// hand-built at each call site, and asserts the option ends up checked.
export async function checkRadioByValue(
    page: Page,
    name: string,
    value: string
): Promise<void> {
    const radio = page.locator(`input[name="${name}"][value="${value}"]`);
    await radio.check();
}





/**
 * The "add a new record" button of an overview tab, found by its form's action.
 *
 * The button's `value` is being renamed per record type ("new-record" ->
 * "new-document-reference", ...) and deploys are mid-flight, so it is matched on the
 * "new-" prefix and works either way. Each form has one such button, which is what
 * keeps the prefix unambiguous.
 */
export function newRecordButton(page: Page, formAction: string): Locator {
    return page.locator(`form[action*="${formAction}"] button[value^="new-"]`);
}
