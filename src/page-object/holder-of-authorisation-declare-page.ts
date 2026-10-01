import { BasePage, WizardStep } from "./base-page";
import { Page, Locator } from '@playwright/test';
import { selectDropdownValue } from '../helper/element-helper';
import { HolderOfAuthorisationData } from '../test-data/holder-of-authorisation-data';

/**
 * The "New holder of authorisation" wizard, reached from the consignment's
 * "Holder of authorisation" tab:
 *
 *   1. "Type code" — the authorisation type select.
 *   2. "Role ID" — the GB or XI EORI of the authorised party.
 *   3. "Check your answers" — commits the record with "Complete and submit".
 */
export class HolderOfAuthorisationDeclarePage extends BasePage {

    private readonly typeCodeDropdown: Locator;
    private readonly roleIdInput: Locator;

    constructor(page: Page) {
        super(page);

        // "Type code"
        this.typeCodeDropdown = page.locator("select#typeCode");
        // "Role ID"
        this.roleIdInput = page.locator("input#roleId");
    }

    /** "Type code" — select the authorisation type. */
    async selectTypeCode(typeCode: string): Promise<void> {
        await selectDropdownValue(this.typeCodeDropdown, typeCode);
        await this.clickContinueButton();
    }

    /** "Role ID" — the authorised party's EORI. */
    async enterRoleId(roleId: string): Promise<void> {
        await this.roleIdInput.fill(roleId);
        await this.clickContinueButton();
    }

    /** "Check your answers" — the "Complete and submit" button commits the record. */
    async confirmAndSubmit(): Promise<string[]> {
        return this.finishAndReadErrors();
    }

    /** The whole wizard for a single holder-of-authorisation record. */
    steps(input: HolderOfAuthorisationData): WizardStep[] {
        return [
            { screen: 'type code', answer: () => this.selectTypeCode(input.typeCode) },
            { screen: 'role ID', answer: () => this.enterRoleId(input.roleId) },
        ];
    }

    async declareHolderOfAuthorisation(input: HolderOfAuthorisationData): Promise<string[]> {
        for (const step of this.steps(input)) {
            await step.answer();
        }
        return this.confirmAndSubmit();
    }
}
