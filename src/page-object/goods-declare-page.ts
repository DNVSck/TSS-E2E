import { BasePage } from "./base-page";
import { Page, Locator } from '@playwright/test';
import { selectDropdownValue, checkRadioByValue, selectAutocompleteValue } from '../helper/element-helper';

const COMMODITY_SUBMIT_TIMEOUT = 60_000;

/**
 * How long the NIRMS screen gets to appear before the wizard is taken to have skipped it.
 *
 * Short on purpose. The previous screen has already been submitted when this is asked, so
 * the next screen is either painting or is a different one - there is nothing slow to wait
 * for, and every declaration that does not qualify for NIRMS pays this once.
 */
const NIRMS_SCREEN_TIMEOUT = 5_000;

/**
 * The first field of a goods-wizard screen gets longer than the global action timeout.
 *
 * These screens are the slowest thing the suite renders, and under parallel load the
 * FIRST field of a screen is where that shows: the click that submitted the previous one
 * has returned, but the next screen is still painting. Measured 2026-08-17 - at four
 * workers the wizard timed out on shipping marks in one run and gross mass in the next,
 * while two workers passed both, so it is the screen that is slow rather than any one
 * field.
 *
 * Applied to the first field of each screen that has actually proved slow, not to every
 * field: a long timeout on a field that is genuinely missing only delays the report.
 */
const SCREEN_PAINT_TIMEOUT = 30_000;

/** The radio group on the NIRMS screen, addressed by the name its inputs post. */
const USE_NIRMS_RADIO_NAME = 'useNirms';

export class GoodsDeclarePage extends BasePage {

    private readonly useNirmsRadios: Locator;
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

    private readonly goodsProcedureCodeDropdown: Locator;

    private readonly additionalProcedureCodeDropdown: Locator;
    private readonly warehouseTypeDropdown: Locator;
    private readonly warehouseIdentifierInput: Locator;

    private readonly invoiceNumberInput: Locator;
    private readonly itemCurrencyDropdown: Locator;
    private readonly itemPriceAmountInput: Locator;

    constructor(page: Page) {
        super(page);

        // "Do you want to use TGP?" — the first goods screen, IMMI goods only.
        this.useNirmsRadios = page.locator("input[name='useNirms']");
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
    
        // "Goods procedure codes"
        this.goodsProcedureCodeDropdown = page.locator("select#procedureCode");

        // "Additional procedure code"
        this.additionalProcedureCodeDropdown = page.locator("select#additionalProcedureCode");

        // "Warehouse identifier" - inserted into the procedure journey only for the
        // procedure codes that declare warehoused goods (see requiresWarehouseIdentifier).
        this.warehouseTypeDropdown = page.locator("select#warehouseType");
        this.warehouseIdentifierInput = page.locator("input#warehouseIdentifier");

        // "Enter invoice details"
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
     * "Do you want to use NIRMS for these goods?" - answer it only if it is on screen.
     *
     * CONDITIONAL, and not on anything the test controls: the service shows it when the
     * importer company holds a NIRMS authorisation AND the commodity supports NIRMS
     * (Trung, 2026-08-17). So this cannot be driven from the journey's own booleans the
     * way every other screen is, and asking for the radio unconditionally would hang the
     * wizard on every declaration that does not qualify.
     *
     * Waits on the RADIO rather than a heading, because the heading is translated and
     * these specs run in Welsh too. A short wait: by the time this is called the previous
     * screen has already been submitted, so the next one is either painting or is not
     * this one.
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

    async inputShippingMarks(shippingMarks: string): Promise<void> {
        await this.shippingMarksInput.fill(shippingMarks, { timeout: SCREEN_PAINT_TIMEOUT });
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
        // First field of the weight screen - see SCREEN_PAINT_TIMEOUT.
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
        await this.clickContinueButton(COMMODITY_SUBMIT_TIMEOUT);
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
        await this.clickContinueButton(COMMODITY_SUBMIT_TIMEOUT);
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
        await this.clickContinueButton();
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


}