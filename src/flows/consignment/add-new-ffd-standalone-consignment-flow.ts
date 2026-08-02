import { FfdStandaloneConsignmentData } from '../../test-data/ffd-standalone-consignment-data';
import { PartyAddress } from '../../page-object/components/party-block';
import { ReportLog } from '../../core/report/report-log';
import { MovementSteps } from '../movement/movement-steps';
import { ConsignmentSteps } from './consignment-steps';
import { StandaloneConsignmentSteps } from './standalone-consignment-steps';

/**
 * The FFD standalone "Transport Details" task, from the task list through to Finish.
 *
 * FFD asks for representation AND a vehicle AND an arrival date/time — the widest of
 * the three journeys — and its arrival screen carries the date and the port together
 * rather than as two screens.
 *
 * It also reaches screens neither IMMI nor SFD has: flight details, inland mode of
 * transport, the intended declaration type, and — only for customs warehousing — the
 * warehouse type. Those are not modelled yet; they go here as they are built.
 */
export class AddNewFfdStandaloneConsignmentFlow {
    constructor(
        private readonly standaloneSteps: StandaloneConsignmentSteps,
        private readonly movementSteps: MovementSteps,
        private readonly consignmentSteps: ConsignmentSteps,
    ) { }

    async addNewFfdStandaloneConsignment(input: FfdStandaloneConsignmentData): Promise<void> {
        await ReportLog.step('Add new FFD standalone consignment', async () => {
            await this.movementSteps.openTransportDetails();
            await this.standaloneSteps.declarePreLodgedOrArrived(input.isPreLodged);

            if (input.representationType) {
                await this.standaloneSteps.selectRepresentationType(input.representationType);
            }

            await this.movementSteps.chooseTypeOfMovement(input.typeOfMovement);
            await this.movementSteps.inputVehicleRegistrationNumber(input.vehicleRegistration);

            // One screen for both, and the date is omitted for an arrived movement.
            await this.movementSteps.enterArrivalDateTimeAndPort(
                input.portOfArrival,
                input.isPreLodged ? input.arrivalDateTime : undefined
            );

            await this.consignmentSteps.fillExporterDetails(input.exporterEORI, exporterAddress(input));
            await this.consignmentSteps.fillTraderReference(input.traderReference);
            await this.consignmentSteps.selectInvoiceCurrency(input.invoiceCurrency);

            await this.standaloneSteps.finishStandaloneConsignment();
        });
    }
}

const exporterAddress = (i: FfdStandaloneConsignmentData): PartyAddress => ({
    name: i.exporterName, streetName: i.exporterStreetName, streetNumber: i.exporterStreetNumber,
    city: i.exporterCity, postCode: i.exporterPostCode, country: i.exporterCountryCode,
});
