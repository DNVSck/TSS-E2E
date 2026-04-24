import { NewGoodsMovementDeclarePage } from "../page-object/new-goods-movement-declare-page";
import { ReportLog } from '../core/report/report-log';
import { MovementData } from "../test-data/movements";

export class NewGoodsMovementLoadingDetailsFlow {
    constructor(
        private readonly newGoodsMovementDeclarePage: NewGoodsMovementDeclarePage,
    ) { }

    async NewGoodsMovementLoadingDetails(input: MovementData
    ): Promise<void> {

        await ReportLog.step('Submit transport details', async () => {

            await this.newGoodsMovementDeclarePage.inputPlaceOfLoading(input.placeOfLoading);
            await this.newGoodsMovementDeclarePage.clickContinueButton();

            await this.newGoodsMovementDeclarePage.inputPlaceOfUnloading(input.placeOfUnloading);
            await this.newGoodsMovementDeclarePage.clickContinueButton();

            if (input.isSamePlaceOfLoading) {
                await this.newGoodsMovementDeclarePage.selectAcceptanceSameAsLoading();
            } else {
                await this.newGoodsMovementDeclarePage.selectAcceptanceNotSameAsLoading();
            }
            if (input.isSamePlaceOfUnloading) {
                await this.newGoodsMovementDeclarePage.selectDeliverySameAsUnloading();
            } else {
                await this.newGoodsMovementDeclarePage.selectDeliveryNotSameAsUnloading();
            }
            await this.newGoodsMovementDeclarePage.clickContinueButton();

            await this.newGoodsMovementDeclarePage.selectTransportCharges(input.transportCharges);
            await this.newGoodsMovementDeclarePage.clickContinueButton();

            await this.newGoodsMovementDeclarePage.clickFinishButton();

        });
    }

}