import { BasePage } from "./base-page";
import { Page, Locator } from '@playwright/test';
import { selectAutocompleteValue } from '../helper/element-helper';
import { AdditionalInformationData } from '../test-data/additional-information-data';

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

    /** "Provide a description for your additional information code". */
    async enterDescription(description: string): Promise<void> {
        await this.descriptionInput.fill(description);
        await this.clickContinueButton();
    }

    /** "Check your answers" — the "Complete and submit" button commits the record. */
    async confirmAndSubmit(): Promise<void> {
        await this.clickFinishButton();
    }

    /** The whole wizard for a single additional-information record. */
    async declareAdditionalInformation(input: AdditionalInformationData): Promise<void> {
        await this.selectAdditionalInformationCode(input.code);
        await this.enterDescription(input.description);
        await this.confirmAndSubmit();
    }
}
