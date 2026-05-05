import { BasePage } from "./base-page";
import { Page, Locator } from '@playwright/test';
import { NEW_CONSIGNMENT_DECLARATION } from '../constant/consignment-declaration-constants';



export class ConsignmentDeclarePage extends BasePage {

    importerEORIInput: Locator;
    importerNameInput: Locator;
    importerStreetAndNumberInput: Locator;
    importerCityInput: Locator;
    importerPostCodeInput: Locator;
    importerCountryDropdown: Locator;
    buyerSameAsImporterYesOption: Locator;
    buyerSameAsImporterNoOption: Locator;
    buyerEORIInput: Locator;
    buyerNameInput: Locator;
    buyerStreetAndNumberInput: Locator;
    buyerCityInput: Locator;
    buyerPostCodeInput: Locator;
    buyerCountryDropdown: Locator;
    areGoodsAtRiskYesOption: Locator;
    areGoodsAtRiskNoOption: Locator;
    useIMMIYesOption: Locator;
    useIMMINoOption: Locator;
    controlledGoodsYesOption: Locator;
    controlledGoodsNoOption: Locator;
    transportDocumentNumberInput: Locator;
    nidomOption: Locator;
    niimpOption: Locator;
    destinationCountryDropdown: Locator;
    warehouseIdentifierInput: Locator;
    consignorEORIInput: Locator;
    consignorNameInput: Locator;
    consignorStreetAndNumberInput: Locator;
    consignorCityInput: Locator;
    consignorPostCodeInput: Locator;
    consignorCountryDropdown: Locator;
    consigneeEORIInput: Locator;
    consigneeNameInput: Locator;
    consigneeStreetAndNumberInput: Locator;
    consigneeCityInput: Locator;
    consigneePostCodeInput: Locator;
    consigneeCountryDropdown: Locator;
    exporterEORIInput: Locator;
    exporterNameInput: Locator;
    exporterStreetAndNumberInput: Locator;
    exporterCityInput: Locator;
    exporterPostCodeInput: Locator;
    exporterCountryDropdown: Locator;
    sellerSameAsExporterYesOption: Locator;
    sellerSameAsExporterNoOption: Locator;
    sellerEORIInput: Locator;
    sellerNameInput: Locator;
    sellerStreetAndNumberInput: Locator;
    sellerCityInput: Locator;
    sellerPostCodeInput: Locator;
    sellerCountryDropdown: Locator;
    consignmentDescriptionInput: Locator;
    traderReferenceInput: Locator;
    goodsCrossEUBorderYesOption: Locator;
    goodsCrossEUBorderNoOption: Locator;
    allGoodsInSameContainersYesOption: Locator;
    allGoodsInSameContainersNoOption: Locator;
    containerIdentificationNumberInput: Locator;

