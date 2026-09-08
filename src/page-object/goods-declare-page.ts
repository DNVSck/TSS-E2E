import { BasePage } from "./base-page";
import { Page, Locator } from '@playwright/test';
import { selectDropdownValue, checkRadioByValue, selectAutocompleteValue, readErrorSummary } from '../helper/element-helper';


const COMMODITY_SUBMIT_TIMEOUT = 180_000;

/**
 * How long a screen gets to paint, and to navigate away again.
 *
 * The packaging screen follows the commodity screen, whose Continue returns as soon
 * as the form is posted while the live tariff lookup is still resolving - so the tail
 * of that work lands on the FIRST interaction with the screen after it. Both fields
 * below can be that first interaction, depending on which one the flow fills first,
 * and the same tail can still be running when this screen posts in its turn.
 *
 * Deliberately larger than ACTION_TIMEOUT rather than equal to it: an override worth
 * writing is one that raises something. This was 30s until 2026-09-01, when the
 * default was raised to 30s and it silently became a no-op.
 */
const SCREEN_PAINT_TIMEOUT = 90_000;

/**
 * How long the NIRMS screen gets to appear before the wizard is taken to have skipped it.
 *
 * Short on purpose. The previous screen has already been submitted when this is asked, so
 * the next screen is either painting or is a different one - there is nothing slow to wait
 * for, and every declaration that does not qualify for NIRMS pays this once.
 */
const NIRMS_SCREEN_TIMEOUT = 5_000;

/** The radio group on the NIRMS screen, addressed by the name its inputs post. */
const USE_NIRMS_RADIO_NAME = 'useNirms';

export class GoodsDeclarePage extends BasePage {

    private readonly useTgpYesOption: Locator;
    private readonly useTgpNoOption: Locator;
    private readonly tgpNumberInput: Locator;
    private readonly tgpNumberFirstOption: Locator;

    private readonly noControlledGoodsOption: Locator;
    private readonly yesControlledGoodsOption: Locator;

    private readonly yesDangerousGoodsOption: Locator;
    private readonly noDangerousGoodsOption: Locator;
    private readonly dangerousGoodsCodesInput: Locator;

    private readonly commodityCodeInput: Locator;
    private readonly commodityCodeFirstOption: Locator;
    private readonly goodsDescriptionTextArea: Locator;
    private readonly countryOfOriginDropdown: Locator;
    private readonly supplementaryUnitsInput: Locator;

    private readonly cusCodeInput: Locator;
    private readonly taricAdditionalCodeInput: Locator;
    private readonly nationalAdditionalCodeDropdown: Locator;

    private readonly shippingMarksInput: Locator;
    private readonly typeOfPackagesDropdown: Locator;
    private readonly numberOfPackagesInput: Locator;
    private readonly numberOfPiecesInput: Locator;

    private readonly grossMassInput: Locator;
    private readonly netMassInput: Locator;
    private readonly useNirmsRadios: Locator;

    private readonly goodsProcedureCodeDropdown: Locator;

    private readonly additionalProcedureCodeDropdown: Locator;
    private readonly supervisingCustomsOfficeDropdown: Locator;
    private readonly warehouseTypeDropdown: Locator;
    private readonly warehouseIdentifierInput: Locator;

    private readonly natureOfGoodsDropdown: Locator;
    private readonly preferenceDropdown: Locator;
    private readonly countryOfPreferentialOriginDropdown: Locator;
    private readonly valuationMethodDropdown: Locator;
    private readonly statisticalValueInput: Locator;
    private readonly invoiceNumberInput: Locator;
    private readonly itemCurrencyDropdown: Locator;
    private readonly itemPriceAmountInput: Locator;

