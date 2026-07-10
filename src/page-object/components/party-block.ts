import { BasePage } from '../base-page';
import { Page, Locator } from '@playwright/test';

/**
 * A trade party involved in a consignment. Consignment declaration repeats the
 * exact same "EORI + address" screens for each of these, so they share one
 * reusable component driven by the party name (which matches the field id prefix,
 * e.g. `consignor` -> `input#consignorEORI`, `input#consignorName`, ...).
 */
export type PartyType =
    | 'importer'
    | 'buyer'
    | 'consignor'
    | 'consignee'
    | 'exporter'
    | 'seller';

export interface PartyAddress {
    name: string;
    streetAndNumber: string;
    city: string;
    postCode: string;
    country: string;
}

export class PartyBlock extends BasePage {
    private readonly eoriInput: Locator;
    private readonly nameInput: Locator;
    private readonly streetAndNumberInput: Locator;
    private readonly cityInput: Locator;
    private readonly postCodeInput: Locator;
    private readonly countryDropdown: Locator;

    constructor(page: Page, party: PartyType) {
        super(page);
        this.eoriInput = page.locator(`input#${party}EORI`);
        this.nameInput = page.locator(`input#${party}Name`);
        this.streetAndNumberInput = page.locator(`input#${party}StreetAndNumber`);
        this.cityInput = page.locator(`input#${party}City`);
        this.postCodeInput = page.locator(`input#${party}Postcode`);
        this.countryDropdown = page.locator(`select#${party}Country`);
    }

    /** Fill the EORI field only (caller decides when to continue). */
    async fillEori(eori: string): Promise<void> {
        await this.eoriInput.fill(eori);
    }

    /** Fill the EORI field and continue to the next screen. */
    async enterEori(eori: string): Promise<void> {
        await this.fillEori(eori);
        await this.clickContinueButton();
    }

    /** Fill all address fields only (caller decides when to continue). */
    async fillAddress(address: PartyAddress): Promise<void> {
        await this.nameInput.fill(address.name);
        await this.streetAndNumberInput.fill(address.streetAndNumber);
        await this.cityInput.fill(address.city);
        await this.postCodeInput.fill(address.postCode);
        await this.countryDropdown.selectOption({ value: address.country });
    }

    /** Fill all address fields and continue to the next screen. */
    async enterAddress(address: PartyAddress): Promise<void> {
        await this.fillAddress(address);
        await this.clickContinueButton();
    }
}
