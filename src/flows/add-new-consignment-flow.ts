import { MovementOverviewPage } from "../page-object/movement-overview-page";
import { ConsignmentDeclarePage } from "../page-object/consignment-declare-page";
import { PartyAddress } from "../page-object/components/party-block";
import { ReportLog } from '../core/report/report-log';
import { ConsignmentData } from "../test-data/consignment-data";


export class AddNewConsignmentFlow {
    constructor(
        private readonly movementOverviewPage: MovementOverviewPage,
        private readonly consignmentDeclarePage: ConsignmentDeclarePage,
    ) { }

  
    async addNewEnsConsignment(input: ConsignmentData): Promise<void> {
        await ReportLog.step('Add new ENS consignment', async () => {
            // The exporter (+ "seller same as exporter?") and the invoice-currency
            // screen are one coupled pair: both appear on the IMMI and controlled-goods
            // SFD journeys, and both are absent on the two reduced journeys — ENS-only
            // and EIDR (SFD with controlled goods = No), which ask for the seller
            // directly and never reach invoice currency.
            const hasExporterAndCurrency =
                !input.isEnsOnly && (input.useIMMI || input.isControlledGoods);

            await this.clickNewENSConsignmentAtOverview();
            await this.declareEnsOnlyChoice(input);

            if (input.isEnsOnly) {
                await this.fillBuyerEoriAndAddress(input);
            } else {
                await this.fillImporterInformation(input);
                await this.fillBuyerInformation(input);
                await this.declareUseImmi(input);
            }

            await this.fillTransportAndDestinationDetails(input);
            await this.fillConsignorInformation(input);
            await this.fillConsigneeInformation(input);
            await this.fillExporterAndSeller(input, hasExporterAndCurrency);
            await this.fillTraderReference(input);
            await this.fillBorderAndContainerInformation(input);

            if (hasExporterAndCurrency) {
                await this.fillInvoiceCurrency(input);
            }

            await this.finishConsignmentDeclaration();
        });
    }

    // ===================== Journey fork =====================

    private async declareEnsOnlyChoice(input: ConsignmentData): Promise<void> {
        await ReportLog.step('Answer "Do you wish to complete ENS only?"', async () => {
            if (!input.isEnsOnly) {
                await this.consignmentDeclarePage.selectEnsOnlyNo();
                return;
            }

            await this.consignmentDeclarePage.selectEnsOnlyYes();

            if (!input.ensOnlyReason) {
                throw new Error('Test data for an ENS-only consignment must set "ensOnlyReason".');
            }
            await this.consignmentDeclarePage.selectEnsOnlyReason(input.ensOnlyReason);
        });
    }

    /** Declining IMMI adds the controlled-goods question; accepting it does not. */
    private async declareUseImmi(input: ConsignmentData): Promise<void> {
        await ReportLog.step('Answer "Do you want to use IMMI?"', async () => {
            if (input.useIMMI) {
                await this.consignmentDeclarePage.selectUseIMMIYes();
                return;
            }

            await this.consignmentDeclarePage.selectUseIMMINo();

            if (input.isControlledGoods) {
                await this.consignmentDeclarePage.selectControlledGoodsYes();
            } else {
                await this.consignmentDeclarePage.selectControlledGoodsNo();
            }
        });
    }

    // ===================== Importer and buyer =====================

    /**
     * The importer has no address screen: its EORI must already exist in TSS, and
     * an unknown one is rejected on the spot.
     */
    private async fillImporterInformation(input: ConsignmentData): Promise<void> {
        await ReportLog.step('Fill Importer information', async () => {
            await this.consignmentDeclarePage.inputImporterEORI(input.importerEORI);
        });
    }

    /**
     * "Is the buyer's EORI the same as the importer's?" carries only the radio.
     * Answering yes skips the buyer's EORI screen, but the app still asks for the
     * buyer's name and address.
     */
    private async fillBuyerInformation(input: ConsignmentData): Promise<void> {
        await ReportLog.step('Fill Buyer information', async () => {
            if (input.isBuyerSameAsImporter) {
                await this.consignmentDeclarePage.selectBuyerSameAsImporterYes();
                await this.consignmentDeclarePage.clickContinueButton();
                await this.consignmentDeclarePage.inputBuyerAddress(buyerAddress(input));
                return;
            }

            await this.consignmentDeclarePage.selectBuyerSameAsImporterNo();
            await this.consignmentDeclarePage.clickContinueButton();
            await this.consignmentDeclarePage.inputBuyerDetails(input.buyerEORI, buyerAddress(input));
        });
    }

    /** ENS-only has no importer to compare against, so the buyer is asked directly. */
    private async fillBuyerEoriAndAddress(input: ConsignmentData): Promise<void> {
        await ReportLog.step('Fill Buyer information', async () => {
            await this.consignmentDeclarePage.inputBuyerDetails(input.buyerEORI, buyerAddress(input));
        });
    }

    // ===================== Transport =====================

    /** Three journeys, three screens: only the document number is common. */
    private async fillTransportAndDestinationDetails(input: ConsignmentData): Promise<void> {
        await ReportLog.step('Fill Transport and destination details', async () => {
            if (input.isEnsOnly) {
                await this.consignmentDeclarePage.fillEnsOnlyTransportAndDestinationDetails(
                    input.transportDocumentNumber,
                    input.destinationCountryCode
                );
                return;
            }

            // IMMI is only ever offered on the full journey, so this is false for ENS-only.
            if (input.useIMMI) {
                await this.consignmentDeclarePage.fillImmiTransportAndDestinationDetails(
                    input.transportDocumentNumber
                );
                return;
            }

            await this.consignmentDeclarePage.fillSfdTransportAndDestinationDetails(
                input.transportDocumentNumber,
                input.goodsDomesticStatus
            );
        });
    }