    constructor(page: Page) {
        super(page);

        // "Do you want to use TGP?" — the first goods screen, IMMI goods only.
        this.useTgpYesOption = page.locator("input#useTgp-yesNoOptions-yes");
        this.useTgpNoOption = page.locator("input#useTgp-yesNoOptions-no");

        // "Enter your Trader Goods Profile number" — reached only after answering the
        // TGP question yes. Another accessible-autocomplete, like the commodity code.
        this.tgpNumberInput = page.locator("#tgpNumber");
        this.tgpNumberFirstOption = page.locator("#tgpNumber__option--0");

        // Goods domestic status and additional risk status have no goods-item screens
        // — the app carries them over from the consignment — so no locators here.

        // "Are these goods controlled?"
        // "Do these goods require licences, certificates or other forms of control?"
        this.noControlledGoodsOption = page.locator("input#isControlledGoods-isControlledGoodsOptions-no");
        this.yesControlledGoodsOption = page.locator("input#isControlledGoods-isControlledGoodsOptions-yes");

        // "Dangerous goods"
        this.yesDangerousGoodsOption = page.locator("input#isDangerousGoods-yesNoOptions-yes");
        this.noDangerousGoodsOption = page.locator("input#isDangerousGoods-yesNoOptions-no");
        this.dangerousGoodsCodesInput = page.locator("input#dangerousGoodsCode");

        // "Commodity information" — commodity code is an autocomplete combobox and
        // goods description is a single-line textbox (not a textarea), so both are
        // matched by id only rather than by tag.
        this.commodityCodeInput = page.locator("#commodityCode");
        this.commodityCodeFirstOption = page.locator("#commodityCode__option--0");
        this.goodsDescriptionTextArea = page.locator("#goodsDescription");
        this.countryOfOriginDropdown = page.locator("#countryOfOrigin");
        this.supplementaryUnitsInput = page.locator("input#supplementaryUnits");

        // "Enter additional commodity codes"
        this.cusCodeInput = page.locator("input#cusCode");
        this.taricAdditionalCodeInput = page.locator("input#taricAdditionalCode");
        this.nationalAdditionalCodeDropdown = page.locator("select#nationalAdditionalCode");

        // "Enter packaging details"
        this.shippingMarksInput = page.locator("input#packageMarks");
        this.typeOfPackagesDropdown = page.locator("select#typeOfPackages");
        this.numberOfPackagesInput = page.locator("input#numberOfPackages");
        this.numberOfPiecesInput = page.locator("input#numberOfPieces");

        // "Enter weight information"
        this.grossMassInput = page.locator("input#grossMass");
        this.netMassInput = page.locator("input#netMass");
        this.useNirmsRadios = page.locator("input[name='useNirms']");
    
        // "Goods procedure codes"
        this.goodsProcedureCodeDropdown = page.locator("select#procedureCode");

        // "Additional procedure code"
        this.additionalProcedureCodeDropdown = page.locator("select#additionalProcedureCode");

        // "Warehouse identifier" - inserted into the procedure journey only for the
        // procedure codes that declare warehoused goods (see requiresWarehouseIdentifier).
        this.supervisingCustomsOfficeDropdown = page.locator("select#supervisingCustomsOffice");
        this.warehouseTypeDropdown = page.locator("select#warehouseType");
        this.warehouseIdentifierInput = page.locator("input#warehouseIdentifier");

        // "Enter invoice details"
        this.natureOfGoodsDropdown = page.locator("select#natureOfGoods");
        this.preferenceDropdown = page.locator("select#preference");
        this.countryOfPreferentialOriginDropdown = page.locator("select#countryOfPreferentialOrigin");
        this.valuationMethodDropdown = page.locator("select#valuationMethod");
        this.statisticalValueInput = page.locator("input#statisticalValue");

        this.invoiceNumberInput = page.locator("input#invoiceNumber");
        this.itemCurrencyDropdown = page.locator("select#itemCurrency");
        this.itemPriceAmountInput = page.locator("input#itemPrice");

        
    }

