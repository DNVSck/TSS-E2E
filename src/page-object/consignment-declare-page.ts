import { BasePage } from "./base-page";
import { Page, Locator } from '@playwright/test';
import { PartyBlock, PartyAddress } from './components/party-block';
import { selectDropdownValue, checkRadioByValue } from '../core/util/element-helper';

/** How long the app may take to leave the EORI screen after Continue. */
const EORI_OUTCOME_TIMEOUT_MS = 15_000;

export class ConsignmentDeclarePage extends BasePage {

    // Trade parties — the repeated "EORI + address" screens live in PartyBlock.
    private readonly importer: PartyBlock;
    private readonly buyer: PartyBlock;
    private readonly consignor: PartyBlock;
    private readonly consignee: PartyBlock;
    private readonly exporter: PartyBlock;
    private readonly seller: PartyBlock;

    // "Do you wish to complete ENS only?" — the first screen, on both journeys.
    private readonly ensOnlyYesOption: Locator;
    private readonly ensOnlyNoOption: Locator;

    // "Is the buyer the same as the importer?" / "Is the seller the same as the exporter?"
    private readonly buyerSameAsImporterYesOption: Locator;
    private readonly buyerSameAsImporterNoOption: Locator;
    private readonly sellerSameAsExporterYesOption: Locator;
    private readonly sellerSameAsExporterNoOption: Locator;

    // "Do you want to use IMMI?" / "Are these controlled goods?"
    private readonly useIMMIYesOption: Locator;
    private readonly useIMMINoOption: Locator;
    private readonly controlledGoodsYesOption: Locator;
    private readonly controlledGoodsNoOption: Locator;

    // Transport and destination details
    private readonly transportDocumentNumberInput: Locator;
    private readonly destinationCountryDropdown: Locator;

    // Trader reference
    private readonly traderReferenceInput: Locator;

    // Invoice currency — the last screen before "check your answers"
    private readonly invoiceCurrencyDropdown: Locator;

    // Containers when crossing the EU external border
    private readonly goodsCrossEUBorderYesOption: Locator;
    private readonly goodsCrossEUBorderNoOption: Locator;
    private readonly allGoodsInSameContainersYesOption: Locator;
    private readonly allGoodsInSameContainersNoOption: Locator;
    private readonly containerIdentificationNumberInput: Locator;
    private readonly containerSizeDropdown: Locator;

    constructor(page: Page) {
        super(page);

        this.importer = new PartyBlock(page, 'importer');
        this.buyer = new PartyBlock(page, 'buyer');
        this.consignor = new PartyBlock(page, 'consignor');
        this.consignee = new PartyBlock(page, 'consignee');
        this.exporter = new PartyBlock(page, 'exporter');
        this.seller = new PartyBlock(page, 'seller');

        this.ensOnlyYesOption = page.locator('input[name="isEnsOnly"][value="yes"]');
        this.ensOnlyNoOption = page.locator('input[name="isEnsOnly"][value="no"]');

        this.buyerSameAsImporterYesOption = page.locator("input#isImporterSameBuyer-yesNoOptions-yes");
        this.buyerSameAsImporterNoOption = page.locator("input#isImporterSameBuyer-yesNoOptions-no");
        this.sellerSameAsExporterYesOption = page.locator("input#isExporterSameSeller-yesNoOptions-yes");
        this.sellerSameAsExporterNoOption = page.locator("input#isExporterSameSeller-yesNoOptions-no");

        this.useIMMIYesOption = page.locator("input#useIMMI-immiOptions-yes");
        this.useIMMINoOption = page.locator("input#useIMMI-immiOptions-no");
        this.controlledGoodsYesOption = page.locator("input#containsControlledGoods-controlledGoodsOptions-yes");
        this.controlledGoodsNoOption = page.locator("input#containsControlledGoods-controlledGoodsOptions-no");

        this.transportDocumentNumberInput = page.locator("input#transportDocumentNumber");
        this.destinationCountryDropdown = page.locator("select#destinationCountry");

        this.traderReferenceInput = page.locator("input#traderReference");

        this.invoiceCurrencyDropdown = page.locator("select#invoiceCurrency");

        this.goodsCrossEUBorderYesOption = page.locator("input#isTransportingInContainers-yesNoOptions-yes");
        this.goodsCrossEUBorderNoOption = page.locator("input#isTransportingInContainers-yesNoOptions-no");
        this.allGoodsInSameContainersYesOption = page.locator("input#isTheSameContainer-yesNoOptions-yes");
        this.allGoodsInSameContainersNoOption = page.locator("input#isTheSameContainer-yesNoOptions-no");
        this.containerIdentificationNumberInput = page.locator("input#containerIdentifierNumber");
        this.containerSizeDropdown = page.locator("select#containerSize");
    }

    // ===================== "Do you wish to complete ENS only?" =====================

    async selectEnsOnlyYes(): Promise<void> {
        await this.ensOnlyYesOption.check();
        await this.clickContinueButton();
    }

    async selectEnsOnlyNo(): Promise<void> {
        await this.ensOnlyNoOption.check();
        await this.clickContinueButton();
    }

    /**
     * "Why do you only need an Entry Summary Declaration?" — reached only after
     * answering yes above. Driven by the reason's code (R1..R7), never its label,
     * which is translated.
     */
    async selectEnsOnlyReason(reasonCode: string): Promise<void> {
        await checkRadioByValue(this.page, 'ensOnlyReason', reasonCode);
        await this.clickContinueButton();
    }

    // ===================== Importer =====================