    constructor(page: Page) {
        super(page);

        // "Who is the importer?" section
        this.importerEORIInput = page.locator("input#importerEORI");

        // "Enter the importer's address" section
        this.importerNameInput = page.locator("input#importerName");
        this.importerStreetAndNumberInput = page.locator("input#importerStreetAndNumber");
        this.importerCityInput = page.locator("input#importerCity");
        this.importerPostCodeInput = page.locator("input#importerPostcode");
        this.importerCountryDropdown = page.locator("select#importerCountry");

        // "Is the buyer the same as the importer?" question
        this.buyerSameAsImporterYesOption = page.locator("input#isImporterSameBuyer-yesNoOptions-yes");
        this.buyerSameAsImporterNoOption = page.locator("input#isImporterSameBuyer-yesNoOptions-no");

        // "Buyer's EORI number" section
        this.buyerEORIInput = page.locator("input#buyerEORI");

        // "Enter the buyer's address" section
        this.buyerNameInput = page.locator("input#buyerName");
        this.buyerStreetAndNumberInput = page.locator("input#buyerStreetAndNumber");
        this.buyerCityInput = page.locator("input#buyerCity");
        this.buyerPostCodeInput = page.locator("input#buyerPostcode");
        this.buyerCountryDropdown = page.locator("select#buyerCountry");

        // "Are the goods at risk of moving into the Republic of Ireland?" question
        this.areGoodsAtRiskYesOption = page.locator("input#areGoodsAtRisk-yesNoOptions-yes");
        this.areGoodsAtRiskNoOption = page.locator("input#areGoodsAtRisk-yesNoOptions-no");

        // "Do you want to use an IMMI (Internal Market Movement Information submission)?"  question
        this.useIMMIYesOption = page.locator("input#useIMMI-immiOptions-yes");
        this.useIMMINoOption = page.locator("input#useIMMI-immiOptions-no");

        // "Controlled goods?"  question
        this.controlledGoodsYesOption = page.locator("input#containsControlledGoods-controlledGoodsOptions-yes");
        this.controlledGoodsNoOption = page.locator("input#containsControlledGoods-controlledGoodsOptions-no");

        // "Enter transport and destination details" section
        this.transportDocumentNumberInput = page.locator("input#transportDocumentNumber");
        this.nidomOption = page.locator("input#goodsDomesticStatus-goodsDomesticStatus-nidom");
        this.niimpOption = page.locator("input#goodsDomesticStatus-goodsDomesticStatus-niimp");
        this.destinationCountryDropdown = page.locator("select#destinationCountry");

        // "Warehouse identifier" section
        this.warehouseIdentifierInput = page.locator("input#warehouseIdentifier");

        // "Who is the consignor?" section
        this.consignorEORIInput = page.locator("input#consignorEORI");

        // "Enter the consignor's address" section
        this.consignorNameInput = page.locator("input#consignorName");
        this.consignorStreetAndNumberInput = page.locator("input#consignorStreetAndNumber");
        this.consignorCityInput = page.locator("input#consignorCity");
        this.consignorPostCodeInput = page.locator("input#consignorPostcode");
        this.consignorCountryDropdown = page.locator("select#consignorCountry");

        // "Who is the consignee?" section
        this.consigneeEORIInput = page.locator("input#consigneeEORI");

        // "Enter the consignee's address" section
        this.consigneeNameInput = page.locator("input#consigneeName");
        this.consigneeStreetAndNumberInput = page.locator("input#consigneeStreetAndNumber");
        this.consigneeCityInput = page.locator("input#consigneeCity");
        this.consigneePostCodeInput = page.locator("input#consigneePostcode");
        this.consigneeCountryDropdown = page.locator("select#consigneeCountry");

        // "Who is the exporter?" section
        this.exporterEORIInput = page.locator("input#exporterEORI");

        // "Enter the exporter's address" section
        this.exporterNameInput = page.locator("input#exporterName");
        this.exporterStreetAndNumberInput = page.locator("input#exporterStreetAndNumber");
        this.exporterCityInput = page.locator("input#exporterCity");
        this.exporterPostCodeInput = page.locator("input#exporterPostcode");
        this.exporterCountryDropdown = page.locator("select#exporterCountry");

        // "Is the seller the same as the exporter?" question
        this.sellerSameAsExporterYesOption = page.locator("input#isExporterSameSeller-yesNoOptions-yes");
        this.sellerSameAsExporterNoOption = page.locator("input#isExporterSameSeller-yesNoOptions-no");

        // "Seller's EORI number" section
        this.sellerEORIInput = page.locator("input#sellerEORI");

        // "Enter the seller's address" section
        this.sellerNameInput = page.locator("input#sellerName");
        this.sellerStreetAndNumberInput = page.locator("input#sellerStreetAndNumber");
        this.sellerCityInput = page.locator("input#sellerCity");
        this.sellerPostCodeInput = page.locator("input#sellerPostcode");
        this.sellerCountryDropdown = page.locator("select#sellerCountry");

        // "Consignment references" section
        this.consignmentDescriptionInput = page.locator("input#consignmentDescription");
        this.traderReferenceInput = page.locator("input#traderReference");

        // "Are the goods transported in containers when crossing the EU’s external borders?" section
        this.goodsCrossEUBorderYesOption = page.locator("input#isTransportingInContainers-yesNoOptions-yes");
        this.goodsCrossEUBorderNoOption = page.locator("input#isTransportingInContainers-yesNoOptions-no");

        // "Are all goods transported in the same containers when crossing the EU’s external borders?" section
        this.allGoodsInSameContainersYesOption = page.locator("input#isTheSameContainer-yesNoOptions-yes");
        this.allGoodsInSameContainersNoOption = page.locator("input#isTheSameContainer-yesNoOptions-no");

        // "Container identification number" section
        this.containerIdentificationNumberInput = page.locator("input#containerIdentifierNumber");
    }


    async inputImporterEORI(importerEORI: string): Promise<void> {
        await this.importerEORIInput.fill(importerEORI);
        await this.clickContinueButton();
    }

    //NOTE - this method can be called when EORI is not recognized by TSS
    async inputImporterAddress(name: string, streetAndNumber: string, city: string, postCode: string, country: string): Promise<void> {
        await this.importerNameInput.fill(name);
        await this.importerStreetAndNumberInput.fill(streetAndNumber);
        await this.importerCityInput.fill(city);
        await this.importerPostCodeInput.fill(postCode);
        await this.importerCountryDropdown.selectOption({ value: country });
        await this.clickContinueButton();
    }


