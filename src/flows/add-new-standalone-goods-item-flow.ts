import { ConsignmentOverviewPage } from '../page-object/consignment-overview-page';
import { GoodsDeclarePage } from '../page-object/goods-declare-page';
import { GoodsData } from '../test-data/goods-data';
import { ReportLog } from '../core/report/report-log';

/**
 * One goods item on the standalone journeys, via the shared
 * `base-standalone-goods-item-journey`. A short, fixed sequence (no TGP /
 * controlled / dangerous / container branching), so it reuses GoodsDeclarePage
 * directly rather than the branch-heavy ENS AddNewGoodsItemFlow.
 */
export class AddNewStandaloneGoodsItemFlow {
    constructor(
        private readonly consignmentOverviewPage: ConsignmentOverviewPage,
        private readonly goodsDeclarePage: GoodsDeclarePage,
    ) { }

    async addNewStandaloneGoodsItem(input: GoodsData): Promise<void> {
        await ReportLog.step('Add new standalone goods item', async () => {
            await this.consignmentOverviewPage.openNewGoodsRecord();
            await this.goodsDeclarePage.selectGoodsProcedureCode(input.goodsProcedureCode);
            await this.goodsDeclarePage.selectAdditionalProcedureCode(input.additionalProcedureCode);
            await this.goodsDeclarePage.enterGoodsDescriptionAndCommodityCode(input.goodsDescription, input.commodityCode);
            await this.fillPackaging(input);
            await this.goodsDeclarePage.enterWeightInformation(input.grossMass, input.netMass);
            await this.goodsDeclarePage.enterItemPrice(input.itemPriceAmount);
            await this.goodsDeclarePage.enterCountryOfOrigin(input.countryOfOrigin);
            await this.goodsDeclarePage.clickFinishButton();
        });
    }

    /**
     * The standalone packaging screen has no "number of pieces" field, so the three
     * fields it shows are filled individually rather than via the ENS
     * enterPackagingDetails helper (which also fills number of pieces).
     */
    private async fillPackaging(input: GoodsData): Promise<void> {
        await this.goodsDeclarePage.inputShippingMarks(input.shippingMarks);
        await this.goodsDeclarePage.selectTypeOfPackages(input.typeOfPackages);
        await this.goodsDeclarePage.inputNumberOfPackages(input.numberOfPackages);
        await this.goodsDeclarePage.clickContinueButton();
    }
}
