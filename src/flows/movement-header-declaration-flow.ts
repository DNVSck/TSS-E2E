import { GoodsMovementTaskListPage } from '../page-object/goods-movement-task-list-page';
import { NewGoodsMovementDeclarePage } from '../page-object/new-goods-movement-declare-page';
import { ReportLog } from '../core/report/report-log';
import { NEW_GOODS_MOVEMENT_DECLARATION, TYPE_OF_MOVEMENT_OPTION_CODE } from '../constant/goods-movement-declaration-constants';
import { MovementData } from '../test-data/movements-data';

export class MovementHeaderDeclarationFlow {
    constructor(
        private readonly goodsMovementTaskListPage: GoodsMovementTaskListPage,
        private readonly newGoodsMovementDeclarePage: NewGoodsMovementDeclarePage,
    ) { }

    async completeNewGoodsMovementDeclaration(input: MovementData): Promise<void> {
        await this.openTransportDetails();
        await this.submitTransportDetails(input);
        await this.submitMovementDetails(input);
        await this.submitLoadingDetails(input);
    }

    async completeMovementHeaderDeclaration(): Promise<void> {
        await this.openTransportDetails();
    }

    private async openTransportDetails(): Promise<void> {
        await this.goodsMovementTaskListPage.clickTransportDetails();
    }

    private async submitTransportDetails(input: MovementData): Promise<void> {
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

    private async submitMovementDetails(input: MovementData): Promise<void> {
        await ReportLog.step('Submit movement details', async () => {
            await this.newGoodsMovementDeclarePage.chooseYourRoleInThisMovement(input.roleInThisMovement);
            await this.newGoodsMovementDeclarePage.chooseHaulierInvolvement(input.haulierSeparateThisMovement);
            await this.newGoodsMovementDeclarePage.clickContinueButton();

            if (input.roleInThisMovement === NEW_GOODS_MOVEMENT_DECLARATION.ROLE_IN_THIS_MOVEMENT.ON_BEHALF_OF_CARRIER) {
                await this.newGoodsMovementDeclarePage.inputCarrierEori(input.carrierEori!);
                await this.newGoodsMovementDeclarePage.clickContinueButton();
            }

            await this.newGoodsMovementDeclarePage.inputArrivalDateTime(input.arrivalDateTime);
            await this.newGoodsMovementDeclarePage.selectPortOfArrival(input.portOfArrival);
            await this.newGoodsMovementDeclarePage.clickContinueButton();
        });
    }

    private async submitLoadingDetails(input: MovementData): Promise<void> {
        await ReportLog.step('Submit loading details', async () => {
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