    async chooseBuyerInvolvement(isBuyerInvolvement: string, buyerEORI: string, buyerName: string, buyerStreetAndNumber: string, buyerCity: string, 
        buyerPostCode: string, buyerCountry: string): Promise<void> {
        const value = isBuyerInvolvement.trim().toLowerCase();
        if (value === 'yes') {
            await this.buyerSameAsImporterYesOption.check();
        } else{
            await this.buyerSameAsImporterNoOption.check();
            await this.inputBuyerEORI(buyerEORI);
            await this.inputBuyerAddress(buyerName, buyerStreetAndNumber, buyerCity, buyerPostCode, buyerCountry);
        }
        await this.clickContinueButton();
    }

    async inputBuyerEORI(buyerEORI: string): Promise<void> {
        await this.buyerEORIInput.fill(buyerEORI);  
    }

    //NOTE - this method can be called when EORI is not recognized by TSS
    async inputBuyerAddress(name: string, streetAndNumber: string, city: string, postCode: string, country: string): Promise<void> {
        await this.buyerNameInput.fill(name);
        await this.buyerStreetAndNumberInput.fill(streetAndNumber);
        await this.buyerCityInput.fill(city);
        await this.buyerPostCodeInput.fill(postCode);
        await this.buyerCountryDropdown.selectOption({ value: country });
    }

    async defineGoodsAtRisk(isGoodsAtRisk: string, useIMMI: string): Promise<void> {
        const value = isGoodsAtRisk.trim().toLowerCase();
        if (value === 'yes') {
            await this.areGoodsAtRiskYesOption.check();
            await this.clickContinueButton();
        } else{
            await this.areGoodsAtRiskNoOption.check();
            await this.clickContinueButton();
            await this.chooseToUseIMMI(useIMMI);
        }
    }

    async chooseToUseIMMI(useIMMI: string): Promise<void> {
        const value = useIMMI.trim().toLowerCase();
        if (value === 'yes') {
            await this.useIMMIYesOption.check();
        } else{
            await this.useIMMINoOption.check();
        }
        await this.clickContinueButton();
    }

    async defineControlledGoods(isControlledGoods: string): Promise<void> {
        const value = isControlledGoods.trim().toLowerCase();
        if (value === 'yes') {
            await this.controlledGoodsYesOption.check();
        } else{
            await this.controlledGoodsNoOption.check();
        }
        await this.clickContinueButton();
    }

    async fillTransportAndDestinationDetails(transportDocumentNumber: string, goodsDomesticStatus: string, destinationCountry: string): Promise<void> {
        await this.inputTransportDocumentNumber(transportDocumentNumber);
        await this.defineGoodsDomesticStatus(goodsDomesticStatus);
        await this.selectDestinationCountry(destinationCountry);
        await this.clickContinueButton();
    }

    async inputTransportDocumentNumber(transportDocumentNumber: string): Promise<void> {
        await this.transportDocumentNumberInput.fill(transportDocumentNumber); 
    }

    async defineGoodsDomesticStatus(goodsDomesticStatus: string): Promise<void> {
        if (goodsDomesticStatus === NEW_CONSIGNMENT_DECLARATION.GOODS_DOMESTIC_STATUS.NIDOM) {
            await this.nidomOption.check();
        } else if (goodsDomesticStatus === NEW_CONSIGNMENT_DECLARATION.GOODS_DOMESTIC_STATUS.NIIMP) {
            await this.niimpOption.check();
        }
    }

    async selectDestinationCountry(country: string): Promise<void> {
        await this.destinationCountryDropdown.selectOption({ value: country });
    }

    async inputWarehouseIdentifier(warehouseIdentifier: string): Promise<void> {
        await this.warehouseIdentifierInput.fill(warehouseIdentifier);
        await this.clickContinueButton();
    }

    // If EORI is not supplied, then the following consignor fields are ALL mandatory
    async inputConsignorInformation(consignorEORI: string, name: string, streetAndNumber: string, city: string, postCode: string, country: string): Promise<void> {
        await this.inputConsignorEORI(consignorEORI);
        
        await this.inputConsignorAddress(name, streetAndNumber, city, postCode, country);
    }

    async inputConsignorEORI(consignorEORI: string): Promise<void> {
        await this.consignorEORIInput.fill(consignorEORI);
        await this.clickContinueButton();
    }

    async inputConsignorAddress(name: string, streetAndNumber: string, city: string, postCode: string, country: string): Promise<void> {
        await this.consignorNameInput.fill(name);
        await this.consignorStreetAndNumberInput.fill(streetAndNumber);
        await this.consignorCityInput.fill(city);
        await this.consignorPostCodeInput.fill(postCode);
        await this.consignorCountryDropdown.selectOption({ value: country });
        await this.clickContinueButton();
    }

    // If EORI is not supplied, then the following consignee fields are ALL mandatory
    async inputConsigneeInformation(consigneeEORI: string, name: string, streetAndNumber: string, city: string, postCode: string, country: string): Promise<void> {
        await this.inputConsigneeEORI(consigneeEORI);
        
        await this.inputConsigneeAddress(name, streetAndNumber, city, postCode, country);
    }

