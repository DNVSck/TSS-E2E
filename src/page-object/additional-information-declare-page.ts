import { BasePage } from "./base-page";
import { Page, Locator, expect } from '@playwright/test';
import {
    fillInputValue, selectAutocompleteValue, clickToLeaveScreen,
} from '../helper/element-helper';

/**
 * The "New additional information" wizard, reached from the goods item's
 * "Additional information" tab:
 *
 *   1. "Select an additional information code" — the code accessible-autocomplete.
 *   2. "Provide a description for your additional information code" — a free-text input.
 *   3. "Check your answers" — commits the record with "Complete and submit".
 */
export class AdditionalInformationDeclarePage extends BasePage {

    private readonly codeInput: Locator;
    private readonly codeFirstOption: Locator;
    private readonly descriptionInput: Locator;

    constructor(page: Page) {
        super(page);
        this.codeInput = page.locator("input#code");
        this.codeFirstOption = page.locator("#code__option--0");
        this.descriptionInput = page.locator("input#description");
    }

    /** "Select an additional information code" — commit the autocomplete value. */
    async selectAdditionalInformationCode(code: string): Promise<void> {
        await selectAutocompleteValue(this.codeInput, this.codeFirstOption, code);
        await this.clickContinueButton();
    }

    async enterDescription(description: string): Promise<void> {
        await fillInputValue(this.descriptionInput, description);
        await expect(this.descriptionInput).toHaveValue(description);
        await this.clickContinueButton();
    }

    async listSummaryValues(): Promise<string[]> {
        await this.commonSummaryValues.first().waitFor({ state: 'visible' });
        return (await this.commonSummaryValues.allInnerTexts()).map(value => value.trim());
    }

    /** "Check your answers" — the "Complete and submit" button commits the record. */
    async confirmAndSubmit(): Promise<void> {
        await clickToLeaveScreen(this.page, this.commonFinishButton);
    }
}