    // ===================== Trade parties =====================

    private async fillConsignorInformation(input: ConsignmentData): Promise<void> {
        await ReportLog.step('Fill Consignor information', async () => {
            await this.consignmentDeclarePage.inputConsignorDetails(input.consignorEORI, consignorAddress(input));
        });
    }

    private async fillConsigneeInformation(input: ConsignmentData): Promise<void> {
        await ReportLog.step('Fill Consignee information', async () => {
            await this.consignmentDeclarePage.inputConsigneeDetails(input.consigneeEORI, consigneeAddress(input));
        });
    }

    /**
     * The exporter and the "seller same as exporter?" question appear only when the
     * journey has them (IMMI or controlled-goods SFD). The two reduced journeys —
     * ENS-only and EIDR (SFD with controlled goods = No) — skip the exporter and
     * ask for the seller directly. Whether the exporter's own address screen then
     * shows is decided at runtime by PartyBlock: a registered EORI skips it, a blank
     * or new one asks.
     */
    private async fillExporterAndSeller(input: ConsignmentData, hasExporter: boolean): Promise<void> {
        if (!hasExporter) {
            await ReportLog.step('Fill Seller information', async () => {
                await this.consignmentDeclarePage.inputSellerDetails(input.sellerEORI, sellerAddress(input));
            });
            return;
        }

        await ReportLog.step('Fill Exporter information', async () => {
            await this.consignmentDeclarePage.inputExporterDetails(input.exporterEORI, exporterAddress(input));
        });

        await ReportLog.step('Fill Seller information', async () => {
            if (input.isSellerSameAsExporter) {
                await this.consignmentDeclarePage.selectSellerSameAsExporterYes();
                await this.consignmentDeclarePage.clickContinueButton();
                return;
            }

            await this.consignmentDeclarePage.selectSellerSameAsExporterNo();
            await this.consignmentDeclarePage.clickContinueButton();
            await this.consignmentDeclarePage.inputSellerDetails(input.sellerEORI, sellerAddress(input));
        });
    }

    // ===================== Tail, shared by every journey =====================

    private async clickNewENSConsignmentAtOverview(): Promise<void> {
        await ReportLog.step('Click New ENS Consignment', async () => {
            await this.movementOverviewPage.clickNewENSConsignment();
        });
    }

    private async fillTraderReference(input: ConsignmentData): Promise<void> {
        await ReportLog.step('Fill Trader reference (Optional field)', async () => {
            await this.consignmentDeclarePage.inputTraderReference(input.traderReference ?? '');
        });
    }

    private async fillBorderAndContainerInformation(input: ConsignmentData): Promise<void> {
        await ReportLog.step('Fill Border and container information', async () => {
            // Container screens only appear when the goods cross the EU external border.
            if (!input.isGoodsCrossEUBorder) {
                await this.consignmentDeclarePage.selectGoodsCrossEUBorderNo();
                return;
            }

            await this.consignmentDeclarePage.selectGoodsCrossEUBorderYes();

            if (input.isSameContainer) {
                await this.consignmentDeclarePage.selectAllGoodsInSameContainersYes();
                await this.consignmentDeclarePage.fillContainerIdentification(
                    input.containerIdentifierNumber,
                    input.containerSize,
                    input.containerPackedStatus,
                    input.containerSupplierType
                );
            } else {
                await this.consignmentDeclarePage.selectAllGoodsInSameContainersNo();
            }
        });
    }

    private async fillInvoiceCurrency(input: ConsignmentData): Promise<void> {
        await ReportLog.step('Select Invoice currency', async () => {
            await this.consignmentDeclarePage.selectInvoiceCurrency(input.invoiceCurrency);
        });
    }

    private async finishConsignmentDeclaration(): Promise<void> {
        await ReportLog.step('Finish consignment declaration', async () => {
            await this.consignmentDeclarePage.clickFinishButton();
        });
    }
}

// The address screens take the same shape for every party, so the mapping from
// test data lives here rather than being spelled out at each call site.
const buyerAddress = (i: ConsignmentData): PartyAddress => ({
    name: i.buyerName, streetName: i.buyerStreetName, streetNumber: i.buyerStreetNumber,
    city: i.buyerCity, postCode: i.buyerPostCode, country: i.buyerCountryCode,
});

const consignorAddress = (i: ConsignmentData): PartyAddress => ({
    name: i.consignorName, streetName: i.consignorStreetName, streetNumber: i.consignorStreetNumber,
    city: i.consignorCity, postCode: i.consignorPostCode, country: i.consignorCountryCode,
});

const consigneeAddress = (i: ConsignmentData): PartyAddress => ({
    name: i.consigneeName, streetName: i.consigneeStreetName, streetNumber: i.consigneeStreetNumber,
    city: i.consigneeCity, postCode: i.consigneePostCode, country: i.consigneeCountryCode,
});

const exporterAddress = (i: ConsignmentData): PartyAddress => ({
    name: i.exporterName, streetName: i.exporterStreetName, streetNumber: i.exporterStreetNumber,
    city: i.exporterCity, postCode: i.exporterPostCode, country: i.exporterCountryCode,
});

const sellerAddress = (i: ConsignmentData): PartyAddress => ({
    name: i.sellerName, streetName: i.sellerStreetName, streetNumber: i.sellerStreetNumber,
    city: i.sellerCity, postCode: i.sellerPostCode, country: i.sellerCountryCode,
});
