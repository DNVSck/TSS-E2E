import { NewGoodsMovementDeclarePage } from "../page-object/new-goods-movement-declare-page";
import { ReportLog } from '../core/report/report-log';

export class NewGoodsMovementMovementDetailsFlow {
    constructor(
        private readonly newGoodsMovementDeclarePage: NewGoodsMovementDeclarePage,
    ) { }

    async NewGoodsMovementMovementDetails(
        roleInThisMovement: string,
        haulierSeparateThisMovement: string,
        arrivalDateTime: string,
        portOfArrival: string
    ): Promise<void> {

        await ReportLog.step('Submit transport details', async () => {

            await this.newGoodsMovementDeclarePage.chooseYourRoleInThisMovement(roleInThisMovement);
            await this.newGoodsMovementDeclarePage.chooseHaulierInvolvement(haulierSeparateThisMovement);
            await this.newGoodsMovementDeclarePage.clickContinueButton();

            await this.newGoodsMovementDeclarePage.inputArrivalDateTime(arrivalDateTime);
            await this.newGoodsMovementDeclarePage.selectPortOfArrival(portOfArrival)
            await this.newGoodsMovementDeclarePage.clickContinueButton();

        });
    }

}