import { ReportLog } from '../../core/report/report-log';
import { GoodsData } from '../../test-data/goods-data';
import { GoodsItemSteps } from './goods-item-steps';

/** What the consignment already answered, and the goods item now depends on. */
export interface SfdStandaloneGoodsJourney {
    /**
     * Whether the CONSIGNMENT declared controlled goods. It decides which screens
     * this item visits and in what order, so it is read from the consignment answer
     * rather than from the goods data - the service branches on the consignment's.
     */
    readonly isControlledConsignment: boolean;
}

/**
 * One goods item on the SFD standalone journey.
 *
 * The journey splits in two, and not merely by adding screens: the two branches ask
 * for the same things in a DIFFERENT ORDER, so they are written out as two lists
 * rather than one list with conditionals. Trying to express this as flags produced a
 * body nobody could read against the real wizard.
 *
 * Controlled consignment: controlled -> dangerous (if controlled) -> country of
 * origin -> commodity -> packaging -> weight -> item price.
 *
 * Otherwise (the SFD-EIDR branch): commodity -> packaging -> weight, and nothing
 * else - the service does not ask this branch for country of origin or item price.
 * Its commodity screen is also a screen short of the other one: no supplementary
 * units, verified on sit 2026-08-11.
 */
export class AddNewSfdStandaloneGoodsItemFlow {
    constructor(private readonly steps: GoodsItemSteps) { }

    async addNewSfdStandaloneGoodsItem(
        input: GoodsData,
        journey: SfdStandaloneGoodsJourney
    ): Promise<void> {
        await ReportLog.step('Add new SFD standalone goods item', async () => {
            await this.steps.openNewGoodsRecord();
            await this.steps.selectGoodsProcedureCode(input);
            await this.steps.selectAdditionalProcedureCode(input);
            await this.steps.selectSupervisingCustomsOfficeIfAsked(input);
            await this.steps.enterWarehouseIdentifierIfAsked(input);

            if (journey.isControlledConsignment) {
                await this.steps.declareControlledAndDangerousGoods(input);
                await this.steps.enterCountryOfOrigin(input);
                await this.steps.enterCommodityInformation(input);
            } else {
                // The EIDR branch's commodity screen does not render the supplementary
                // units field, so it uses the step that does not touch it - the same
                // split the ENS journeys already make for ENS-only and EIDR.
                await this.steps.enterCommodityInformationWithoutSupplementaryUnits(input);
            }

            await this.steps.enterStandalonePackagingDetails(input);

            // Gross and net are one screen; the page fills net only when the screen
            // renders it, so this covers both branches without the caller guessing.
            await this.steps.enterWeightInformation(input);

            if (journey.isControlledConsignment) {
                await this.steps.enterItemPrice(input);
            }

            await this.steps.finishGoodsItemDeclaration();
        });
    }

}
