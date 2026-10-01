import { ReportLog } from '../../core/report/report-log';
import { TYPE_OF_MOVEMENT_OPTION_CODE } from '../../constant/type-of-movement-code-constant';
import { ROLE_IN_MOVEMENT } from '../../constant/role-in-movement-constant';
import { MovementData } from '../../test-data/movements-data';
import { MovementSteps } from './movement-steps';
import { AccessibilityCheckpoint } from '../accessibility-audit-flow';

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

    async completeNewGoodsMovementDeclaration(
        input: MovementData,
        checkpoint?: AccessibilityCheckpoint
    ): Promise<void> {
        await ReportLog.step('Complete movement header declaration', async () => {
            await checkpoint?.('Movement - type of movement', { probeErrors: true });
            await this.steps.chooseTypeOfMovement(input.typeOfMovement);
            await checkpoint?.('Movement - means of transport', { probeErrors: true });
            await this.steps.inputMeansOfTransport(input.imoNumber, input.nationalityOfMeanOfTransport);
            await this.identifyMethodOfTransport(input, checkpoint);

            await checkpoint?.('Movement - role in this movement', { probeErrors: true });
            await this.steps.declareBusinessRole(input.roleInThisMovement);
            await this.identifyTheOtherParty(input, checkpoint);

            await checkpoint?.('Movement - arrival date and time', { probeErrors: true });
            await this.steps.inputArrivalDateTime(input.arrivalDateTime);
            await checkpoint?.('Movement - arrival location', { probeErrors: true });
            await this.steps.chooseArrivalLocation(input.portOfArrival);

            await checkpoint?.('Movement - place of loading', { probeErrors: true });
            await this.steps.inputPlaceOfLoading(input.placeOfLoading);
            await checkpoint?.('Movement - acceptance same as loading', { probeErrors: true });
            await this.steps.declareAcceptanceSameAsLoading(input.isSamePlaceOfLoading);
            if (!input.isSamePlaceOfLoading) {
                await checkpoint?.('Movement - place of acceptance', { probeErrors: true });
                await this.steps.inputPlaceOfAcceptance(input.placeOfacceptance);
            }

            await checkpoint?.('Movement - place of unloading', { probeErrors: true });
            await this.steps.inputPlaceOfUnloading(input.placeOfUnloading);
            await checkpoint?.('Movement - delivery same as unloading', { probeErrors: true });
            await this.steps.declareDeliverySameAsUnloading(input.isSamePlaceOfUnloading);
            if (!input.isSamePlaceOfUnloading) {
                await checkpoint?.('Movement - place of delivery', { probeErrors: true });
                await this.steps.inputPlaceOfDelivery(input.placeOfDelivery);
            }

            await checkpoint?.('Movement - transport charges', { probeErrors: true });
            await this.steps.selectTransportCharges(input.transportCharges);
            await checkpoint?.('Movement - check your answers');
            await this.steps.finishMovementDeclaration();
        });
    }

    private async identifyTheOtherParty(
        input: MovementData,
        checkpoint?: AccessibilityCheckpoint
    ): Promise<void> {
        switch (input.roleInThisMovement) {
            case ROLE_IN_MOVEMENT.CARRIER:
                await checkpoint?.('Movement - haulier EORI', { probeErrors: true });
                await this.steps.inputHaulierEori(input.haulierEori);
                return;

            case ROLE_IN_MOVEMENT.HAULIER:
                await checkpoint?.('Movement - carrier EORI', { probeErrors: true });
                await this.steps.inputCarrierEori(input.carrierEori);
                return;

            case ROLE_IN_MOVEMENT.CARRIER_AND_HAULIER:
                return;

            case ROLE_IN_MOVEMENT.NEITHER:
                await checkpoint?.('Movement - carrier EORI', { probeErrors: true });
                await this.steps.inputCarrierEori(input.carrierEori);
                await checkpoint?.('Movement - haulier EORI', { probeErrors: true });
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
    private async identifyMethodOfTransport(
        input: MovementData,
        checkpoint?: AccessibilityCheckpoint
    ): Promise<void> {
        switch (input.typeOfMovement) {
            case TYPE_OF_MOVEMENT_OPTION_CODE.RORO_UNACCOMPANIED:
                await checkpoint?.('Movement - trailer registration', { probeErrors: true });
                await this.steps.inputTrailerRegistrationNumber(input.trailerRegistrationNumber);
                return;

            case TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED:
                await checkpoint?.('Movement - type of passive transport', { probeErrors: true });
                await this.steps.selectTypeOfPassiveTransport(input.typeOfPassiveTransport);
                await checkpoint?.('Movement - vehicle registration', { probeErrors: true });
                await this.steps.inputVehicleRegistrationNumber(input.vehicleRegistrationNumber);
                return;

            default:
                throw new Error(`Unsupported movement type: ${input.typeOfMovement}`);
        }
    }
}
