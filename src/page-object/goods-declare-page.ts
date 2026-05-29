import { BasePage } from "./base-page";
import { Page, Locator } from '@playwright/test';
import { ADDITIONAL_RISK_STATUS } from "../constant/additional-risk-status-constant";
import { GOODS_DOMESTIC_STATUS } from "../constant/goods-domestic-status-constant";



export class GoodsDeclarePage extends BasePage {

    nidomOption: Locator;
    niimpOption: Locator;

    niproOption: Locator;
    niquoOption: Locator;
    niremOption: Locator;
    noAdditionalRiskStatusOption: Locator;

    noControlledGoodsOption: Locator;
    yesControlledGoodsOption: Locator;

    yesDangerousGoodsOption: Locator;
    noDangerousGoodsOption: Locator;
    dangerousGoodsCodesInput: Locator;

    commodityCodeInput: Locator;
    goodsDescriptionTextArea: Locator;
    countryOfOriginDropdown: Locator;
    supplementaryUnitsInput: Locator;

    cusCodeInput: Locator;
    taricAdditionalCodeInput: Locator;
    nationalAdditionalCodeDropdown: Locator;

    shippingMarksInput: Locator;
    typeOfPackagesDropdown: Locator;
    numberOfPackagesInput: Locator;
    numberOfPiecesInput: Locator;

    grossMassInput: Locator;
    netMassInput: Locator;

    goodsProcedureCodeDropdown: Locator;

    additionalProcedureCodeDropdown: Locator;

    invoiceNumberInput: Locator;
    itemCurrencyDropdown: Locator;
    itemPriceAmountInput: Locator;

