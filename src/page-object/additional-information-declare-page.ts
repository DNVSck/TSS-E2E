import { BasePage, WizardStep } from "./base-page";
import { Page, Locator, expect } from '@playwright/test';
import {
    fillInputValue, selectDropdownValue, clickToLeaveScreen, readErrorSummary,
} from '../helper/element-helper';

const DESCRIPTION_TIMEOUT = 150_000;

/**
 * The "New additional information" wizard, reached from the goods item's
 * "Additional information" tab:
 *
 *   1. "Select an additional information code" — a native select.
 *   2. "Provide a description for your additional information code" — a free-text input.
 *   3. "Check your answers" — commits the record with "Complete and submit".
 */
export class AdditionalInformationDeclarePage extends BasePage {

    private readonly codeDropdown: Locator;
    private readonly descriptionInput: Locator;

    constructor(page: Page) {
        super(page);
        this.codeDropdown = page.locator("select#code");
        this.descriptionInput = page.locator("input#description");
    }

    async selectAdditionalInformationCode(code: string): Promise<void> {
        await selectDropdownValue(this.codeDropdown, code);
        await this.clickContinueButton();
    }

    async enterDescription(description: string): Promise<void> {
        await expect(async () => {
            await fillInputValue(this.descriptionInput, description);
            await clickToLeaveScreen(this.page, this.commonContinueButton);
        }).toPass({ timeout: DESCRIPTION_TIMEOUT });
    }

    async listSummaryValues(): Promise<string[]> {
        await this.commonSummaryValues.first().waitFor({ state: 'visible' });
        return (await this.commonSummaryValues.allInnerTexts()).map(value => value.trim());
    }

    /** "Check your answers" — the "Complete and submit" button commits the record. */
    steps(input: { code: string; description: string }): WizardStep[] {
        return [
            { screen: 'code', answer: () => this.selectAdditionalInformationCode(input.code) },
            { screen: 'description', answer: () => this.enterDescription(input.description) },
        ];
    }

    async confirmAndSubmit(): Promise<string[]> {
        try {
            await clickToLeaveScreen(this.page, this.commonFinishButton);
            return [];
        } catch (error) {
            const errors = await readErrorSummary(this.page);
            if (errors.length > 0) {
                return errors;
            }
            throw error;
        }
    }
}
