import { expect, Locator, Page } from '@playwright/test';
import { StringUtil } from '../core/util/string-util';

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

// Utility function to commit a value on a GOV.UK accessible-autocomplete (the
// combobox used by commodity code, additional-information code, ...). A plain fill()
// leaves the hidden value empty — the typed text is only a "query" that the component
// discards on blur unless a suggestion is picked. So type the value to fire the
// lookup, wait for the first suggestion, then commit it by keyboard (ArrowDown
// highlights it, Enter selects — a click races the re-render). Suggestions can be
// fetched live (e.g. the NI tariff) and the request is occasionally slow or dropped,
// so re-type and retry a few times before giving up.
export async function selectAutocompleteValue(
    input: Locator,
    firstOption: Locator,
    value: string
): Promise<void> {
    for (let attempt = 1; attempt <= 3; attempt++) {
        await input.click();
        await input.fill('');
        await input.pressSequentially(value, { delay: 120 });
        try {
            await firstOption.waitFor({ state: 'attached', timeout: 8000 });
            await input.press('ArrowDown');
            await input.press('Enter');
            return;
        } catch {
            if (attempt === 3) {
                throw new Error(`Autocomplete suggestions never loaded for "${value}" after 3 attempts.`);
            }
        }
    }
}

// Click a GOV.UK link that navigates to another server route (an overview tab, a
// breadcrumb, ...) and wait until the page has actually landed on that route. These
// routes are server sub-routes, so the active page is reflected in the URL — a more
// reliable signal than waiting on the panel to paint (a bare click-then-interact
// races that paint and flakes). The expected route is read from the link's own href,
// so callers do not repeat it. Named generically because it drives both the overview
// tabs and the "DEC…" consignment breadcrumb.
export async function clickLinkAndWaitForRoute(page: Page, link: Locator): Promise<void> {
    // Wait for the link to render first: it arrives with the overview after the
    // previous step's navigation, which under load can take longer than the default
    // action timeout — so reading/clicking it straight away can race that.
    await link.waitFor({ state: 'visible', timeout: 15_000 });

    const href = await link.getAttribute('href');
    await link.click();
    if (!href) {
        return;
    }
    // Strip the "#overview-tab" anchor and any trailing slash, then match the URL
    // path exactly (so the root tab's "/overview" is not satisfied by a sub-route).
    const route = StringUtil.stripTrailingSlashes(href.split('#')[0]);
    await page.waitForURL(url => StringUtil.stripTrailingSlashes(url.pathname) === route);
}

// How long to wait for a tab's "add new record" button after the tab has become
// active — the panel paints a beat after the tab's route settles.
const NEW_RECORD_BUTTON_TIMEOUT = 15_000;

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
    await clickLinkAndWaitForRoute(page, tab);
    await newButton.waitFor({ state: 'visible', timeout: NEW_RECORD_BUTTON_TIMEOUT });
    await newButton.click();
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




