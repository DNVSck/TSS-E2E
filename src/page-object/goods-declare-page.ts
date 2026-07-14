import { BasePage } from "./base-page";
import { Page, Locator } from '@playwright/test';
import { selectDropdownValue, checkRadioByValue, selectAutocompleteValue } from '../core/util/element-helper';



export class GoodsDeclarePage extends BasePage {

    private readonly useTgpYesOption: Locator;
    private readonly useTgpNoOption: Locator;

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

    private readonly invoiceNumberInput: Locator;
    private readonly itemCurrencyDropdown: Locator;
    private readonly itemPriceAmountInput: Locator;

    constructor(page: Page) {
        super(page);

        // "Do you want to use TGP?" — the first goods screen, IMMI goods only.
        this.useTgpYesOption = page.locator("input#useTgp-yesNoOptions-yes");
        this.useTgpNoOption = page.locator("input#useTgp-yesNoOptions-no");

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

        // "Enter invoice details"
        this.invoiceNumberInput = page.locator("input#invoiceNumber");
        this.itemCurrencyDropdown = page.locator("select#itemCurrency");
        this.itemPriceAmountInput = page.locator("input#itemPrice");

        
    }

    /**
     * The "use TGP?" screen is the first goods screen, but it appears only for IMMI
     * goods when the signed-in trader has a TGP profile — a fact about the
     * environment, so it is detected rather than declared in the test data. Waits
     * for whichever screen the app lands on (the TGP question, or the goods domestic
     * status screen that immediately follows when TGP is absent) and answers the TGP
     * question only when it is actually shown.
     *
     * Returns whether the screen was present and answered.
     */
    async answerUseTgpIfPresent(useTGP: boolean): Promise<boolean> {
        // On IMMI the TGP screen is first; when the trader has no TGP profile the app
        // lands straight on the procedure-code screen, so wait for whichever shows.
        await this.useTgpYesOption.or(this.goodsProcedureCodeDropdown).first().waitFor({ state: 'visible' });

        if (!(await this.useTgpYesOption.isVisible())) {
            return false;
        }

        await (useTGP ? this.useTgpYesOption : this.useTgpNoOption).check();
        await this.clickContinueButton();
        return true;
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

    async inputSupplementaryUnits(supplementaryUnits: string): Promise<void> {
        await this.supplementaryUnitsInput.fill(supplementaryUnits);
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

    async inputShippingMarks(shippingMarks: string): Promise<void> {
        await this.shippingMarksInput.fill(shippingMarks, { timeout: 30000 });
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
        await this.grossMassInput.fill(grossMass);
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

    /** The goods-item commodity screen: the tariff commodity code plus a description. */
    async enterGoodsDescriptionAndCommodityCode(goodsDescription: string, commodityCode: string): Promise<void> {
        await this.selectCommodityCode(commodityCode);
        await this.inputGoodsDescription(goodsDescription);
        await this.clickContinueButton();
    }

    /** The country of origin is a native select on its own screen, before the commodity screen. */
    async enterCountryOfOrigin(countryOfOrigin: string): Promise<void> {
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