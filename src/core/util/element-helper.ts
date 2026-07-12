import { expect, Locator, Page } from '@playwright/test';

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



