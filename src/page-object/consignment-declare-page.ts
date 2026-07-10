import { BasePage } from "./base-page";
import { Page, Locator } from '@playwright/test';
import { NEW_CONSIGNMENT_DECLARATION } from '../constant/consignment-declaration-constants';
import { PartyBlock } from './components/party-block';

export class ConsignmentDeclarePage extends BasePage {

    // Trade parties — the repeated "EORI + address" screens live in PartyBlock.
    private readonly importer: PartyBlock;
    private readonly buyer: PartyBlock;
    private readonly consignor: PartyBlock;
    private readonly consignee: PartyBlock;
    private readonly exporter: PartyBlock;
    private readonly seller: PartyBlock;

    // "Is the buyer the same as the importer?" / "Is the seller the same as the exporter?"
    private readonly buyerSameAsImporterYesOption: Locator;
    private readonly buyerSameAsImporterNoOption: Locator;
    private readonly sellerSameAsExporterYesOption: Locator;
    private readonly sellerSameAsExporterNoOption: Locator;

    // Goods at risk / IMMI / controlled goods
    private readonly areGoodsAtRiskYesOption: Locator;
    private readonly areGoodsAtRiskNoOption: Locator;
    private readonly useIMMIYesOption: Locator;
    private readonly useIMMINoOption: Locator;
    private readonly controlledGoodsYesOption: Locator;
    private readonly controlledGoodsNoOption: Locator;

    // Transport and destination details
    private readonly transportDocumentNumberInput: Locator;
    private readonly nidomOption: Locator;
    private readonly niimpOption: Locator;
    private readonly destinationCountryDropdown: Locator;
    private readonly warehouseIdentifierInput: Locator;

    // Consignment references
    private readonly consignmentDescriptionInput: Locator;
    private readonly traderReferenceInput: Locator;

    // Containers when crossing the EU external border
    private readonly goodsCrossEUBorderYesOption: Locator;
    private readonly goodsCrossEUBorderNoOption: Locator;
    private readonly allGoodsInSameContainersYesOption: Locator;
    private readonly allGoodsInSameContainersNoOption: Locator;
    private readonly containerIdentificationNumberInput: Locator;

    constructor(page: Page) {
        super(page);

        this.importer = new PartyBlock(page, 'importer');
        this.buyer = new PartyBlock(page, 'buyer');
        this.consignor = new PartyBlock(page, 'consignor');
        this.consignee = new PartyBlock(page, 'consignee');
        this.exporter = new PartyBlock(page, 'exporter');
        this.seller = new PartyBlock(page, 'seller');

        this.buyerSameAsImporterYesOption = page.locator("input#isImporterSameBuyer-yesNoOptions-yes");
        this.buyerSameAsImporterNoOption = page.locator("input#isImporterSameBuyer-yesNoOptions-no");
        this.sellerSameAsExporterYesOption = page.locator("input#isExporterSameSeller-yesNoOptions-yes");
        this.sellerSameAsExporterNoOption = page.locator("input#isExporterSameSeller-yesNoOptions-no");

        this.areGoodsAtRiskYesOption = page.locator("input#areGoodsAtRisk-yesNoOptions-yes");
        this.areGoodsAtRiskNoOption = page.locator("input#areGoodsAtRisk-yesNoOptions-no");
        this.useIMMIYesOption = page.locator("input#useIMMI-immiOptions-yes");
        this.useIMMINoOption = page.locator("input#useIMMI-immiOptions-no");
        this.controlledGoodsYesOption = page.locator("input#containsControlledGoods-controlledGoodsOptions-yes");
        this.controlledGoodsNoOption = page.locator("input#containsControlledGoods-controlledGoodsOptions-no");

        this.transportDocumentNumberInput = page.locator("input#transportDocumentNumber");
        this.nidomOption = page.locator("input#goodsDomesticStatus-goodsDomesticStatus-NIDOM");
        this.niimpOption = page.locator("input#goodsDomesticStatus-goodsDomesticStatus-NIIMP");
        this.destinationCountryDropdown = page.locator("select#destinationCountry");
        this.warehouseIdentifierInput = page.locator("input#warehouseIdentifier");

        this.consignmentDescriptionInput = page.locator("input#consignmentDescription");
        this.traderReferenceInput = page.locator("input#traderReference");

        this.goodsCrossEUBorderYesOption = page.locator("input#isTransportingInContainers-yesNoOptions-yes");
        this.goodsCrossEUBorderNoOption = page.locator("input#isTransportingInContainers-yesNoOptions-no");
        this.allGoodsInSameContainersYesOption = page.locator("input#isTheSameContainer-yesNoOptions-yes");
        this.allGoodsInSameContainersNoOption = page.locator("input#isTheSameContainer-yesNoOptions-no");
        this.containerIdentificationNumberInput = page.locator("input#containerIdentifierNumber");
    }

    // ===================== Importer =====================

    async inputImporterEORI(importerEORI: string): Promise<void> {
        await this.importer.enterEori(importerEORI);
    }