    /**
     * The "use TGP?" screen is the first goods screen on IMMI, but it only appears
     * when the signed-in trader has a TGP profile — a fact about the environment, so
     * it is detected rather than declared in the test data. When TGP is absent the app
     * lands straight on the procedure-code screen, so wait for whichever arrives and
     * report which one it was.
     *
     * Detection is separate from answering so the caller can leave the Allure step
     * unopened when the screen does not exist - see GoodsItemSteps.declareTgp.
     */
    async isUseTgpQuestionShown(): Promise<boolean> {
        await this.useTgpYesOption.or(this.goodsProcedureCodeDropdown).first().waitFor({ state: 'visible' });
        return this.useTgpYesOption.isVisible();
    }

    /** Answer the TGP question. Only call once isUseTgpQuestionShown() has said yes. */
    async answerUseTgp(useTGP: boolean): Promise<void> {
        await (useTGP ? this.useTgpYesOption : this.useTgpNoOption).check();
        await this.clickContinueButton();
    }

    /**
     * "Enter your Trader Goods Profile number" — a GOV.UK accessible-autocomplete,
     * so the same type-then-commit dance as the commodity code applies (a plain
     * fill leaves the hidden value empty). The lookup matches the record id, the
     * trader reference or the commodity code, so the caller picks whichever it holds.
     */
    async selectTgpNumber(lookup: string): Promise<void> {
        await selectAutocompleteValue(this.tgpNumberInput, this.tgpNumberFirstOption, lookup);
        await this.clickContinueButton();
    }

    async selectGoodsControlledYes(): Promise<void> {
        await this.yesControlledGoodsOption.check();
        await this.clickContinueButton();
    }

    async selectGoodsControlledNo(): Promise<void> {
        await this.noControlledGoodsOption.check();
        await this.clickContinueButton();
    }

    async selectDangerousGoodsYes(): Promise<void> {
        await this.yesDangerousGoodsOption.check();
        await this.clickContinueButton();
    }

    async selectDangerousGoodsNo(): Promise<void> {
        await this.noDangerousGoodsOption.check();
        await this.clickContinueButton();
    }

    async inputDangerousGoodsCodes(codes: string): Promise<void> {
        await this.dangerousGoodsCodesInput.fill(codes);
        await this.clickContinueButton();
    }

    async inputGoodsDescription(goodsDescription: string): Promise<void> {
        await this.goodsDescriptionTextArea.fill(goodsDescription);
    }

    async selectCountryOfOrigin(countryOfOrigin: string): Promise<void> {
        await selectDropdownValue(this.countryOfOriginDropdown, countryOfOrigin);
    }

    /**
     * "Supplementary units" (Optional field) — shares the commodity screen. Filling it
     * blank is how a test declares none: the overview then shows "Not provided".
     */
    async inputSupplementaryUnits(supplementaryUnits?: string): Promise<void> {
        await this.supplementaryUnitsInput.fill(supplementaryUnits ?? '');
    }

    async inputCusCode(cusCode: string): Promise<void> {
        await this.cusCodeInput.fill(cusCode);
    }

    async inputTaricAdditionalCode(taricAdditionalCode: string): Promise<void> {
        await this.taricAdditionalCodeInput.fill(taricAdditionalCode);
    }

    async selectNationalAdditionalCode(nationalAdditionalCode: string): Promise<void> {
        await selectDropdownValue(this.nationalAdditionalCodeDropdown, nationalAdditionalCode);
    }

    /**
     * "Do you want to use NIRMS for these goods?" - answered only when the service asks.
     *
     * Whether it asks cannot be decided from the journey's own flags: the screen appears
     * when the IMPORTER holds a NIRMS authorisation AND the commodity supports it, which
     * is a fact about the environment's data rather than about this declaration. So the
     * wizard looks, answers if it is there, and reports which happened.
     *
     * Returns whether the screen was shown.
     */
    async answerUseNirmsIfPresent(useNirms: boolean): Promise<boolean> {
        // waitFor, NOT isVisible: isVisible answers immediately and ignores its timeout
        // (it is documented as deprecated there), so it reports "not shown" for a screen
        // that is merely still painting - which is exactly the case here, one submit
        // earlier. Throwing is the expected outcome when the screen is genuinely absent.
        const shown = await this.useNirmsRadios.first()
            .waitFor({ state: 'visible', timeout: NIRMS_SCREEN_TIMEOUT })
            .then(() => true, () => false);

        if (!shown) {
            return false;
        }

        await checkRadioByValue(this.page, USE_NIRMS_RADIO_NAME, useNirms ? 'yes' : 'no');
        await this.clickContinueButton();
        return true;
    }

