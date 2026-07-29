import { ConsignmentOverviewPage } from '../page-object/consignment-overview-page';
import { GoodsDeclarePage } from '../page-object/goods-declare-page';
import { GoodsData } from '../test-data/goods-data';
import { ReportLog } from '../core/report/report-log';

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
 */
export class AddNewSfdStandaloneGoodsItemFlow {
    constructor(
        private readonly consignmentOverviewPage: ConsignmentOverviewPage,
        private readonly goodsDeclarePage: GoodsDeclarePage,
    ) { }

    async addNewSfdStandaloneGoodsItem(input: GoodsData): Promise<void> {
        await ReportLog.step('Add new SFD standalone goods item', async () => {
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
