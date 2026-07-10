import { ReportLog } from '../core/report/report-log';
import {ConsignmentOverviewPage} from "../page-object/consignment-overview-page";
import {GoodsDeclarePage} from "../page-object/goods-declare-page";
import  {GoodsData} from  "../test-data/goods-data";


export class AddNewGoodsItemFlow {
    constructor(
        private readonly consignmentOverviewPage: ConsignmentOverviewPage,
        private readonly goodsDeclarePage: GoodsDeclarePage,
    ) { }

    async addNewGoodsItem(input: GoodsData): Promise<void> {
        await ReportLog.step('Add new goods item', async () => {
            await this.clickNewGoodsRecordAtOverview();
            await this.fillGoodsDomesticStatusFlow(input);
            await this.fillControlledAndDangerousGoodsFlow(input);
            await this.fillCommodityCodeAndAdditionalCommodityCodeFlow(input);
            await this.fillPackageAndWeightInformationFlow(input);
            await this.fillProcedureAndAdditionalProcedureCodeFlow(input);
            await this.fillInvoiceDetailsFlow(input);
            await this.finishGoodsItemDeclaration();
        });
    }

    private async clickNewGoodsRecordAtOverview(): Promise<void> {
        await ReportLog.step('Click New Goods Record', async () => {
            await this.consignmentOverviewPage.clickNewGoodsRecord();
        });
    }

    private async fillGoodsDomesticStatusFlow(input: GoodsData): Promise<void> {
        await ReportLog.step('Select Goods Domestic Status And Additional Risk Status', async () => {
            await this.goodsDeclarePage.selectGoodsDomesticStatus(input.goodsDomesticStatus);
            await this.goodsDeclarePage.selectAdditionalRiskStatus(input.additionalRiskStatus);
        });
    }

    private async fillControlledAndDangerousGoodsFlow(input: GoodsData): Promise<void> {
        await ReportLog.step('Define if the goods are controlled or dangerous', async () => {
            if (input.areGooodsControlled) {
                await this.goodsDeclarePage.selectGoodsControlledYes();
            } else {
                await this.goodsDeclarePage.selectGoodsControlledNo();
            }

            // The dangerous goods codes screen only appears on the "yes" answer.
            if (input.isDangerousGoods) {
                await this.goodsDeclarePage.selectDangerousGoodsYes();
                await this.goodsDeclarePage.inputDangerousGoodsCodes(input.dangerousGoodsCodes);
            } else {
                await this.goodsDeclarePage.selectDangerousGoodsNo();
            }
        });
    }

    private async fillCommodityCodeAndAdditionalCommodityCodeFlow(input: GoodsData): Promise<void> {
        await ReportLog.step('Fill Commodity Information', async () => {
            await this.goodsDeclarePage.fillCommodityInformation(input.commodityCode, input.goodsDescription, input.countryOfOrigin, input.supplementaryUnits);
            await this.goodsDeclarePage.enterAdditionalCommodityCodes(input.cusCode, input.taricAdditionalCode, input.nationalAdditionalCode);
        });
    }

    private async fillPackageAndWeightInformationFlow(input: GoodsData): Promise<void> {
        await ReportLog.step('Fill Package Information', async () => {
            await this.goodsDeclarePage.enterPackagingDetails(input.shippingMarks, input.typeOfPackages, input.numberOfPackages, input.numberOfPieces);
            await this.goodsDeclarePage.enterWeightInformation(input.grossMass, input.netMass);
        });
    }

    private async fillProcedureAndAdditionalProcedureCodeFlow(input: GoodsData): Promise<void> {
        await ReportLog.step('Fill Procedure Codes', async () => {
            await this.goodsDeclarePage.selectGoodsProcedureCode(input.goodsProcedureCode);
            await this.goodsDeclarePage.selectAdditionalProcedureCode(input.additionalProcedureCode);
        });
    }

    private async fillInvoiceDetailsFlow(input: GoodsData): Promise<void> {
        await ReportLog.step('Fill Invoice Details', async () => {
            await this.goodsDeclarePage.enterInvoiceDetails(input.itemPriceAmount, input.invoiceNumber, input.itemCurrency );
        });
    }

    private async finishGoodsItemDeclaration(): Promise<void> {
        await ReportLog.step('Finish Goods Item Declaration', async () => {
            await this.goodsDeclarePage.clickFinishButton();
        });
    }
}