import { GoodsMovementTaskListPage } from '../page-object/goods-movement-task-list-page';
import { MovementDeclarePage } from '../page-object/movement-declare-page';
import { ReportLog } from '../core/report/report-log';
import { NEW_GOODS_MOVEMENT_DECLARATION, TYPE_OF_MOVEMENT_OPTION_CODE } from '../constant/goods-movement-declaration-constants';
import { MovementData } from '../test-data/movements-data';

export class MovementHeaderDeclarationFlow {
    constructor(
        private readonly goodsMovementTaskListPage: GoodsMovementTaskListPage,
        private readonly movementDeclarePage: MovementDeclarePage,
    ) { }

    async completeNewGoodsMovementDeclaration(input: MovementData): Promise<void> {
        await this.openTransportDetails();
        await this.inputTransportDetails(input);
        await this.chooseResponsibleForThisMovement(input);
        await this.inputArrivalDateTimeAndPortOfArrival(input);
        await this.inputLoadingDetails(input);
        await this.chooseTransportCharges(input);
        await this.movementDeclarePage.clickFinishButton();
    }

    async completeMovementHeaderDeclaration(): Promise<void> {
        await this.openTransportDetails();
    }

    private async openTransportDetails(): Promise<void> {
        await this.goodsMovementTaskListPage.clickTransportDetails();
    }

    private async inputTransportDetails(input: MovementData): Promise<void> {
        await ReportLog.step('Submit transport details', async () => {
            await this.movementDeclarePage.chooseTypeOfMovement(input.typeOfMovement);
            await this.movementDeclarePage.clickContinueButton();

            await this.movementDeclarePage.inputImoAndNationalityOfMeanOfTransport(input.imoNumber, input.nationalityOfMeanOfTransport);
            await this.movementDeclarePage.clickContinueButton();

            if (input.typeOfMovement === TYPE_OF_MOVEMENT_OPTION_CODE.RORO_UNACCOMPANIED) {
                await this.movementDeclarePage.inputTrailerRegistrationNumber(input.trailerRegistrationNumber);
                await this.movementDeclarePage.clickContinueButton();
            } else if (input.typeOfMovement === TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED) {
                await this.movementDeclarePage.selectTypeOfPassiveTransport(input.typeOfPassiveTransport);
                await this.movementDeclarePage.inputVehicleRegistrationNumber(input.vehicleRegistrationNumber);
                await this.movementDeclarePage.clickContinueButton();
            }

            await this.movementDeclarePage.inputSealNumber(input.sealNumber);
            await this.movementDeclarePage.clickContinueButton();
        });
    }

    private async chooseResponsibleForThisMovement(input: MovementData): Promise<void> {
        await ReportLog.step('Declare "Who is responsible for this movement?" ', async () => {
            await this.movementDeclarePage.chooseYourRoleInThisMovement(input.roleInThisMovement);
            await this.movementDeclarePage.chooseHaulierInvolvement(input.haulierSeparateThisMovement);
            await this.movementDeclarePage.clickContinueButton();

            if (input.roleInThisMovement === NEW_GOODS_MOVEMENT_DECLARATION.ROLE_IN_THIS_MOVEMENT.ON_BEHALF_OF_CARRIER) {
                await this.movementDeclarePage.inputCarrierEori(input.carrierEori);
                await this.movementDeclarePage.clickContinueButton();
            }
            if (input.haulierSeparateThisMovement === NEW_GOODS_MOVEMENT_DECLARATION.SEPARATE_HAULIER_THIS_MOVEMENT.SEPARATE_HAULIER) {
                await this.movementDeclarePage.inputHaulierEori(input.haulierEori);
                await this.movementDeclarePage.clickContinueButton();
            }
        });
    }

    private async inputArrivalDateTimeAndPortOfArrival(input: MovementData): Promise<void> {
        await ReportLog.step('Input information for "When and where will the goods arrive?" ', async () => {
            await this.movementDeclarePage.inputArrivalDateTime(input.arrivalDateTime);
            await this.movementDeclarePage.selectPortOfArrival(input.portOfArrival);
            await this.movementDeclarePage.clickContinueButton();
        });
    }


    private async inputLoadingDetails(input: MovementData): Promise<void> {
        await ReportLog.step('Input loading details', async () => {
            // Enter place of loading details
            await this.movementDeclarePage.inputPlaceOfLoading(input.placeOfLoading);
            await this.movementDeclarePage.clickContinueButton();

            // Enter place of unloading details
            await this.movementDeclarePage.inputPlaceOfUnloading(input.placeOfUnloading);
            await this.movementDeclarePage.clickContinueButton();

            // Select Place of acceptance and delivery
            // "Are the goods being delivered to the same place as they're unloaded?"
            if (input.isSamePlaceOfUnloading) {
                await this.movementDeclarePage.selectDeliverySameAsUnloading();
            } else {
                await this.movementDeclarePage.selectDeliveryNotSameAsUnloading();
                await this.movementDeclarePage.inputPlaceOfDelivery(input.placeOfDelivery);
            }

        });
    }

    private async chooseTransportCharges(input: MovementData): Promise<void> {
        await this.movementDeclarePage.selectTransportCharges(input.transportCharges);
        await this.movementDeclarePage.clickContinueButton();
    }

}
