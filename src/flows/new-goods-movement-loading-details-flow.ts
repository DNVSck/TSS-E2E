import { NewGoodsMovementDeclarePage } from "../page-object/new-goods-movement-declare-page";
import { ReportLog } from '../core/report/report-log';

export class NewGoodsMovementLoadingDetailsFlow {
    constructor(
        private readonly newGoodsMovementDeclarePage: NewGoodsMovementDeclarePage,
    ) { }

    async NewGoodsMovementLoadingDetails(
        placeOfLoading: string,
        placeOfUnloading: string,
        isSamePlaceOfLoading: boolean,
        isSamePlaceOfUnloading: boolean,
        transportCharges: string,
    ): Promise<void> {

        await ReportLog.step('Submit transport details', async () => {

            await this.newGoodsMovementDeclarePage.inputPlaceOfLoading(placeOfLoading);
            await this.newGoodsMovementDeclarePage.clickContinueButton();

            await this.newGoodsMovementDeclarePage.inputPlaceOfUnloading(placeOfUnloading);
            await this.newGoodsMovementDeclarePage.clickContinueButton();

            if (isSamePlaceOfLoading) {
                await this.newGoodsMovementDeclarePage.selectAcceptanceSameAsLoading();
            } else {
                await this.newGoodsMovementDeclarePage.selectAcceptanceNotSameAsLoading();
            }
            if (isSamePlaceOfUnloading) {
                await this.newGoodsMovementDeclarePage.selectDeliverySameAsUnloading();
            } else {
                await this.newGoodsMovementDeclarePage.selectDeliveryNotSameAsUnloading();
            }
            await this.newGoodsMovementDeclarePage.clickContinueButton();

            await this.newGoodsMovementDeclarePage.selectTransportCharges(transportCharges);
            await this.newGoodsMovementDeclarePage.clickContinueButton();

            await this.newGoodsMovementDeclarePage.clickFinishButton();

        });
    }

}