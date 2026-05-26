import { MovementOverviewPage } from "../page-object/movement-overview-page";
import { ConsignmentDeclarePage } from "../page-object/consignment-declare-page";
import { ReportLog } from '../core/report/report-log';
import { ConsignmentData } from "../test-data/consignment-data";
import { ConsignmentOverviewPage } from "../page-object/consignment-overview-page";

export class AddNewConsignmentFlow {
    constructor(
        private readonly movementOverviewPage: MovementOverviewPage,
        private readonly consignmentDeclarePage: ConsignmentDeclarePage,
        private readonly consignmentOverviewPage: ConsignmentOverviewPage
    ) { }

    async AddNewENSConsignment(input: ConsignmentData): Promise<void> {
        await this.clickNewENSConsignmentAtOverview();
        await this.fillImporterInformation(input);
        await this.fillBuyerInformation(input);
        await this.fillGoodsInformation(input);
        await this.fillTransportAndDestinationDetails(input);
        await this.fillWarehouseIdentifierInformation(input);
        await this.fillConsignorInformation(input);
        await this.fillConsigneeInformation(input);
        await this.fillExporterInformation(input);
        await this.fillSellerInformation(input);
        await this.fillConsignmentReference(input);
        await this.fillBorderAndContainerInformation(input);
        await this.finishConsignmentDeclaration();
    }

    private async clickNewENSConsignmentAtOverview(): Promise<void> {
        await ReportLog.step('Click New ENS Consignment', async () => {
            await this.movementOverviewPage.clickNewENSConsignment();
        });
    }

    private async fillImporterInformation(input: ConsignmentData): Promise<void> {
        await ReportLog.step('Fill Importer information', async () => {
            await this.consignmentDeclarePage.inputImporterEORI(input.importerEORI);
            await this.consignmentDeclarePage.inputImporterAddress(
                input.importerName,
                input.importerStreetAndNumber,
                input.importerCity,
                input.importerPostCode,
                input.importerCountryCode
            ); 
        });
    }

    private async fillBuyerInformation(input: ConsignmentData): Promise<void> {
        await ReportLog.step('Fill Buyer information', async () => {
            await this.consignmentDeclarePage.chooseBuyerInvolvement(input.isBuyerSameAsImporter, input.buyerEORI, input.buyerName, input.buyerStreetAndNumber, 
                input.buyerCity, input.buyerPostCode, input.buyerCountryCode);
        });
    }

    private async fillGoodsInformation(input: ConsignmentData): Promise<void> {
        await ReportLog.step('Fill Goods information', async () => {
            await this.consignmentDeclarePage.defineGoodsAtRisk(input.isGoodsAtRisk, input.useIMMI);
            await this.consignmentDeclarePage.defineControlledGoods(input.isControlledGoods);
        });
    }

    private async fillTransportAndDestinationDetails(input: ConsignmentData): Promise<void> {
        await ReportLog.step('Fill Transport and destination details', async () => {
            await this.consignmentDeclarePage.fillTransportAndDestinationDetails(input.transportDocumentNumber, input.goodsDomesticStatus, input.destinationCountryCode);
        });
    }

    private async fillWarehouseIdentifierInformation(input: ConsignmentData): Promise<void> {
        await ReportLog.step('Fill Warehouse identifier information', async () => {
            await this.consignmentDeclarePage.inputWarehouseIdentifier(input.warehouseIdentifier);
        });
    }

    private async fillConsignorInformation(input: ConsignmentData): Promise<void> {
        await ReportLog.step('Fill Consignor information', async () => {
            await this.consignmentDeclarePage.inputConsignorInformation(
                input.consignorEORI,
                input.consignorName,
                input.consignorStreetAndNumber,
                input.consignorCity,
                input.consignorPostCode,
                input.consignorCountryCode
            );
        });
    }

    private async fillConsigneeInformation(input: ConsignmentData): Promise<void> {
        await ReportLog.step('Fill Consignee information', async () => {
            await this.consignmentDeclarePage.inputConsigneeInformation(
                input.consigneeEORI,
                input.consigneeName,
                input.consigneeStreetAndNumber,
                input.consigneeCity,
                input.consigneePostCode,
                input.consigneeCountryCode
            );
        });
    }

    private async fillExporterInformation(input: ConsignmentData): Promise<void> {
        await ReportLog.step('Fill Exporter information', async () => {
            await this.consignmentDeclarePage.inputExporterInformation(
                input.exporterEORI,
                input.exporterName,
                input.exporterStreetAndNumber,
                input.exporterCity,
                input.exporterPostCode,
                input.exporterCountryCode
            );
        });
    }

    private async fillSellerInformation(input: ConsignmentData): Promise<void> {
        await ReportLog.step('Fill Seller information', async () => {
            await this.consignmentDeclarePage.chooseSellerInvolvement(input.isSellerSameAsExporter, input.sellerEORI, input.sellerName, input.sellerStreetAndNumber, 
                input.sellerCity, input.sellerPostCode, input.sellerCountryCode);
        });
    }

    private async fillConsignmentReference(input: ConsignmentData): Promise<void> {
        await ReportLog.step('Fill Consignment reference (Optional fields)', async () => {
            await this.consignmentDeclarePage.inputConsignmentReference(input.consignmentDescription!, input.traderReference!);
        });
    }

    private async fillBorderAndContainerInformation(input: ConsignmentData): Promise<void> {
        await ReportLog.step('Fill Border and container information', async () => {
            await this.consignmentDeclarePage.chooseGoodsCrossEUBorder(input.isGoodsCrossEUBorder, input.isSameContainer, input.containerIdentifierNumber);
        });
    }

    private async finishConsignmentDeclaration(): Promise<void> {
        await ReportLog.step('Finish consignment declaration', async () => {
            await this.consignmentDeclarePage.clickFinishButton();
        });
    }

}
                
