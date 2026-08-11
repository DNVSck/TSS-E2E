import { ConsignmentOverviewPage } from '../page-object/consignment-overview-page';
import { GoodsDeclarePage } from '../page-object/goods-declare-page';
import { GoodsData } from '../test-data/goods-data';
import { ReportLog } from '../core/report/report-log';
import { GoodsItemCommonSteps } from './common-flows/goods-item-common-steps';

/**
 * One goods item on the SFD standalone journey.
 *
 * The screen list is a fact about this journey, so it is the method order below. SFD
 * is the journey that reaches the container screens at goods level - shown when the
 * consignment declared that its goods are NOT all in the same container. That branch
 * goes here when it is modelled, which is why SFD owns its own goods wizard.
 *
 * Reuses GoodsDeclarePage directly rather than the branch-heavy ENS
 * AddNewGoodsItemFlow, whose controlled/dangerous/TGP branching does not apply.
 *
 * Steps shared with other goods-item flows (standalone packaging) are delegated
 * to GoodsItemCommonSteps.
 */
export class AddNewSfdStandaloneGoodsItemFlow {
    constructor(
        private readonly consignmentOverviewPage: ConsignmentOverviewPage,
        private readonly goodsDeclarePage: GoodsDeclarePage,
        private readonly commonSteps: GoodsItemCommonSteps =
            new GoodsItemCommonSteps(goodsDeclarePage),
    ) { }

    async addNewSfdStandaloneGoodsItem(input: GoodsData, options: { isControlledConsignment: boolean }): Promise<void> {
        await ReportLog.step('Add new SFD standalone goods item', async () => {
            await this.consignmentOverviewPage.openNewGoodsRecord();
            await this.goodsDeclarePage.selectGoodsProcedureCode(input.goodsProcedureCode);
            await this.goodsDeclarePage.selectAdditionalProcedureCode(input.additionalProcedureCode);
            if (options.isControlledConsignment) {
                // SFD path: controlled → dangerous (conditional) → country → commodity → packaging → weight (gross+net) → invoice
                await this.fillControlledGoods(input);
                await this.goodsDeclarePage.enterCountryOfOrigin(input.countryOfOrigin);
                await this.goodsDeclarePage.enterGoodsDescriptionAndCommodityCode(input.goodsDescription, input.commodityCode);
                await this.commonSteps.fillStandalonePackaging(input);
                await this.goodsDeclarePage.enterWeightInformation(input.grossMass, input.netMass);
                await this.goodsDeclarePage.enterItemPrice(input.itemPriceAmount);
            } else {
                // EIDR path: commodity → packaging → weight (gross only)
                await this.goodsDeclarePage.enterGoodsDescriptionAndCommodityCode(input.goodsDescription, input.commodityCode);
                await this.commonSteps.fillStandalonePackaging(input);
                await this.goodsDeclarePage.enterWeightInformation(input.grossMass);
            }
            await this.goodsDeclarePage.clickFinishButton();
        });
    }

    /**
     * Decision-tree rule: the goods-level controlled screen only appears when the
     * consignment-level controlled answer is Yes.
     */
    private async fillControlledGoods(input: GoodsData): Promise<void> {
        await ReportLog.step('Define if the goods are controlled', async () => {
            if (input.areGoodsControlled) {
                await this.goodsDeclarePage.selectGoodsControlledYes();
                await this.fillDangerousGoods(input);
            } else {
                await this.goodsDeclarePage.selectGoodsControlledNo();
            }
        });
    }

    /**
     * Decision-tree rule: dangerous-goods is only asked when goods are controlled.
     */
    private async fillDangerousGoods(input: GoodsData): Promise<void> {
        await ReportLog.step('Define if the goods are dangerous', async () => {
            if (input.isDangerousGoods) {
                await this.goodsDeclarePage.selectDangerousGoodsYes();
                await this.goodsDeclarePage.inputDangerousGoodsCodes(input.dangerousGoodsCodes);
            } else {
                await this.goodsDeclarePage.selectDangerousGoodsNo();
            }
        });
    }
}
