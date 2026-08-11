import { ConsignmentOverviewPage } from '../page-object/consignment-overview-page';
import { GoodsDeclarePage } from '../page-object/goods-declare-page';
import { GoodsData } from '../test-data/goods-data';
import { ReportLog } from '../core/report/report-log';
import { GoodsItemCommonSteps } from './common-flows/goods-item-common-steps';

/**
 * One goods item on the FFD standalone journey.
 *
 * The screen list is a fact about this journey, so it is the method order below. FFD
 * diverges most at goods level and on several answers at once; that branching goes
 * here as it is modelled, which is why FFD owns its own goods wizard rather than
 * adding flags to a shared one.
 *
 * Reuses GoodsDeclarePage directly rather than the branch-heavy ENS
 * AddNewGoodsItemFlow, whose branching is the ENS journey's, not this one's.
 *
 * Steps shared with other goods-item flows (standalone packaging) are delegated
 * to GoodsItemCommonSteps.
 */
export class AddNewFfdStandaloneGoodsItemFlow {
    constructor(
        private readonly consignmentOverviewPage: ConsignmentOverviewPage,
        private readonly goodsDeclarePage: GoodsDeclarePage,
        private readonly commonSteps: GoodsItemCommonSteps =
            new GoodsItemCommonSteps(goodsDeclarePage),
    ) { }

    async addNewFfdStandaloneGoodsItem(input: GoodsData): Promise<void> {
        await ReportLog.step('Add new FFD standalone goods item', async () => {
            await this.consignmentOverviewPage.openNewGoodsRecord();
            await this.goodsDeclarePage.selectGoodsProcedureCode(input.goodsProcedureCode);
            await this.goodsDeclarePage.selectAdditionalProcedureCode(input.additionalProcedureCode);
            await this.goodsDeclarePage.enterGoodsDescriptionAndCommodityCode(input.goodsDescription, input.commodityCode);
            await this.commonSteps.fillStandalonePackaging(input);
            await this.goodsDeclarePage.enterWeightInformation(input.grossMass, input.netMass);
            await this.goodsDeclarePage.enterItemPrice(input.itemPriceAmount);
            await this.goodsDeclarePage.enterCountryOfOrigin(input.countryOfOrigin);
            await this.goodsDeclarePage.clickFinishButton();
        });
    }
}
