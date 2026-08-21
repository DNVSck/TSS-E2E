import { BasePage } from '../base-page';
import { Page, Locator } from '@playwright/test';
import { selectDropdownValue, currentWizardStep, waitForWizardStepToChange } from '../../helper/element-helper';

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
    /** The app asks for the street and the number in two separate fields. */
    streetName: string;
    streetNumber: string;
    city: string;
    postCode: string;
    country: string;
}

/**
 * Any test-data object carrying one party's six address fields under a given prefix -
 * `consignorName`, `consignorStreetName`, and so on.
 *
 * Described as a shape rather than an interface the data classes implement, so
 * toPartyAddress can be called against the real (much larger) *Data classes without
 * any of them declaring anything: they already have the fields.
 */
export type PartyFields<Prefix extends string> = {
    [K in
        | `${Prefix}Name`
        | `${Prefix}StreetName`
        | `${Prefix}StreetNumber`
        | `${Prefix}City`
        | `${Prefix}PostCode`
        | `${Prefix}CountryCode`]: string;
};

/**
 * Map one party's `{prefix}...` fields off a test-data object into a PartyAddress.
 *
 * Lives here, beside the type it produces and the prefix convention it shares with
 * PartyBlock (`input#${party}Name`), rather than in a mapper module of its own. It
 * replaces the buyer/consignor/consignee/exporter/seller mappers that were copied
 * verbatim - same six fields, different prefix - across the ENS consignment flow and
 * each standalone one.
 *
 *     toPartyAddress('exporter', input)
 */
export function toPartyAddress<Prefix extends string>(
    prefix: Prefix,
    data: PartyFields<Prefix>,
): PartyAddress {
    return {
        name: data[`${prefix}Name` as keyof PartyFields<Prefix>],
        streetName: data[`${prefix}StreetName` as keyof PartyFields<Prefix>],
        streetNumber: data[`${prefix}StreetNumber` as keyof PartyFields<Prefix>],
        city: data[`${prefix}City` as keyof PartyFields<Prefix>],
        postCode: data[`${prefix}PostCode` as keyof PartyFields<Prefix>],
        country: data[`${prefix}CountryCode` as keyof PartyFields<Prefix>],
    };
}


export class PartyBlock extends BasePage {
    private readonly eoriInput: Locator;
    private readonly nameInput: Locator;
    private readonly streetNameInput: Locator;
    private readonly streetNumberInput: Locator;
    private readonly cityInput: Locator;
    private readonly postCodeInput: Locator;
    private readonly countryDropdown: Locator;

    constructor(page: Page, private readonly party: PartyType) {
        super(page);
        this.eoriInput = page.locator(`input#${party}EORI`);
        this.nameInput = page.locator(`input#${party}Name`);
        this.streetNameInput = page.locator(`input#${party}StreetName`);
        this.streetNumberInput = page.locator(`input#${party}StreetNumber`);
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


    /**
     * Submit the EORI and report whether the app now wants the party's address.
     *
     *   - `address`   the next step is `<party>-profile`; the EORI was blank or new
     *   - `accepted`  the app moved elsewhere; the EORI is registered in TSS
     *
     * Whether an EORI is registered is a fact about the environment, not about
     * the test's intent, so it is read from the step the app lands on rather than
     * declared in the test data.
     */
    async submitEori(eori: string, timeoutMs: number): Promise<'accepted' | 'address'> {
        // Read the step only after the field is there. Filling waits for it, which
        // also proves the previous screen has finished handing over; reading the
        // URL first could capture the step we are still leaving.
        await this.fillEori(eori);
        const eoriStep = currentWizardStep(this.page);

        await this.clickContinueButton();

        // Continue posts back to the same step, then redirects roughly 400ms later.
        // Reading page.url() straight after the click would therefore always see
        // the EORI screen, and every party would look "accepted".
        await waitForWizardStepToChange(this.page, eoriStep, timeoutMs);

        return currentWizardStep(this.page) === `${this.party}-profile` ? 'address' : 'accepted';
    }


    /** Fill all address fields only (caller decides when to continue). */
    async fillAddress(address: PartyAddress): Promise<void> {
        await this.nameInput.fill(address.name);
        await this.streetNameInput.fill(address.streetName);
        await this.streetNumberInput.fill(address.streetNumber);
        await this.cityInput.fill(address.city);
        await this.postCodeInput.fill(address.postCode);
        await selectDropdownValue(this.countryDropdown, address.country);
    }

    /** Fill all address fields and continue to the next screen. */
    async enterAddress(address: PartyAddress): Promise<void> {
        await this.fillAddress(address);
        await this.clickContinueButton();
    }

    /**
     * Submit the party's EORI, then supply the address only if the app asks for it:
     * a blank or new EORI lands on the `<party>-profile` address screen, a
     * registered one skips it. This "EORI then maybe address" orchestration lives
     * on the party itself so every consignment journey (ENS and standalone) shares
     * one copy instead of repeating the branch per page.
     */
    async enterEoriThenAddressIfAsked(eori: string, address: PartyAddress, timeoutMs: number): Promise<void> {
        if (await this.submitEori(eori, timeoutMs) === 'address') {
            await this.enterAddress(address);
        }
    }
}
