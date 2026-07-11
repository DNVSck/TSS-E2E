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



