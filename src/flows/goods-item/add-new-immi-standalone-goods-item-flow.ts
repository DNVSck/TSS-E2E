import { ReportLog } from '../../core/report/report-log';
import { GoodsData } from '../../test-data/goods-data';
import { GoodsItemSteps } from './goods-item-steps';
import { hidesSupplementaryUnit } from '../../helper/procedure-code-helper';

/**
 * One goods item on the IMMI standalone journey.
 *
 * IMMI is the standalone journey that asks about TGP at goods level, and answering
 * yes puts the app on its own route: the record supplies the commodity code, the
 * goods description and the country of origin, so both of those screens are skipped.
 */
export class AddNewImmiStandaloneGoodsItemFlow {
    constructor(private readonly steps: GoodsItemSteps) { }

    /**
     * Returns whether the item was declared from a TGP record — the caller needs it
     * to know whether the overview should carry TGP-populated values.
     */
    async addNewImmiStandaloneGoodsItem(input: GoodsData): Promise<boolean> {
        return ReportLog.step('Add new IMMI standalone goods item', async () => {
            await this.steps.openNewGoodsRecord();

            const usesTgp = await this.steps.declareTgp(input);

            await this.steps.selectGoodsProcedureCode(input);
            await this.steps.selectAdditionalProcedureCode(input);
            await this.steps.enterWarehouseIdentifierIfAsked(input);

            if (!usesTgp) {
                // Unlike the ENS journeys, standalone IMMI always collects supplementary
                // units, so only the goods item's own additional procedure code can take
                // the field away - see hidesSupplementaryUnit for which codes do, and why
                // the code decides rather than a flag in the test data.
                const showsSupplementaryUnits =
                    !hidesSupplementaryUnit(input.additionalProcedureCode);

                if (showsSupplementaryUnits) {
                    await this.steps.enterCommodityInformation(input);
                } else {
                    await this.steps.enterCommodityInformationWithoutSupplementaryUnits(input);
                }
            }

            await this.steps.enterStandalonePackagingDetails(input);
            await this.steps.enterWeightInformation(input);
            await this.steps.enterItemPrice(input);

            if (!usesTgp) {
                await this.steps.enterCountryOfOrigin(input);
            }

            await this.steps.finishGoodsItemDeclaration();
            return usesTgp;
        });
    }
}
