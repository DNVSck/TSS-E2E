import { BasePage, WizardStep } from "./base-page";
import { Page, Locator } from '@playwright/test';

/**
 * The "New taric additional code" wizard, reached from the goods item's
 * "Taric additional codes" tab:
 *
 *   1. "Taric additional code" — a free-text input (the same field id as the
 *      goods-declaration additional-commodity-codes screen).
 *   2. "Check your answers" — commits the record with "Complete and submit".
 */
export class TaricAdditionalCodeDeclarePage extends BasePage {

    private readonly taricAdditionalCodeInput: Locator;

    constructor(page: Page) {
        super(page);
        this.taricAdditionalCodeInput = page.locator("input#taricAdditionalCode");
    }

    /** "Enter a taric additional code". */
    async enterTaricAdditionalCode(code: string): Promise<void> {
        await this.taricAdditionalCodeInput.fill(code);
        await this.clickContinueButton();
    }

    /** "Check your answers" — the "Complete and submit" button commits the record. */
    async confirmAndSubmit(): Promise<string[]> {
        return this.finishAndReadErrors();
    }

    /** The whole wizard for a single taric-additional-code record. */
    steps(code: string): WizardStep[] {
        return [{ screen: 'code', answer: () => this.enterTaricAdditionalCode(code) }];
    }

    async declareTaricAdditionalCode(code: string): Promise<string[]> {
        for (const step of this.steps(code)) {
            await step.answer();
        }
        return this.confirmAndSubmit();
    }
}
