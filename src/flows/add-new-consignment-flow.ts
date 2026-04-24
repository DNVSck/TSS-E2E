import { DeclarationOverviewPage } from "../page-object/declaration-overview-page";
import { ConsignmentDeclarePage } from "../page-object/consignment-declare-page";
import { ReportLog } from '../core/report/report-log';
import { ConsignmentData } from "../test-data/consignment";

export class AddNewConsignmentFlow {
    constructor(
        private readonly declarationOverviewPage: DeclarationOverviewPage,
        private readonly consignmentDeclarePage: ConsignmentDeclarePage
    ) { }

    async AddNewENSConsignment(input: ConsignmentData): Promise<void> {
    
        await ReportLog.step('Click New ENS Consignment', async () => {
            await this.declarationOverviewPage.clickNewENSConsignment();
        });

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

        await ReportLog.step('Fill Buyer information', async () => {
            await this.consignmentDeclarePage.chooseBuyerInvolvement(input.isBuyerSameAsImporter, input.buyerEORI, input.buyerName, input.buyerStreetAndNumber, 
                input.buyerCity, input.buyerPostCode, input.buyerCountryCode);
        });

        await ReportLog.step('Fill Goods information', async () => {
            await this.consignmentDeclarePage.defineGoodsAtRisk(input.isGoodsAtRisk, input.useIMMI);
            await this.consignmentDeclarePage.defineControlledGoods(input.isControlledGoods);
        });

        await ReportLog.step('Fill Transport and destination details', async () => {
            await this.consignmentDeclarePage.fillTransportAndDestinationDetails(input.transportDocumentNumber, input.GoodsDomesticStatus, input.destinationCountryCode);
        });

        await ReportLog.step('Fill Warehouse identifier information', async () => {
            await this.consignmentDeclarePage.inputWarehouseIdentifier(input.warehouseIdentifier);
        });

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

        await ReportLog.step('Fill Seller information', async () => {
            await this.consignmentDeclarePage.chooseSellerInvolvement(input.isSellerSameAsExporter, input.sellerEORI, input.sellerName, input.sellerStreetAndNumber, 
                input.sellerCity, input.sellerPostCode, input.sellerCountryCode);
        });

        await ReportLog.step('Fill Consignment reference', async () => {
            await this.consignmentDeclarePage.inputConsignmentReference(input.consignmentDescription, input.traderReference);
        });

        await ReportLog.step('Fill Border and container information', async () => {
            await this.consignmentDeclarePage.chooseGoodsCrossEUBorder(input.isGoodsCrossEUBorder, input.isSameContainer, input.containerIdentifierNumber);
        });

        await ReportLog.step('Finish consignment declaration', async () => {
            await this.consignmentDeclarePage.clickFinishButton();
        });

    }

}
                