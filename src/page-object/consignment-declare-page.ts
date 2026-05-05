import { BasePage } from "./base-page";
import { Page, Locator } from '@playwright/test';
import { COUNTRY_CODE, CountryCodeKey } from "../constant/country-code-dropdown-constant";

import { selectDropdownValue } from '../core/util/element-helper';



export class ConsignmentDeclarePage extends BasePage {

    importerEORIInput: Locator;
    importerNameInput: Locator;
    importerStreetAndNumberInput: Locator;
    importerCityInput: Locator;
    importerPostCodeInput: Locator;
    importerCountryDropdown: Locator;
    theSameEORIYesOption: Locator;
    theSameEORINoOption: Locator;
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
        this.importerPostCodeInput = page.locator("input#importerPostCode");
        this.importerCountryDropdown = page.locator("select#importerCountry");

        // "Is the buyer the same as the importer?" question
        this.theSameEORIYesOption = page.locator("input#isImporterSameBuyer-yesNoOptions-yes");
        this.theSameEORINoOption = page.locator("input#isImporterSameBuyer-yesNoOptions-no");

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
        this.consignorPostCodeInput = page.locator("input#consignorPostCode");
        this.consignorCountryDropdown = page.locator("select#consignorCountry");

        // "Who is the consignee?" section
        this.consigneeEORIInput = page.locator("input#consigneeEORI");

        // "Enter the consignee's address" section
        this.consigneeNameInput = page.locator("input#consigneeName");
        this.consigneeStreetAndNumberInput = page.locator("input#consigneeStreetAndNumber");
        this.consigneeCityInput = page.locator("input#consigneeCity");
        this.consigneePostCodeInput = page.locator("input#consigneePostCode");
        this.consigneeCountryDropdown = page.locator("select#consigneeCountry");

        // "Who is the exporter?" section
        this.exporterEORIInput = page.locator("input#exporterEORI");

        // "Enter the exporter's address" section
        this.exporterNameInput = page.locator("input#exporterName");
        this.exporterStreetAndNumberInput = page.locator("input#exporterStreetAndNumber");
        this.exporterCityInput = page.locator("input#exporterCity");
        this.exporterPostCodeInput = page.locator("input#exporterPostCode");
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
        this.sellerPostCodeInput = page.locator("input#sellerPostCode");
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


    async selectNationalOfMeansOfTransport(countryCode: CountryCodeKey): Promise<void> {
        const importerCountryCode = COUNTRY_CODE[countryCode];
        await selectDropdownValue(this.importerCountryDropdown, importerCountryCode);
    }

    async inputImporterEORI(importerEORI: string): Promise<void> {
        await this.importerEORIInput.fill(importerEORI);
    }

    async clickContinueButton(): Promise<void> {
        await this.commonContinueButton.click();
    }

    async inputImporterAddress(name: string, streetAndNumber: string, city: string, postCode: string, countryCode: string): Promise<void> {
        await this.importerNameInput.fill(name);
        await this.importerStreetAndNumberInput.fill(streetAndNumber);
        await this.importerCityInput.fill(city);
        await this.importerPostCodeInput.fill(postCode);
        await selectDropdownValue(this.importerCountryDropdown, countryCode);
    }

    async isBuyerTheSameAsImporter(isSame: boolean): Promise<void> {
        if (isSame) {
            await this.theSameEORIYesOption.click();
        } else {
            await this.theSameEORINoOption.click();
        }
    }

    async isGoodsAtRisk(isAtRisk: boolean): Promise<void> {
        if (isAtRisk) {
            await this.areGoodsAtRiskYesOption.click();
        } else {
            await this.areGoodsAtRiskNoOption.click();
        }
    }

    async isUsingIMMI(useIMMI: boolean): Promise<void> {
        if (useIMMI) {
            await this.useIMMIYesOption.click();
        } else {
            await this.useIMMINoOption.click();
        }
    }

    async isControlledGoods(controlledGoods: boolean): Promise<void> {
        if (controlledGoods) {
            await this.controlledGoodsYesOption.click();
        } else {
            await this.controlledGoodsNoOption.click();
        }
    }

    async inputTransportDocumentNumber(transportDocumentNumber: string): Promise<void> {
        await this.transportDocumentNumberInput.fill(transportDocumentNumber);
    }

    async selectGoodsDomesticStatus(isNIDOM: boolean): Promise<void> {
        if (isNIDOM) {
            await this.nidomOption.click();
        } else {
            await this.niimpOption.click();
        }
    }

    async selectDestinationCountry(value: string): Promise<void> {
        await selectDropdownValue(this.destinationCountryDropdown, value);
    }

    async inputWarehouseIdentifier(warehouseIdentifier: string): Promise<void> {
        await this.warehouseIdentifierInput.fill(warehouseIdentifier);
    }

    async inputConsignorEORI(consignorEORI: string): Promise<void> {
        await this.consignorEORIInput.fill(consignorEORI);
    }

}