    /**
     * The first field of the packaging screen, and therefore the first thing to notice
     * that the packaging screen is not what the service sent - see waitForScreenField.
     */
    async inputShippingMarks(shippingMarks: string): Promise<void> {
        // "packaging details" because that is the heading the screen carries ("Enter
        // packaging details"): the message quotes the heading that DID arrive, so the
        // two read side by side only if this names the same thing the page does.
        await this.waitForScreenField(this.shippingMarksInput, 'packaging details', SCREEN_PAINT_TIMEOUT);
        await this.shippingMarksInput.fill(shippingMarks);
    }

    async selectTypeOfPackages(typeOfPackages: string): Promise<void> {
        await selectDropdownValue(this.typeOfPackagesDropdown, typeOfPackages);
    }

    async inputNumberOfPackages(numberOfPackages: string): Promise<void> {
        await this.numberOfPackagesInput.fill(numberOfPackages);
    }

    async inputNumberOfPieces(numberOfPieces: string): Promise<void> {
        await this.numberOfPiecesInput.fill(numberOfPieces);
    }

    async inputGrossMass(grossMass: string): Promise<void> {
        await this.grossMassInput.fill(grossMass, { timeout: SCREEN_PAINT_TIMEOUT });
    }

    async inputNetMass(netMass: string): Promise<void> {
        await this.netMassInput.fill(netMass);
    }

    async selectGoodsProcedureCode(goodsProcedureCode: string): Promise<void> {
        await selectDropdownValue(this.goodsProcedureCodeDropdown, goodsProcedureCode);
        await this.clickContinueButton();
    }

    async selectAdditionalProcedureCode(additionalProcedureCode: string): Promise<void> {
        await selectDropdownValue(this.additionalProcedureCodeDropdown, additionalProcedureCode);
        await this.clickContinueButton();
    }

    /**
     * "Supervising customs office" - the office that oversees the procedure, on its own
     * screen ahead of the warehouse one.
     *
     * Which procedure codes reach it is the caller's rule to know - see
     * GoodsItemSteps.selectSupervisingCustomsOfficeIfAsked - so this one fills the
     * screen and moves on, the same as any other wizard step.
     */
    async selectSupervisingCustomsOffice(office: string): Promise<void> {
        await selectDropdownValue(this.supervisingCustomsOfficeDropdown, office);
        await this.clickContinueButton();
    }

    /**
     * "Warehouse identifier" — where the goods being imported are held. Two fields on
     * one screen: the warehouse type, then its identifier.
     */
    async enterWarehouseIdentifier(warehouseType: string, warehouseIdentifier: string): Promise<void> {
        await selectDropdownValue(this.warehouseTypeDropdown, warehouseType);
        await this.warehouseIdentifierInput.fill(warehouseIdentifier);
        await this.clickContinueButton();
    }

    async inputInvoiceNumber(invoiceNumber: string): Promise<void> {
        await this.invoiceNumberInput.fill(invoiceNumber);
    }

    async selectItemCurrency(itemCurrency: string): Promise<void> {
        await selectDropdownValue(this.itemCurrencyDropdown, itemCurrency);
    }

    async inputItemPriceAmount(itemPriceAmount: string): Promise<void> {
        await this.itemPriceAmountInput.fill(itemPriceAmount);
    }

    /** The commodity code is a GOV.UK accessible-autocomplete (see selectAutocompleteValue). */
    async selectCommodityCode(commodityCode: string): Promise<void> {
        await selectAutocompleteValue(this.commodityCodeInput, this.commodityCodeFirstOption, commodityCode);
    }

