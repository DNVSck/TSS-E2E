import { NewGoodsMovementDeclarePage } from "../page-object/new-goods-movement-declare-page";
import { ReportLog } from '../core/report/report-log';

export class NewGoodsMovementTransportDetailsFlow {
    constructor(
        private readonly newGoodsMovementDeclarePage: NewGoodsMovementDeclarePage,
    ) { }

    async NewGoodsMovementTransportDetails(
        typeOfMovement: string,
        imoNumber: string,
        nationalityOfMeanOfTransport: string,
        typeOfPassiveTransport: string,
        vehicleRegistrationNumber: string,
        sealNumber: string
    ): Promise<void> {

        await ReportLog.step('Submit transport details', async () => {

            await this.newGoodsMovementDeclarePage.chooseTypeOfMovement(typeOfMovement);
            await this.newGoodsMovementDeclarePage.clickContinueButton();

            await this.newGoodsMovementDeclarePage.submitTransportDetails(imoNumber, nationalityOfMeanOfTransport);
            await this.newGoodsMovementDeclarePage.clickContinueButton();

            await this.newGoodsMovementDeclarePage.selectTypeOfPassiveTransport(typeOfPassiveTransport, vehicleRegistrationNumber);
            await this.newGoodsMovementDeclarePage.clickContinueButton();

            await this.newGoodsMovementDeclarePage.inputSealNumber(sealNumber);
            await this.newGoodsMovementDeclarePage.clickContinueButton();
        });
    }

}