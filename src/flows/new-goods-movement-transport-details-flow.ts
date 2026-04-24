import { NewGoodsMovementDeclarePage } from "../page-object/new-goods-movement-declare-page";
import { ReportLog } from '../core/report/report-log';
import { TYPE_OF_MOVEMENT_OPTION_CODE } from "../constant/goods-movement-declaration-constants";
import { MovementData } from "../test-data/movements";

export class NewGoodsMovementTransportDetailsFlow {
    constructor(
        private readonly newGoodsMovementDeclarePage: NewGoodsMovementDeclarePage,
    ) { }

    async NewGoodsMovementTransportDetails(input: MovementData
    ): Promise<void> {

        await ReportLog.step('Submit transport details', async () => {

            await this.newGoodsMovementDeclarePage.chooseTypeOfMovement(input.typeOfMovement);
            await this.newGoodsMovementDeclarePage.clickContinueButton();

            await this.newGoodsMovementDeclarePage.submitTransportDetails(input.imoNumber, input.nationalityOfMeanOfTransport);
            await this.newGoodsMovementDeclarePage.clickContinueButton();

            if (input.typeOfMovement === TYPE_OF_MOVEMENT_OPTION_CODE.RORO_UNACCOMPANIED) {
                await this.newGoodsMovementDeclarePage.inputTrailerRegistrationNumber(input.trailerRegistrationNumber);
                await this.newGoodsMovementDeclarePage.clickContinueButton();

            } else if (input.typeOfMovement === TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED) {
                await this.newGoodsMovementDeclarePage.selectTypeOfPassiveTransport(input.typeOfPassiveTransport);

                await this.newGoodsMovementDeclarePage.inputVehicleRegistrationNumber(input.vehicleRegistrationNumber);
                await this.newGoodsMovementDeclarePage.clickContinueButton();
            }

            await this.newGoodsMovementDeclarePage.inputSealNumber(input.sealNumber);
            await this.newGoodsMovementDeclarePage.clickContinueButton();
        });
    }

}