    /**
     * The goods-item commodity screen: the tariff commodity code, a description and
     * supplementary units.
     */
    async enterGoodsDescriptionAndCommodityCode(
        goodsDescription: string,
        commodityCode: string,
        supplementaryUnits?: string
    ): Promise<void> {
        await this.selectCommodityCode(commodityCode);
        await this.inputGoodsDescription(goodsDescription);
        await this.inputSupplementaryUnits(supplementaryUnits);
        await this.submitCommodityScreen();
    }

    /**
     * The same screen on a journey that does NOT collect supplementary units — EIDR.
     *
     * A separate method rather than a flag on the one above: the two are different
     * screens, and touching a field that is not rendered costs the full action timeout
     * before failing on a message about an input, saying nothing about the journey.
     */
    async enterGoodsDescriptionAndCommodityCodeOnly(
        goodsDescription: string,
        commodityCode: string
    ): Promise<void> {
        await this.selectCommodityCode(commodityCode);
        await this.inputGoodsDescription(goodsDescription);
        await this.submitCommodityScreen();
    }

    /**
     * The country of origin is a native select on its own screen, before the
     * commodity screen — but only on some journeys: on IMMI the app skips it and
     * lands straight on the commodity screen. Wait for whichever appears and answer
     * country only when it is actually shown. Returns whether it was shown/answered.
     */
    async enterCountryOfOrigin(countryOfOrigin: string): Promise<void> {
        // Wait for the screen to paint: the previous screen advances via a
        // client-side navigation, so the select can lag a beat behind the click.
        await this.countryOfOriginDropdown.waitFor({ state: 'visible' });
        await selectDropdownValue(this.countryOfOriginDropdown, countryOfOrigin);
        await this.clickContinueButton();
    }

    /**
     * Per-item container screen — identification number, size, status and supplier
     * type. Reached only when the consignment declared goods in different containers.
     */
    async enterContainerInformation(
        containerIdentifierNumber: string,
        containerSize: string,
        containerStatusCode: string,
        containerSupplierTypeCode: string
    ): Promise<void> {
        await this.page.locator('#containerIdentifierNumber').fill(containerIdentifierNumber);
        await selectDropdownValue(this.page.locator('#containerSize'), containerSize);
        await checkRadioByValue(this.page, 'containerPackedStatus', containerStatusCode);
        await checkRadioByValue(this.page, 'containerSupplierType', containerSupplierTypeCode);
        await this.clickContinueButton();
    }

    /** Goods-item invoice screen when the currency is already set at consignment level. */
    async enterItemPrice(itemPriceAmount: string): Promise<void> {
        await this.inputItemPriceAmount(itemPriceAmount);
        await this.clickContinueButton();
    }


    async enterAdditionalCommodityCodes(cusCode?: string, taricAdditionalCode?: string, nationalAdditionalCode?: string): Promise<void> {
        await this.inputCusCode(cusCode??'');
        await this.inputTaricAdditionalCode(taricAdditionalCode??'');
        await this.selectNationalAdditionalCode(nationalAdditionalCode??'');
        await this.clickContinueButton();
    }

    async enterPackagingDetails(shippingMarks: string, typeOfPackages: string, numberOfPackages: string, numberOfPieces?: string): Promise<void> {
        await this.inputShippingMarks(shippingMarks);
        await this.selectTypeOfPackages(typeOfPackages);
        await this.inputNumberOfPackages(numberOfPackages);
        await this.inputNumberOfPieces(numberOfPieces??'');
        await this.clickContinueButton(SCREEN_PAINT_TIMEOUT);
    }

    /**
     * The weight screen always asks for the gross mass; some journeys add a net mass
     * field on the same screen (required on ENS-only, absent on EIDR), so it is filled
     * only when present.
     */
    async enterWeightInformation(grossMass: string, netMass?: string): Promise<void> {
        await this.inputGrossMass(grossMass);
        if (await this.netMassInput.isVisible()) {
            await this.netMassInput.fill(netMass ?? '');
        }
        await this.clickContinueButton();
    }