    // NOTE - this method can be called when EORI is not recognized by TSS
    async inputImporterAddress(name: string, streetAndNumber: string, city: string, postCode: string, country: string): Promise<void> {
        await this.importer.enterAddress({ name, streetAndNumber, city, postCode, country });
    }

    // ===================== Buyer (same as importer?) =====================

    async selectBuyerSameAsImporterYes(): Promise<void> {
        await this.buyerSameAsImporterYesOption.check();
    }

    async selectBuyerSameAsImporterNo(): Promise<void> {
        await this.buyerSameAsImporterNoOption.check();
    }

    /** Buyer EORI and address sit on the same screen as the radio, so no intermediate Continue. */
    async fillBuyerDetails(buyerEORI: string, buyerName: string, buyerStreetAndNumber: string, buyerCity: string,
        buyerPostCode: string, buyerCountry: string): Promise<void> {
        await this.buyer.fillEori(buyerEORI);
        await this.buyer.fillAddress({ name: buyerName, streetAndNumber: buyerStreetAndNumber, city: buyerCity, postCode: buyerPostCode, country: buyerCountry });
    }

    // ===================== Goods at risk / IMMI / controlled =====================

    async selectGoodsAtRiskYes(): Promise<void> {
        await this.areGoodsAtRiskYesOption.check();
        await this.clickContinueButton();
    }

    async selectGoodsAtRiskNo(): Promise<void> {
        await this.areGoodsAtRiskNoOption.check();
        await this.clickContinueButton();
    }

    async selectUseIMMIYes(): Promise<void> {
        await this.useIMMIYesOption.check();
        await this.clickContinueButton();
    }

    async selectUseIMMINo(): Promise<void> {
        await this.useIMMINoOption.check();
        await this.clickContinueButton();
    }

    async selectControlledGoodsYes(): Promise<void> {
        await this.controlledGoodsYesOption.check();
        await this.clickContinueButton();
    }

    async selectControlledGoodsNo(): Promise<void> {
        await this.controlledGoodsNoOption.check();
        await this.clickContinueButton();
    }

    // ===================== Transport and destination =====================

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

    // ===================== Consignor / Consignee / Exporter =====================
    // If EORI is not supplied, then the address fields are ALL mandatory.

    async inputConsignorEORI(consignorEORI: string): Promise<void> {
        await this.consignor.enterEori(consignorEORI);
    }

    async inputConsignorAddress(name: string, streetAndNumber: string, city: string, postCode: string, country: string): Promise<void> {
        await this.consignor.enterAddress({ name, streetAndNumber, city, postCode, country });
    }

    async inputConsigneeEORI(consigneeEORI: string): Promise<void> {
        await this.consignee.enterEori(consigneeEORI);
    }

    async inputConsigneeAddress(name: string, streetAndNumber: string, city: string, postCode: string, country: string): Promise<void> {
        await this.consignee.enterAddress({ name, streetAndNumber, city, postCode, country });
    }

    async inputExporterEORI(exporterEORI: string): Promise<void> {
        await this.exporter.enterEori(exporterEORI);
    }

    async inputExporterAddress(name: string, streetAndNumber: string, city: string, postCode: string, country: string): Promise<void> {
        await this.exporter.enterAddress({ name, streetAndNumber, city, postCode, country });
    }

    // ===================== Seller (same as exporter?) =====================

    async selectSellerSameAsExporterYes(): Promise<void> {
        await this.sellerSameAsExporterYesOption.check();
    }

    async selectSellerSameAsExporterNo(): Promise<void> {
        await this.sellerSameAsExporterNoOption.check();
    }

    async inputSellerEORI(sellerEORI: string): Promise<void> {
        await this.seller.enterEori(sellerEORI);
    }

    async inputSellerAddress(name: string, streetAndNumber: string, city: string, postCode: string, country: string): Promise<void> {
        await this.seller.enterAddress({ name, streetAndNumber, city, postCode, country });
    }

    // ===================== Consignment references =====================

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

    // ===================== Containers =====================

    async selectGoodsCrossEUBorderYes(): Promise<void> {
        await this.goodsCrossEUBorderYesOption.check();
        await this.clickContinueButton();
    }

    async selectGoodsCrossEUBorderNo(): Promise<void> {
        await this.goodsCrossEUBorderNoOption.check();
        await this.clickContinueButton();
    }

    async selectAllGoodsInSameContainersYes(): Promise<void> {
        await this.allGoodsInSameContainersYesOption.check();
        await this.clickContinueButton();
    }

    async selectAllGoodsInSameContainersNo(): Promise<void> {
        await this.allGoodsInSameContainersNoOption.check();
        await this.clickContinueButton();
    }

    async inputContainerIdentificationNumber(containerIdentifierNumber: string): Promise<void> {
        await this.containerIdentificationNumberInput.fill(containerIdentifierNumber);
        await this.clickContinueButton();
    }

}
