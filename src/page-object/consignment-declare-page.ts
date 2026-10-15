import { BasePage } from "./base-page";
import { Page, Locator } from '@playwright/test';
import { PartyBlock, PartyAddress, PartyType } from './components/party-block';
import { WarehouseScreen } from './components/warehouse-screen';
import {
    selectDropdownValue, checkRadioByValue, selectAutocompleteValue, typeAutocompleteValue,
    clickToLeaveScreen,
} from '../helper/element-helper';
import { BOOLEAN } from '../constant/radio-value-constant';

/** How long the app may take to leave the EORI screen after Continue. */
const EORI_OUTCOME_TIMEOUT_MS = 15_000;
const WAREHOUSE_SCREEN_TIMEOUT = 20_000;

export class ConsignmentDeclarePage extends BasePage {

    private readonly submitterEoriInput: Locator;
    private readonly linkedConsignmentInput: Locator;
    private readonly linkedConsignmentOptions: Locator;

    // Trade parties — the repeated "EORI + address" screens live in PartyBlock.
    private readonly importer: PartyBlock;
    private readonly warehouseScreen: WarehouseScreen;
    private readonly buyer: PartyBlock;
    private readonly consignor: PartyBlock;
    private readonly consignee: PartyBlock;
    private readonly exporter: PartyBlock;
    private readonly seller: PartyBlock;

    // "Do you wish to complete ENS only?" — the first screen, on both journeys.
    private readonly ensOnlyRadios: Locator;

    // "Is the buyer the same as the importer?" / "Is the seller the same as the exporter?"
    private readonly buyerSameAsImporterRadios: Locator;
    private readonly sellerSameAsExporterRadios: Locator;

    // "Do you want to use IMMI?" / "Are these controlled goods?"
    private readonly useIMMIRadios: Locator;
    private readonly controlledGoodsRadios: Locator;

    // Transport and destination details
    private readonly transportDocumentNumberInput: Locator;
    private readonly destinationCountryDropdown: Locator;

    // Trader reference
    private readonly traderReferenceInput: Locator;

    // Invoice currency — the last screen before "check your answers"
    private readonly invoiceCurrencyDropdown: Locator;

    // Containers when crossing the EU external border
    private readonly goodsCrossEUBorderRadios: Locator;
    private readonly allGoodsInSameContainersRadios: Locator;
    private readonly containerIdentificationNumberInput: Locator;
    private readonly containerSizeDropdown: Locator;
    private readonly ensOnlyReasonRadios: Locator;
    private readonly representationTypeRadios: Locator;
    private readonly goodsDomesticStatusRadios: Locator;
    private readonly containerPackedStatusRadios: Locator;
    private readonly containerSupplierTypeRadios: Locator;

    constructor(page: Page) {
        super(page);

        this.submitterEoriInput = page.locator('input#submitterEori');
        this.linkedConsignmentInput = page.locator('input#lrn');
        this.linkedConsignmentOptions = page.locator("[id^='lrn__option--']");

        this.importer = new PartyBlock(page, 'importer');
        this.warehouseScreen = new WarehouseScreen(page);
        this.buyer = new PartyBlock(page, 'buyer');
        this.consignor = new PartyBlock(page, 'consignor');
        this.consignee = new PartyBlock(page, 'consignee');
        this.exporter = new PartyBlock(page, 'exporter');
        this.seller = new PartyBlock(page, 'seller');

        this.ensOnlyRadios = page.locator('input[name="isEnsOnly"]');

        this.buyerSameAsImporterRadios = page.locator("input[name='isImporterSameBuyer']");
        this.sellerSameAsExporterRadios = page.locator("input[name='isExporterSameSeller']");

        this.useIMMIRadios = page.locator("input[name='useIMMI']");
        this.controlledGoodsRadios = page.locator("input[name='containsControlledGoods']");

        this.transportDocumentNumberInput = page.locator("input#transportDocumentNumber");
        this.destinationCountryDropdown = page.locator("select#destinationCountry");

        this.traderReferenceInput = page.locator("input#traderReference");

        this.invoiceCurrencyDropdown = page.locator("select#invoiceCurrency");

        this.goodsCrossEUBorderRadios = page.locator("input[name='isTransportingInContainers']");
        this.allGoodsInSameContainersRadios = page.locator("input[name='isTheSameContainer']");
        this.containerIdentificationNumberInput = page.locator("input#containerIdentifierNumber");
        this.containerSizeDropdown = page.locator("select#containerSize");
        this.ensOnlyReasonRadios = page.locator('input[name="ensOnlyReason"]');
        this.representationTypeRadios = page.locator('input[name="representationType"]');
        this.goodsDomesticStatusRadios = page.locator('input[name="goodsDomesticStatus"]');
        this.containerPackedStatusRadios = page.locator('input[name="containerPackedStatus"]');
        this.containerSupplierTypeRadios = page.locator('input[name="containerSupplierType"]');
    }