    async inputConsigneeEORI(consigneeEORI: string): Promise<void> {
        await this.consigneeEORIInput.fill(consigneeEORI);
        await this.clickContinueButton();
    }

    async inputConsigneeAddress(name: string, streetAndNumber: string, city: string, postCode: string, country: string): Promise<void> {
        await this.consigneeNameInput.fill(name);
        await this.consigneeStreetAndNumberInput.fill(streetAndNumber);
        await this.consigneeCityInput.fill(city);
        await this.consigneePostCodeInput.fill(postCode);
        await this.consigneeCountryDropdown.selectOption({ value: country });
        await this.clickContinueButton();
    }

    // If EORI is not supplied, then the following exporter fields are ALL mandatory
    async inputExporterInformation(exporterEORI: string, name: string, streetAndNumber: string, city: string, postCode: string, country: string): Promise<void> {
        await this.inputExporterEORI(exporterEORI);
        await this.inputExporterAddress(name, streetAndNumber, city, postCode, country);
    }

    async inputExporterEORI(exporterEORI: string): Promise<void> {
        await this.exporterEORIInput.fill(exporterEORI);
        await this.clickContinueButton();
    }

    async inputExporterAddress(name: string, streetAndNumber: string, city: string, postCode: string, country: string): Promise<void> {
        await this.exporterNameInput.fill(name);
        await this.exporterStreetAndNumberInput.fill(streetAndNumber);
        await this.exporterCityInput.fill(city);
        await this.exporterPostCodeInput.fill(postCode);
        await this.exporterCountryDropdown.selectOption({ value: country });
        await this.clickContinueButton();
    }

    async chooseSellerInvolvement(isSellerInvolvement: string, sellerEORI: string, sellerName: string, sellerStreetAndNumber: string, sellerCity: string, 
        sellerPostCode: string, sellerCountryCode: string): Promise<void> {
        const value = isSellerInvolvement.trim().toLowerCase();
        if (value === 'yes') {
            await this.sellerSameAsExporterYesOption.check();
        } else{
            await this.sellerSameAsExporterNoOption.check();
            await this.inputSellerEORI(sellerEORI);
            await this.inputSellerAddress(sellerName, sellerStreetAndNumber, sellerCity, sellerPostCode, sellerCountryCode);
        }
        await this.clickContinueButton();
    }

    async inputSellerEORI(sellerEORI: string): Promise<void> {
        await this.sellerEORIInput.fill(sellerEORI);
        await this.clickContinueButton();
    }
    
    async inputSellerAddress(name: string, streetAndNumber: string, city: string, postCode: string, country: string): Promise<void> {
        await this.sellerNameInput.fill(name);
        await this.sellerStreetAndNumberInput.fill(streetAndNumber);
        await this.sellerCityInput.fill(city);
        await this.sellerPostCodeInput.fill(postCode);
        await this.sellerCountryDropdown.selectOption({ value: country });
        await this.clickContinueButton();
    }

    async inputConsignmentReference(consignmentDescription: string, traderReference: string): Promise<void> {
        await this.inputConsignmentDescription(consignmentDescription);
        await this.inputTraderReference(traderReference);
        await this.clickContinueButton();
    }

    async inputConsignmentDescription(consignmentDescription: string): Promise<void> {
        await this.consignmentDescriptionInput.fill(consignmentDescription);
    }

    async inputTraderReference(traderReference: string): Promise<void> {
        await this.traderReferenceInput.fill(traderReference);
    }

    async chooseGoodsCrossEUBorder(isGoodsCrossEUBorder: string, isSameContainer: string, containerIdentifierNumber: string): Promise<void> {
        const value = isGoodsCrossEUBorder.trim().toLowerCase();    
        if (value === 'yes') {
            await this.goodsCrossEUBorderYesOption.check();
            await this.clickContinueButton();
            await this.chooseAllGoodsInSameContainers(isSameContainer, containerIdentifierNumber);
        }
        else{
            await this.goodsCrossEUBorderNoOption.check();
            await this.clickContinueButton();
        }
    }

    async chooseAllGoodsInSameContainers(isSameContainer: string, containerIdentifierNumber: string): Promise<void> {
        const value = isSameContainer.trim().toLowerCase();
        if (value === 'yes') {
            await this.allGoodsInSameContainersYesOption.check();
            await this.clickContinueButton();
            await this.inputContainerIdentificationNumber(containerIdentifierNumber);
        }
        else{
            await this.allGoodsInSameContainersNoOption.check();
            await this.clickContinueButton();
        }
    }

    async inputContainerIdentificationNumber(containerIdentifierNumber: string): Promise<void> {
        await this.containerIdentificationNumberInput.fill(containerIdentifierNumber);
        await this.clickContinueButton();
    }

}