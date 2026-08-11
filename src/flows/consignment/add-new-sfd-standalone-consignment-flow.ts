import { SfdStandaloneConsignmentData } from '../../test-data/sfd-standalone-consignment-data';
import { toPartyAddress } from '../../page-object/components/party-block';
import { ReportLog } from '../../core/report/report-log';
import { MovementSteps } from '../movement/movement-steps';
import { ConsignmentSteps } from './consignment-steps';
import { StandaloneConsignmentSteps } from './standalone-consignment-steps';

/**
 * The SFD standalone "Transport Details" task, from the task list through to Finish.
 *
 * SFD is the only standalone journey with NO "Representation information" screen; it
 * does have the vehicle screen, and its arrival date/time is its own screen, asked
 * only for a pre-lodged movement.
 */
export class AddNewSfdStandaloneConsignmentFlow {
    constructor(
        private readonly standaloneSteps: StandaloneConsignmentSteps,
        private readonly movementSteps: MovementSteps,
        private readonly consignmentSteps: ConsignmentSteps,
    ) { }

    async addNewSfdStandaloneConsignment(input: SfdStandaloneConsignmentData): Promise<void> {
        await ReportLog.step('Add new SFD standalone consignment', async () => {
            await this.movementSteps.openTransportDetails();
            await this.standaloneSteps.declarePreLodgedOrArrived(input.isPreLodged);

            await this.movementSteps.chooseTypeOfMovement(input.typeOfMovement);
            await this.movementSteps.inputVehicleRegistrationNumber(input.vehicleRegistration);

            // Goods declared as already arrived have no future arrival to state, so an
            // arrived movement goes straight to the port screen.
            if (input.isPreLodged) {
                await this.movementSteps.inputArrivalDateTime(input.arrivalDateTime);
            }
            await this.movementSteps.selectPortOfArrival(input.portOfArrival);

            await this.consignmentSteps.declareControlledGoods(input.isControlledGoods);
            await this.consignmentSteps.fillExporterDetails(input.exporterEORI, toPartyAddress('exporter', input));
            await this.consignmentSteps.fillTraderReference(input.traderReference);
            await this.consignmentSteps.selectInvoiceCurrency(input.invoiceCurrency);

            await this.standaloneSteps.finishStandaloneConsignment();
        });
    }
}
