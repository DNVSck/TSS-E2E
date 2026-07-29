import { ConsignmentOverviewPage } from '../page-object/consignment-overview-page';
import { GoodsDeclarePage } from '../page-object/goods-declare-page';
import { GoodsData } from '../test-data/goods-data';
import { ReportLog } from '../core/report/report-log';

/**
 * One goods item on the IMMI standalone journey.
 *
 * The screen list is a fact about this journey, so it is the method order below.
 * IMMI is the journey that asks about TGP at goods level; that screen goes here when
 * it is modelled, which is why IMMI owns its own goods wizard rather than sharing one
 * behind a flag.
 *
 * Reuses GoodsDeclarePage directly rather than the branch-heavy ENS
 * AddNewGoodsItemFlow, whose controlled/dangerous/container branching does not apply.
 */
export class AddNewImmiStandaloneGoodsItemFlow {
    constructor(
        private readonly consignmentOverviewPage: ConsignmentOverviewPage,
        private readonly goodsDeclarePage: GoodsDeclarePage,
    ) { }

    async addNewImmiStandaloneGoodsItem(input: GoodsData): Promise<void> {
        await ReportLog.step('Add new IMMI standalone goods item', async () => {
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
