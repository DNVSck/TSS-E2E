import { ReportLog } from '../../core/report/report-log';
import { GoodsData } from '../../test-data/goods-data';
import { GoodsItemSteps } from './goods-item-steps';

/**
 * One goods item on the SFD standalone journey.
 *
 * SFD is the journey that reaches the container screens at goods level — shown when
 * the consignment declared that its goods are NOT all in the same container. That
 * branch goes here when it is modelled, which is why SFD keeps its own spine even
 * though it currently visits the same screens as FFD.
 */
export class AddNewSfdStandaloneGoodsItemFlow {
    constructor(private readonly steps: GoodsItemSteps) { }

    async addNewSfdStandaloneGoodsItem(input: GoodsData): Promise<void> {
        await ReportLog.step('Add new SFD standalone goods item', async () => {
            await this.steps.openNewGoodsRecord();
            await this.steps.selectGoodsProcedureCode(input);
            await this.steps.selectAdditionalProcedureCode(input);
            await this.steps.enterCommodityInformation(input);
            await this.steps.enterStandalonePackagingDetails(input);
            await this.steps.enterWeightInformation(input);
            await this.steps.enterItemPrice(input);
            await this.steps.enterCountryOfOrigin(input);
            await this.steps.finishGoodsItemDeclaration();
        });
    }
}