    constructor(page: Page) {
        super(page);

        // "Enter goods domestic status"
        this.nidomOption = page.locator("input#goodsDomesticStatus-goodsDomesticStatus-NIDOM");
        this.niimpOption = page.locator("input#goodsDomesticStatus-goodsDomesticStatus-NIIMP");

        // "Additional risk status"
        this.niproOption = page.locator("input#additionalRiskStatus-additionalRiskStatusOptions-NIPRO");
        this.niquoOption = page.locator("input#additionalRiskStatus-additionalRiskStatusOptions-NIQUO");
        this.niremOption = page.locator("input#additionalRiskStatus-additionalRiskStatusOptions-NIREM");
        this.noAdditionalRiskStatusOption = page.locator("//input[@id='additionalRiskStatus-additionalRiskStatusOptions-No additional risk status']");

        // "Are these goods controlled?"
        // "Do these goods require licences, certificates or other forms of control?"
        this.noControlledGoodsOption = page.locator("input#isControlledGoods-isControlledGoodsOptions-no");
        this.yesControlledGoodsOption = page.locator("input#isControlledGoods-isControlledGoodsOptions-yes");

        // "Dangerous goods"
        this.yesDangerousGoodsOption = page.locator("input#isDangerousGoods-yesNoOptions-yes");
        this.noDangerousGoodsOption = page.locator("input#isDangerousGoods-yesNoOptions-no");
        this.dangerousGoodsCodesInput = page.locator("input#dangerousGoodsCode");

        // "Commodity information"
        this.commodityCodeInput = page.locator("input#commodityCode");
        this.goodsDescriptionTextArea = page.locator("textarea#goodsDescription");
        this.countryOfOriginDropdown = page.locator("select#countryOfOrigin");
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

    async selectGoodsDomesticStatus(status: string): Promise<void> {
        if (status === GOODS_DOMESTIC_STATUS.NIDOM) {
            await this.nidomOption.check();
        } else if (status === GOODS_DOMESTIC_STATUS.NIIMP) {
            await this.niimpOption.check();
        }
        this.clickContinueButton();
    }

    async selectAdditionalRiskStatus(status: string): Promise<void> {
        if (status === ADDITIONAL_RISK_STATUS.NIPRO) {
            await this.niproOption.check();
        } else if (status === ADDITIONAL_RISK_STATUS.NIQUO) {
            await this.niquoOption.check();
        } else if (status === ADDITIONAL_RISK_STATUS.NIREM) {
            await this.niremOption.check();
        } else if (status === ADDITIONAL_RISK_STATUS.NO_ADDITIONAL_RISK_STATUS) {
            await this.noAdditionalRiskStatusOption.check();
        }
        this.clickContinueButton();
    }

    async defineIfGoodsControlled(isControlled: string): Promise<void> {
        const value = isControlled.trim().toLowerCase();
        if (value === 'yes') {
            await this.yesControlledGoodsOption.check();
        } else if (value === 'no') {
            await this.noControlledGoodsOption.check();
        }
        this.clickContinueButton();
    }

    async defineIfDangerousGoods(isDangerous: string, dangerousGoodsCodes: string): Promise<void> {
        const value = isDangerous.trim().toLowerCase();
        if (value === 'yes') {
            await this.yesDangerousGoodsOption.check();
            this.clickContinueButton();
             await this.inputDangerousGoodsCodes(dangerousGoodsCodes); 
        } else if (value === 'no') {
            await this.noDangerousGoodsOption.check();
            this.clickContinueButton();
        }
       
    }

    async inputDangerousGoodsCodes(codes: string): Promise<void> {
        await this.dangerousGoodsCodesInput.fill(codes);
        this.clickContinueButton();
    }

    async inputCommodityCode(commodityCode: string): Promise<void> {
        await this.commodityCodeInput.fill(commodityCode);
    }

    async inputGoodsDescription(goodsDescription: string): Promise<void> {
        await this.goodsDescriptionTextArea.fill(goodsDescription);
    }

    async selectCountryOfOrigin(countryOfOrigin: string): Promise<void> {
        await this.countryOfOriginDropdown.selectOption({ value: countryOfOrigin });
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
        await this.nationalAdditionalCodeDropdown.selectOption({ value: nationalAdditionalCode });
    }

    async inputShippingMarks(shippingMarks: string): Promise<void> {
        await this.shippingMarksInput.fill(shippingMarks);
    }

    async selectTypeOfPackages(typeOfPackages: string): Promise<void> {
        await this.typeOfPackagesDropdown.selectOption({ value: typeOfPackages });
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
        await this.goodsProcedureCodeDropdown.selectOption({ value: goodsProcedureCode });
        this.clickContinueButton();
    }

    async selectAdditionalProcedureCode(additionalProcedureCode: string): Promise<void> {
        await this.additionalProcedureCodeDropdown.selectOption({ value: additionalProcedureCode });
        this.clickContinueButton();
    }

    async inputInvoiceNumber(invoiceNumber: string): Promise<void> {
        await this.invoiceNumberInput.fill(invoiceNumber);
    }

    async selectItemCurrency(itemCurrency: string): Promise<void> {
        await this.itemCurrencyDropdown.selectOption({ value: itemCurrency });
    }

    async inputItemPriceAmount(itemPriceAmount: string): Promise<void> {
        await this.itemPriceAmountInput.fill(itemPriceAmount);
    }

    async fillCommodityInformation(commodityCode: string, goodsDescription: string, countryOfOrigin: string, supplementaryUnits?: string): Promise<void> {
        await this.inputCommodityCode(commodityCode);
        await this.inputGoodsDescription(goodsDescription);
        await this.selectCountryOfOrigin(countryOfOrigin);
        await this.inputSupplementaryUnits(supplementaryUnits??'');
        this.clickContinueButton();
    }

    async enterAdditionalCommodityCodes(cusCode?: string, taricAdditionalCode?: string, nationalAdditionalCode?: string): Promise<void> {
        await this.inputCusCode(cusCode??'');
        await this.inputTaricAdditionalCode(taricAdditionalCode??'');
        await this.selectNationalAdditionalCode(nationalAdditionalCode??'');
        this.clickContinueButton();
    }

    async enterPackagingDetails(shippingMarks: string, typeOfPackages: string, numberOfPackages: string, numberOfPieces?: string): Promise<void> {
        await this.inputShippingMarks(shippingMarks);
        await this.selectTypeOfPackages(typeOfPackages);
        await this.inputNumberOfPackages(numberOfPackages);
        await this.inputNumberOfPieces(numberOfPieces??'');
        this.clickContinueButton();
    }

    async enterWeightInformation(grossMass: string, netMass?: string): Promise<void> {
        await this.inputGrossMass(grossMass);
        await this.inputNetMass(netMass??'');
        this.clickContinueButton();
    }

    async enterInvoiceDetails(itemPriceAmount: string, invoiceNumber?: string, itemCurrency?: string): Promise<void> {
        await this.inputInvoiceNumber(invoiceNumber??'');
        await this.selectItemCurrency(itemCurrency??'');
        await this.inputItemPriceAmount(itemPriceAmount);
        this.clickContinueButton();
    }


}