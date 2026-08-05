import { ImmiStandaloneConsignmentData } from '../../test-data/immi-standalone-consignment-data';
import { PartyAddress } from '../../page-object/components/party-block';
import { ReportLog } from '../../core/report/report-log';
import { MovementSteps } from '../movement/movement-steps';
import { ConsignmentSteps } from './consignment-steps';
import { StandaloneConsignmentSteps } from './standalone-consignment-steps';

/**
 * The IMMI standalone "Transport Details" task, from the task list through to Finish
 * (which creates the consignment and lands on its overview).
 *
 * Standalone has ONE wizard where ENS has two, so this spine draws from all three
 * step libraries: the pre-lodge and representation screens are standalone's own, the
 * movement type and arrival screens are the ENS movement screens, and the exporter,
 * trader reference and invoice currency are the ENS consignment screens.
 *
 * IMMI has NO vehicle screen. It DOES ask when the goods arrive - on both the
 * pre-lodged and the arrived branch - and then for the port.
 */
export class AddNewImmiStandaloneConsignmentFlow {
    constructor(
        private readonly standaloneSteps: StandaloneConsignmentSteps,
        private readonly movementSteps: MovementSteps,
        private readonly consignmentSteps: ConsignmentSteps,
    ) { }

    async addNewImmiStandaloneConsignment(input: ImmiStandaloneConsignmentData): Promise<void> {
        await ReportLog.step('Add new IMMI standalone consignment', async () => {
            await this.movementSteps.openTransportDetails();
            await this.standaloneSteps.declarePreLodgedOrArrived(input.isPreLodged);

            // Asked only when the agent represents a trader; an importer signing in as
            // their own company skips it, which the data says by leaving it undefined.
            if (input.representationType) {
                await this.standaloneSteps.selectRepresentationType(input.representationType);
            }

            await this.movementSteps.chooseTypeOfMovement(input.typeOfMovement);
            // Asked on both branches, unlike FFD, which skips it once the goods have
            // arrived. The pre-lodged/arrived difference is in the VALUE, and the data
            // factory has already resolved it - see ImmiStandaloneConsignmentData.
            await this.movementSteps.inputArrivalDateTime(input.arrivalDateTime);
            await this.movementSteps.selectPortOfArrival(input.portOfArrival);

            await this.consignmentSteps.fillExporterDetails(input.exporterEORI, exporterAddress(input));
            await this.consignmentSteps.fillTraderReference(input.traderReference);
            await this.consignmentSteps.selectInvoiceCurrency(input.invoiceCurrency);

            await this.standaloneSteps.finishStandaloneConsignment();
        });
    }
}

const exporterAddress = (i: ImmiStandaloneConsignmentData): PartyAddress => ({
    name: i.exporterName, streetName: i.exporterStreetName, streetNumber: i.exporterStreetNumber,
    city: i.exporterCity, postCode: i.exporterPostCode, country: i.exporterCountryCode,
});