    async inputSubmitterEori(submitterEori: string): Promise<string[]> {
        await this.submitterEoriInput.fill(submitterEori);
        return this.continueAndReadErrors();
    }

    async selectConsignmentToLink(consignmentReference: string): Promise<void> {
        await selectAutocompleteValue(
            this.linkedConsignmentInput, this.linkedConsignmentOptions, consignmentReference
        );
        await clickToLeaveScreen(this.page, this.commonContinueButton);
    }

    async submitConsignmentToLink(consignmentReference: string): Promise<string[]> {
        await typeAutocompleteValue(this.linkedConsignmentInput, consignmentReference);
        return this.continueAndReadErrors();
    }

    // ===================== "Do you wish to complete ENS only?" =====================

    async selectEnsOnlyYes(): Promise<void> {
        await checkRadioByValue(this.ensOnlyRadios, BOOLEAN.YES);
        await this.clickContinueButton();
    }

    async selectEnsOnlyNo(): Promise<void> {
        await checkRadioByValue(this.ensOnlyRadios, BOOLEAN.NO);
        await this.clickContinueButton();
    }

    /**
     * "Why do you only need an Entry Summary Declaration?" — reached only after
     * answering yes above. Driven by the reason's code (R1..R7), never its label,
     * which is translated.
     */
    async selectEnsOnlyReason(reasonCode: string): Promise<void> {
        await checkRadioByValue(this.ensOnlyReasonRadios, reasonCode);
        await this.clickContinueButton();
    }

    // ===================== Importer =====================

    /**
     * The importer's EORI must already exist in TSS: there is no address screen
     * for it, and an unknown EORI is rejected outright. Fail here with the app's
     * own message rather than several screens later.
     */