    /**
     * The importer's EORI must already exist in TSS: there is no address screen
     * for it, and an unknown EORI is rejected outright. Fail here with the app's
     * own message rather than several screens later.
     */
    async inputImporterEORI(importerEORI: string): Promise<void> {
        const outcome = await this.importer.submitEori(importerEORI, EORI_OUTCOME_TIMEOUT_MS);

        if (outcome === 'address') {
            throw new Error(
                `The importer address screen appeared, which means "${importerEORI}" is not ` +
                `registered in TSS. The importer's EORI must already exist there.`
            );
        }
    }

    /**
     * Enter a party's EORI, then supply the address when the app asks for it.
     * It asks whenever the EORI is blank or new; a registered EORI skips it.
     */
    private async enterPartyEoriAndAddress(party: PartyBlock, eori: string, address: PartyAddress): Promise<void> {
        if (await party.submitEori(eori, EORI_OUTCOME_TIMEOUT_MS) === 'address') {
            await party.enterAddress(address);
        }
    }

    // ===================== Buyer =====================

    async selectBuyerSameAsImporterYes(): Promise<void> {
        await this.buyerSameAsImporterYesOption.check();
    }

    async selectBuyerSameAsImporterNo(): Promise<void> {
        await this.buyerSameAsImporterNoOption.check();
    }

    /**
     * The buyer's own EORI screen. Reached from "not the same as the importer"
     * on the full journey, and directly on the ENS-only journey, which has no
     * importer to compare against.
     */
    async inputBuyerDetails(buyerEORI: string, address: PartyAddress): Promise<void> {
        await this.enterPartyEoriAndAddress(this.buyer, buyerEORI, address);
    }

    /**
     * Saying the buyer's EORI matches the importer's skips the buyer's EORI
     * screen, but the app still asks for the buyer's name and address.
     */
    async inputBuyerAddress(address: PartyAddress): Promise<void> {
        await this.buyer.enterAddress(address);
    }

    // ===================== Use IMMI / controlled goods =====================

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
    // The three journeys reach three different screens here, each named after the
    // app's own step. They share the document number and nothing else.

    /** `ens-only-transport-and-destination-details` */
    async fillEnsOnlyTransportAndDestinationDetails(transportDocumentNumber: string, destinationCountry: string): Promise<void> {
        await this.inputTransportDocumentNumber(transportDocumentNumber);
        await this.selectDestinationCountry(destinationCountry);
        await this.clickContinueButton();
    }

    /** `immi-transport-and-destination-details` — the document number alone. */
    async fillImmiTransportAndDestinationDetails(transportDocumentNumber: string): Promise<void> {
        await this.inputTransportDocumentNumber(transportDocumentNumber);
        await this.clickContinueButton();
    }

    /** `sfd-transport-and-destination-details` — reached when IMMI is declined. */
    async fillSfdTransportAndDestinationDetails(transportDocumentNumber: string, goodsDomesticStatusCode: string): Promise<void> {
        await this.inputTransportDocumentNumber(transportDocumentNumber);
        await checkRadioByValue(this.page, 'goodsDomesticStatus', goodsDomesticStatusCode);
        await this.clickContinueButton();
    }

    async inputTransportDocumentNumber(transportDocumentNumber: string): Promise<void> {
        await this.transportDocumentNumberInput.fill(transportDocumentNumber);
    }

    async selectDestinationCountry(country: string): Promise<void> {
        await selectDropdownValue(this.destinationCountryDropdown, country);
    }

    // ===================== Consignor / Consignee / Exporter =====================
    // A registered EORI skips the address screen; a blank or new one requires it.

    async inputConsignorDetails(consignorEORI: string, address: PartyAddress): Promise<void> {
        await this.enterPartyEoriAndAddress(this.consignor, consignorEORI, address);
    }

    async inputConsigneeDetails(consigneeEORI: string, address: PartyAddress): Promise<void> {
        await this.enterPartyEoriAndAddress(this.consignee, consigneeEORI, address);
    }

    async inputExporterDetails(exporterEORI: string, address: PartyAddress): Promise<void> {
        await this.enterPartyEoriAndAddress(this.exporter, exporterEORI, address);
    }

    // ===================== Seller (same as exporter?) =====================

    async selectSellerSameAsExporterYes(): Promise<void> {
        await this.sellerSameAsExporterYesOption.check();
    }

    async selectSellerSameAsExporterNo(): Promise<void> {
        await this.sellerSameAsExporterNoOption.check();
    }

    async inputSellerDetails(sellerEORI: string, address: PartyAddress): Promise<void> {
        await this.enterPartyEoriAndAddress(this.seller, sellerEORI, address);
    }

    // ===================== Trader reference =====================
    // Every journey reaches this screen, and every one of them asks for the
    // trader reference alone.

    async inputTraderReference(traderReference: string): Promise<void> {
        await this.traderReferenceInput.fill(traderReference);
        await this.clickContinueButton();
    }

    // ===================== Invoice currency =====================

    async selectInvoiceCurrency(currencyCode: string): Promise<void> {
        await selectDropdownValue(this.invoiceCurrencyDropdown, currencyCode);
        await this.clickContinueButton();
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

    /**
     * The "Container identification number" screen also asks for the size, the
     * packed status and who supplied the container. All four are mandatory.
     */
    async fillContainerIdentification(
        containerIdentifierNumber: string,
        containerSize: string,
        packedStatusCode: string,
        supplierTypeCode: string
    ): Promise<void> {
        await this.containerIdentificationNumberInput.fill(containerIdentifierNumber);
        await selectDropdownValue(this.containerSizeDropdown, containerSize);
        await checkRadioByValue(this.page, 'containerPackedStatus', packedStatusCode);
        await checkRadioByValue(this.page, 'containerSupplierType', supplierTypeCode);
        await this.clickContinueButton();
    }

}
