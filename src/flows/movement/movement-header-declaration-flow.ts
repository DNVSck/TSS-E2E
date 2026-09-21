import { ReportLog } from '../../core/report/report-log';
import { TYPE_OF_MOVEMENT_OPTION_CODE } from '../../constant/type-of-movement-code-constant';
import { ROLE_IN_MOVEMENT } from '../../constant/role-in-movement-constant';
import { MovementData } from '../../test-data/movements-data';
import { MovementSteps } from './movement-steps';

/**
 * The ENS movement header task, from the task list through to Finish.
 *
 * The method body IS the screen list: every screen is one call on MovementSteps, and
 * the conditionals say which movement reaches it. The standalone journeys reuse
 * several of the same screens, but reach them inside their consignment wizard and in
 * a different order — which is why each journey keeps its own spine.
 */
export class MovementHeaderDeclarationFlow {
    constructor(private readonly steps: MovementSteps) { }

    async completeNewGoodsMovementDeclaration(input: MovementData): Promise<void> {
        await ReportLog.step('Complete movement header declaration', async () => {
            await this.steps.chooseTypeOfMovement(input.typeOfMovement);
            await this.steps.inputMeansOfTransport(input.imoNumber, input.nationalityOfMeanOfTransport);
            await this.identifyMethodOfTransport(input);

            await this.steps.declareBusinessRole(input.roleInThisMovement);
            await this.identifyTheOtherParty(input);

            await this.steps.inputArrivalDateTime(input.arrivalDateTime);
            await this.steps.chooseArrivalLocation(input.portOfArrival);

            await this.steps.inputPlaceOfLoading(input.placeOfLoading);
            await this.steps.declareAcceptanceSameAsLoading(input.isSamePlaceOfLoading);
            if (!input.isSamePlaceOfLoading) {
                await this.steps.inputPlaceOfAcceptance(input.placeOfacceptance);
            }

            await this.steps.inputPlaceOfUnloading(input.placeOfUnloading);
            await this.steps.declareDeliverySameAsUnloading(input.isSamePlaceOfUnloading);
            if (!input.isSamePlaceOfUnloading) {
                await this.steps.inputPlaceOfDelivery(input.placeOfDelivery);
            }

            await this.steps.selectTransportCharges(input.transportCharges);
            await this.steps.finishMovementDeclaration();
        });
    }

    private async identifyTheOtherParty(input: MovementData): Promise<void> {
        switch (input.roleInThisMovement) {
            case ROLE_IN_MOVEMENT.CARRIER:
                await this.steps.inputHaulierEori(input.haulierEori);
                return;

            case ROLE_IN_MOVEMENT.HAULIER:
                await this.steps.inputCarrierEori(input.carrierEori);
                return;

            case ROLE_IN_MOVEMENT.CARRIER_AND_HAULIER:
                return;

            case ROLE_IN_MOVEMENT.NEITHER:
                await this.steps.inputCarrierEori(input.carrierEori);
                await this.steps.inputHaulierEori(input.haulierEori);
                return;

            default:
                throw new Error(`Unsupported role in the movement: ${input.roleInThisMovement}`);
        }
    }

    /**
     * Unaccompanied RoRo identifies the trailer on one screen; accompanied RoRo first
     * asks what is being towed, then identifies the towing vehicle.
     */
    private async identifyMethodOfTransport(input: MovementData): Promise<void> {
        switch (input.typeOfMovement) {
            case TYPE_OF_MOVEMENT_OPTION_CODE.RORO_UNACCOMPANIED:
                await this.steps.inputTrailerRegistrationNumber(input.trailerRegistrationNumber);
                return;

            case TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED:
                await this.steps.selectTypeOfPassiveTransport(input.typeOfPassiveTransport);
                await this.steps.inputVehicleRegistrationNumber(input.vehicleRegistrationNumber);
                return;

            default:
                throw new Error(`Unsupported movement type: ${input.typeOfMovement}`);
        }
    }
}