    async enterInvoiceDetails(itemPriceAmount: string, invoiceNumber?: string, itemCurrency?: string): Promise<void> {
        await this.inputInvoiceNumber(invoiceNumber??'');
        await this.selectItemCurrency(itemCurrency??'');
        await this.inputItemPriceAmount(itemPriceAmount);
        await this.clickContinueButton();
    }

    // The three screens below are asked only on a supplementary declaration. A frontier
    // declaration never collects them, which is the point of an SD: they are what the
    // duty is calculated from.

    /**
     * "What is the reason/nature of the goods?"
     *
     * The FFD standalone journey asks this at CONSIGNMENT level, over two screens, and
     * keeps its own pair on FfdStandaloneConsignmentDeclarePage. This is the goods-item
     * screen of the same name - one item, one answer - and shares only the field id.
     */
    async selectNatureOfGoods(natureOfGoods: string): Promise<void> {
        await selectDropdownValue(this.natureOfGoodsDropdown, natureOfGoods);
        await this.clickContinueButton();
    }

    /**
     * "Enter preference and valuation details" - one screen carrying three answers.
     *
     * The country of preferential origin is optional and the app says so in its own
     * label, so an undefined value leaves the dropdown alone rather than selecting a
     * blank option, which is a different thing and can fail validation.
     */
    async enterPreferenceAndValuation(
        preference: string,
        valuationMethod: string,
        countryOfPreferentialOrigin?: string
    ): Promise<void> {
        await selectDropdownValue(this.preferenceDropdown, preference);
        if (countryOfPreferentialOrigin) {
            await selectDropdownValue(this.countryOfPreferentialOriginDropdown, countryOfPreferentialOrigin);
        }
        await selectDropdownValue(this.valuationMethodDropdown, valuationMethod);
        await this.clickContinueButton();
    }

    /**
     * "Commodity information" as a supplementary declaration asks it: the code and the
     * description arrive from the frontier declaration, so only the supplementary units
     * are typed.
     *
     * The screen labels that field "(optional)" and the service then refuses to move on
     * without it - the tariff decides, and a commodity measured in units requires them.
     * Measured on SIT 2026-08-20 against commodity 0601101000, which answers "Enter the
     * supplementary units" to an empty field its own label called optional.
     */
    async enterSupplementaryUnits(supplementaryUnits: string): Promise<void> {
        await this.inputSupplementaryUnits(supplementaryUnits);
        await this.clickContinueButton();
    }

    /** "Statistical value" */
    async enterStatisticalValue(statisticalValue: string): Promise<void> {
        await this.statisticalValueInput.fill(statisticalValue);
        await this.clickContinueButton();
    }

    private async submitCommodityScreen(): Promise<void> {
        try {
            await this.clickContinueButton(COMMODITY_SUBMIT_TIMEOUT);
        } catch (error) {
            throw new Error(await this.describeCommoditySubmitFailure(error as Error));
        }
    }

    /**
     * Every read here is allowed to fail: this runs while the page may still be
     * navigating, and a diagnosis that threw would replace the real failure with its own.
     */
    private async describeCommoditySubmitFailure(error: Error): Promise<string> {
        let path = 'a page whose URL could not be read';
        try {
            path = new URL(this.page.url()).pathname;
        } catch { /* keep the placeholder */ }

        const errors = await readErrorSummary(this.page);
        const quoted = errors.map(message => `"${message}"`).join('; ');
        const shown = errors.length
            ? `The page shows: ${quoted}.`
            : 'The page shows no error, so the service had not refused the form - it had '
                + 'not answered yet. Read the POST in this run\'s trace before raising the '
                + 'budget again.';

        return `Submitting the commodity screen did not reach the next screen within `
            + `${COMMODITY_SUBMIT_TIMEOUT / 1_000}s. Still on "${path}". ${shown}`
            + `\n\nOriginal failure: ${error.message}`;
    }
}