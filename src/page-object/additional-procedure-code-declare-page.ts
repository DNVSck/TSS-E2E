import { BasePage, WizardStep } from "./base-page";
import { Page, Locator } from '@playwright/test';
import { selectDropdownValue } from '../helper/element-helper';

/**
 * The "New additional procedure code" wizard, reached from the goods item's
 * "Additional procedure codes" tab:
 *
 *   1. "Select an additional procedure code" — the additionalProcedureCode select
 *      (the same field id and code list as the goods-declaration procedure screen).
 *   2. "Check your answers" — commits the record with "Complete and submit".
 */
export class AdditionalProcedureCodeDeclarePage extends BasePage {

    private readonly additionalProcedureCodeDropdown: Locator;

    constructor(page: Page) {
        super(page);
        this.additionalProcedureCodeDropdown = page.locator("select#additionalProcedureCode");
    }

    /** "Select an additional procedure code". */
    async selectAdditionalProcedureCode(code: string): Promise<void> {
        await selectDropdownValue(this.additionalProcedureCodeDropdown, code);
        await this.clickContinueButton();
    }

    /** "Check your answers" — the "Complete and submit" button commits the record. */
    async confirmAndSubmit(): Promise<string[]> {
        return this.finishAndReadErrors();
    }

    /** The whole wizard for a single additional-procedure-code record. */
    steps(code: string): WizardStep[] {
        return [{ screen: 'code', answer: () => this.selectAdditionalProcedureCode(code) }];
    }

    async declareAdditionalProcedureCode(code: string): Promise<string[]> {
        for (const step of this.steps(code)) {
            await step.answer();
        }
        return this.confirmAndSubmit();
    }
}