    async selectRepresentationType(representationType: string): Promise<void> {
        await checkRadioByValue(this.representationTypeRadios, representationType);
        await this.clickContinueButton();
    }

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
        await party.enterEoriThenAddressIfAsked(eori, address, EORI_OUTCOME_TIMEOUT_MS);
    }

    async submitPartyEori(party: PartyType, eori: string): Promise<'accepted' | 'address'> {
        return this.blockFor(party).submitEori(eori, EORI_OUTCOME_TIMEOUT_MS);
    }

    /** Back out of a party's address screen onto the EORI screen it hangs off. */
    async returnToPartyEoriScreen(party: PartyType, eoriScreen: string): Promise<void> {
        await this.page.goto(eoriScreen, { waitUntil: 'domcontentloaded' });
        await this.blockFor(party).waitForEoriField(EORI_OUTCOME_TIMEOUT_MS);
    }

    private blockFor(party: PartyType): PartyBlock {
        const blocks: Partial<Record<PartyType, PartyBlock>> = {
            importer: this.importer,
            buyer: this.buyer,
            consignor: this.consignor,
            consignee: this.consignee,
            exporter: this.exporter,
            seller: this.seller,
        };
        const block = blocks[party];

        if (!block) {
            throw new Error(`The consignment wizard has no "${party}" party block.`);
        }
        return block;
    }

    // ===================== Buyer =====================

    async selectBuyerSameAsImporterYes(): Promise<void> {
        await checkRadioByValue(this.buyerSameAsImporterRadios, BOOLEAN.YES);
    }

    async selectBuyerSameAsImporterNo(): Promise<void> {
        await checkRadioByValue(this.buyerSameAsImporterRadios, BOOLEAN.NO);
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

    /**
     * The IMMI question is only put to an IMMI-authorised account; every other
     * account lands straight on the controlled-goods question instead. Waiting on
     * whichever radio arrives first tells the two screens apart without a delay.
     */
    async isUseImmiQuestionShown(): Promise<boolean> {
        await this.useIMMIRadios.or(this.controlledGoodsRadios).first().waitFor();
        return this.useIMMIRadios.first().isVisible();
    }

    async selectUseIMMIYes(): Promise<void> {
        await checkRadioByValue(this.useIMMIRadios, BOOLEAN.YES);
        await this.clickContinueButton();
    }

    async selectUseIMMINo(): Promise<void> {
        await checkRadioByValue(this.useIMMIRadios, BOOLEAN.NO);
        await this.clickContinueButton();
    }

    async selectControlledGoodsYes(): Promise<void> {
        await checkRadioByValue(this.controlledGoodsRadios, BOOLEAN.YES);
        await this.clickContinueButton();
    }

    async selectControlledGoodsNo(): Promise<void> {
        await checkRadioByValue(this.controlledGoodsRadios, BOOLEAN.NO);
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
        await checkRadioByValue(this.goodsDomesticStatusRadios, goodsDomesticStatusCode);
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

    /**
     * The exporter's address screen on its own, with no EORI screen before it.
     *
     * A supplementary declaration asks for the exporter this way: the frontier
     * declaration it inherits from never captured one, and the SD goes straight to
     * "Enter exporter profile" (route `exporter-journey~exporter-profile`) rather than
     * asking for an EORI and deciding from that. Same screen, same six fields - only
     * the way in differs, so it reuses the same party block.
     */
    async enterExporterProfile(address: PartyAddress): Promise<void> {
        await this.exporter.enterAddress(address);
    }

    // ===================== Seller (same as exporter?) =====================

    async selectSellerSameAsExporterYes(): Promise<void> {
        await checkRadioByValue(this.sellerSameAsExporterRadios, BOOLEAN.YES);
    }

    async selectSellerSameAsExporterNo(): Promise<void> {
        await checkRadioByValue(this.sellerSameAsExporterRadios, BOOLEAN.NO);
    }

    async enterSellerProfile(address: PartyAddress): Promise<void> {
        await this.seller.enterAddress(address);
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
        await checkRadioByValue(this.goodsCrossEUBorderRadios, BOOLEAN.YES);
        await this.clickContinueButton();
    }

    async selectGoodsCrossEUBorderNo(): Promise<void> {
        await checkRadioByValue(this.goodsCrossEUBorderRadios, BOOLEAN.NO);
        await this.clickContinueButton();
    }

    async selectAllGoodsInSameContainersYes(): Promise<void> {
        await checkRadioByValue(this.allGoodsInSameContainersRadios, BOOLEAN.YES);
        await this.clickContinueButton();
    }

    async selectAllGoodsInSameContainersNo(): Promise<void> {
        await checkRadioByValue(this.allGoodsInSameContainersRadios, BOOLEAN.NO);
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
        await checkRadioByValue(this.containerPackedStatusRadios, packedStatusCode);
        await checkRadioByValue(this.containerSupplierTypeRadios, supplierTypeCode);
        await this.clickContinueButton();
    }

    async enterWarehouseIdentifier(warehouseType: string, warehouseIdentifier: string): Promise<void> {
        await this.waitForScreenField(this.warehouseScreen.typeDropdown, 'warehouse identifier', WAREHOUSE_SCREEN_TIMEOUT);
        await this.warehouseScreen.fill(warehouseType, warehouseIdentifier);
        await this.clickContinueButton();
    }

}
