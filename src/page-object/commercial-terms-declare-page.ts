import { Page, Locator } from '@playwright/test';
import { BasePage } from './base-page';
import { selectDropdownValue, checkRadioByValue } from '../helper/element-helper';

/**
 * The consignment-header screens the app groups under "Commercial terms": the delivery
 * terms and the two UN/LOCODE screens behind them, plus how the duty will be paid.
 *
 * Extracted from FfdStandaloneConsignmentDeclarePage on 2026-08-20, when the
 * supplementary declaration turned out to show the same screens - same route family,
 * same field ids - which made the premise of that file ("screens that exist ONLY on
 * the FFD standalone journey") false for these four. The rule it states is the reason
 * they moved rather than being copied: one screen has one owner.
 *
 * The nature-of-goods pair stays on the FFD page. Those ask, at CONSIGNMENT level,
 * whether every item shares a nature and then what it is; SD asks the same question of
 * a single GOODS ITEM, on a goods route, and that one belongs to GoodsDeclarePage. The
 * shared "select#natureOfGoods" id is a coincidence of two screens, not one screen
 * seen twice.
 */
export class CommercialTermsDeclarePage extends BasePage {
    private readonly incotermDropdown: Locator;
    private readonly unlocodeDropdown: Locator;
    private readonly unlocodeCountryDropdown: Locator;
    private readonly unlocodePlaceDropdown: Locator;
    private readonly methodOfPaymentDropdown: Locator;
    private readonly knownUnlocodeRadios: Locator;

    constructor(page: Page) {
        super(page);

        this.incotermDropdown = page.locator('select#incoterm');
        this.unlocodeDropdown = page.locator('select#unlocode');
        this.unlocodeCountryDropdown = page.locator('select#unlocodeCountry');
        this.unlocodePlaceDropdown = page.locator('select#unlocodePlace');
        this.methodOfPaymentDropdown = page.locator('select#methodOfPayment');
        this.knownUnlocodeRadios = page.locator('input[name="isKnownUnlocode"]');
    }

    /**
     * "Delivery terms" - one screen carrying the INCOTERM and whether the trader knows
     * the UN/LOCODE. Answering no leads to picking the country and place instead.
     */
    async enterDeliveryTerms(incoterm: string, isKnownUnlocode: boolean): Promise<void> {
        await selectDropdownValue(this.incotermDropdown, incoterm);
        await checkRadioByValue(this.knownUnlocodeRadios, isKnownUnlocode ? 'yes' : 'no');
        await this.clickContinueButton();
    }

    /**
     * "UN/LOCODE" - the single screen behind answering YES to knowing the code.
     *
     * The alternative to the two screens below, not an addition to them: saying yes
     * takes the code outright, saying no asks for the country and the place instead.
     */
    async selectUnlocode(unlocode: string): Promise<void> {
        await selectDropdownValue(this.unlocodeDropdown, unlocode);
        await this.clickContinueButton();
    }

    /** "Delivery country" */
    async selectDeliveryCountry(countryCode: string): Promise<void> {
        await selectDropdownValue(this.unlocodeCountryDropdown, countryCode);
        await this.clickContinueButton();
    }

    /** "Delivery place" - the options depend on the country chosen a screen earlier. */
    async selectDeliveryPlace(unlocodePlace: string): Promise<void> {
        await selectDropdownValue(this.unlocodePlaceDropdown, unlocodePlace);
        await this.clickContinueButton();
    }

    /**
     * "What method of payment will be used to pay for the goods on this consignment?"
     *
     * On a supplementary declaration this is not part of the wizard: the value is
     * inherited from the company profile and changed on its own, from the "Change" link
     * the SD overview offers once the full consignment details are expanded. It still
     * ends in the same Continue button, so the same method drives both.
     */
    async selectMethodOfPayment(methodOfPayment: string): Promise<void> {
        await selectDropdownValue(this.methodOfPaymentDropdown, methodOfPayment);
        await this.clickContinueButton();
    }
}
