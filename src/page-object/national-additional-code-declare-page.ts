import { BasePage } from "./base-page";
import { Page, Locator } from '@playwright/test';
import { selectDropdownValue } from '../helper/element-helper';

/**
 * The "New national additional code" wizard, reached from the goods item's
 * "National additional codes" tab:
 *
 *   1. "Select a national additional code" — the nationalAdditionalCode select
 *      (the same field id and code list as the goods-declaration screen).
 *   2. "Check your answers" — commits the record with "Complete and submit".
 */
export class NationalAdditionalCodeDeclarePage extends BasePage {

    private readonly nationalAdditionalCodeDropdown: Locator;

    constructor(page: Page) {
        super(page);
        this.nationalAdditionalCodeDropdown = page.locator("select#nationalAdditionalCode");
    }

    /** "Select a national additional code". */
    async selectNationalAdditionalCode(code: string): Promise<void> {
        await selectDropdownValue(this.nationalAdditionalCodeDropdown, code);
        await this.clickContinueButton();
    }

    /** "Check your answers" — the "Complete and submit" button commits the record. */
    async confirmAndSubmit(): Promise<string[]> {
        return this.finishAndReadErrors();
    }

    /** The whole wizard for a single national-additional-code record. */
    async declareNationalAdditionalCode(code: string): Promise<string[]> {
        await this.selectNationalAdditionalCode(code);
        return this.confirmAndSubmit();
    }
}
