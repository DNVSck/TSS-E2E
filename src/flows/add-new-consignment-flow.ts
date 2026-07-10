import { MovementOverviewPage } from "../page-object/movement-overview-page";
import { ConsignmentDeclarePage } from "../page-object/consignment-declare-page";
import { ReportLog } from '../core/report/report-log';
import { ConsignmentData } from "../test-data/consignment-data";

export class AddNewConsignmentFlow {
    constructor(
        private readonly movementOverviewPage: MovementOverviewPage,
        private readonly consignmentDeclarePage: ConsignmentDeclarePage,
    ) { }

    async addNewEnsConsignment(input: ConsignmentData): Promise<void> {
        await ReportLog.step('Add new ENS consignment', async () => {
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
        });
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
            if (input.isBuyerSameAsImporter) {
                await this.consignmentDeclarePage.selectBuyerSameAsImporterYes();
            } else {
                await this.consignmentDeclarePage.selectBuyerSameAsImporterNo();
                await this.consignmentDeclarePage.fillBuyerDetails(
                    input.buyerEORI,
                    input.buyerName,
                    input.buyerStreetAndNumber,
                    input.buyerCity,
                    input.buyerPostCode,
                    input.buyerCountryCode
                );
            }
            await this.consignmentDeclarePage.clickContinueButton();
        });
    }

    private async fillGoodsInformation(input: ConsignmentData): Promise<void> {
        await ReportLog.step('Fill Goods information', async () => {
            if (input.isGoodsAtRisk) {
                await this.consignmentDeclarePage.selectGoodsAtRiskYes();
            } else {
                await this.consignmentDeclarePage.selectGoodsAtRiskNo();
            }

            if (input.useIMMI) {
                await this.consignmentDeclarePage.selectUseIMMIYes();
            } else {
                await this.consignmentDeclarePage.selectUseIMMINo();
            }

            if (input.isControlledGoods) {
                await this.consignmentDeclarePage.selectControlledGoodsYes();
            } else {
                await this.consignmentDeclarePage.selectControlledGoodsNo();
            }
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
            await this.consignmentDeclarePage.inputConsignorEORI(input.consignorEORI);
            await this.consignmentDeclarePage.inputConsignorAddress(
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
            await this.consignmentDeclarePage.inputConsigneeEORI(input.consigneeEORI);
            await this.consignmentDeclarePage.inputConsigneeAddress(
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
            await this.consignmentDeclarePage.inputExporterEORI(input.exporterEORI);
            await this.consignmentDeclarePage.inputExporterAddress(
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
            if (input.isSellerSameAsExporter) {
                await this.consignmentDeclarePage.selectSellerSameAsExporterYes();
            } else {
                await this.consignmentDeclarePage.selectSellerSameAsExporterNo();
                await this.consignmentDeclarePage.inputSellerEORI(input.sellerEORI);
                await this.consignmentDeclarePage.inputSellerAddress(
                    input.sellerName,
                    input.sellerStreetAndNumber,
                    input.sellerCity,
                    input.sellerPostCode,
                    input.sellerCountryCode
                );
            }

            await this.consignmentDeclarePage.clickContinueButton();
        });
    }

    private async fillConsignmentReference(input: ConsignmentData): Promise<void> {
        await ReportLog.step('Fill Consignment reference (Optional fields)', async () => {
            await this.consignmentDeclarePage.inputConsignmentReference(input.consignmentDescription!, input.traderReference!);
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
                await this.consignmentDeclarePage.inputContainerIdentificationNumber(input.containerIdentifierNumber);
            } else {
                await this.consignmentDeclarePage.selectAllGoodsInSameContainersNo();
            }
        });
    }

    private async finishConsignmentDeclaration(): Promise<void> {
        await ReportLog.step('Finish consignment declaration', async () => {
            await this.consignmentDeclarePage.clickFinishButton();
        });
    }

}
                
