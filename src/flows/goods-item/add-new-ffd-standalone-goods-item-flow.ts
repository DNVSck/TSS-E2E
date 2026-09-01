import { ReportLog } from '../../core/report/report-log';
import { GoodsData } from '../../test-data/goods-data';
import { GoodsItemSteps } from './goods-item-steps';

/**
 * One goods item on the FFD standalone journey.
 *
 * FFD diverges most at goods level and on several answers at once; that branching
 * goes here as it is modelled, which is why FFD keeps its own spine even though it
 * currently visits the same screens as SFD.
 */
export class AddNewFfdStandaloneGoodsItemFlow {
    constructor(private readonly steps: GoodsItemSteps) { }

    async addNewFfdStandaloneGoodsItem(input: GoodsData): Promise<void> {
        await ReportLog.step('Add new FFD standalone goods item', async () => {
            await this.steps.openNewGoodsRecord();
            await this.steps.selectGoodsProcedureCode(input);
            await this.steps.selectAdditionalProcedureCode(input);
            await this.steps.selectSupervisingCustomsOfficeIfAsked(input);
            await this.steps.enterWarehouseIdentifierIfAsked(input);
            await this.steps.enterCommodityInformation(input);
            await this.steps.enterStandalonePackagingDetails(input);
            await this.steps.enterWeightInformation(input);
            await this.steps.enterItemPrice(input);
            await this.steps.enterCountryOfOrigin(input);
            await this.steps.finishGoodsItemDeclaration();
        });
    }
}
