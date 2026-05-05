import { NewGoodsMovementDeclarePage } from "../page-object/new-goods-movement-declare-page";
import { ReportLog } from '../core/report/report-log';
import { MovementData } from "../test-data/movements";
import { NEW_GOODS_MOVEMENT_DECLARATION } from "../constant/goods-movement-declaration-constants";

export class NewGoodsMovementMovementDetailsFlow {
    constructor(
        private readonly newGoodsMovementDeclarePage: NewGoodsMovementDeclarePage,
    ) { }

    async NewGoodsMovementMovementDetails(input: MovementData
    ): Promise<void> {

        await ReportLog.step('Submit transport details', async () => {

            await this.newGoodsMovementDeclarePage.chooseYourRoleInThisMovement(input.roleInThisMovement);
            await this.newGoodsMovementDeclarePage.chooseHaulierInvolvement(input.haulierSeparateThisMovement);
            await this.newGoodsMovementDeclarePage.clickContinueButton();

            if (input.roleInThisMovement === NEW_GOODS_MOVEMENT_DECLARATION.ROLE_IN_THIS_MOVEMENT.ON_BEHALF_OF_CARRIER) {
                await this.newGoodsMovementDeclarePage.inputCarrierEori(input.carrierEori!);
                await this.newGoodsMovementDeclarePage.clickContinueButton();
            }

            await this.newGoodsMovementDeclarePage.inputArrivalDateTime(input.arrivalDateTime);
            await this.newGoodsMovementDeclarePage.selectPortOfArrival(input.portOfArrival)
            await this.newGoodsMovementDeclarePage.clickContinueButton();

        });
    }

}