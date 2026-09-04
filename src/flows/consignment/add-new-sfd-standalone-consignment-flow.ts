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
 * whether the movement is pre-lodged or arrived.
 *
 * "Does this consignment contain controlled goods?" splits the wizard into two routes
 * that never rejoin - the app even changes the URL segment, `sfd-standalone-journey~`
 * for Yes and `eidr-journey~` for No - so the tail is written out as two private
 * methods rather than one list with conditionals.
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

            if (input.representationType) {
                await this.standaloneSteps.selectRepresentationType(input.representationType);
            }

            await this.movementSteps.chooseTypeOfMovement(input.typeOfMovement);
            await this.movementSteps.inputVehicleRegistrationNumber(input.vehicleRegistration);

            // Asked on BOTH branches, like IMMI and unlike FFD: an arrived movement is
            // still asked when the goods arrived. Measured on sit 2026-08-12 - skipping
            // it left all four arrived tests stranded on `arrival-information`, then
            // timing out on a port dropdown that was one screen further on. The
            // pre-lodged/arrived difference is in the VALUE, which the data factory has
            // already resolved.
            await this.movementSteps.inputArrivalDateTime(input.arrivalDateTime);
            await this.movementSteps.selectPortOfArrival(input.portOfArrival);

            await this.consignmentSteps.declareControlledGoods(input.isControlledGoods);

            if (input.isControlledGoods) {
                await this.declareSfdRoute(input);
            } else {
                await this.declareEidrRoute(input);
            }

            await this.standaloneSteps.finishStandaloneConsignment();
        });
    }

    /**
     * Controlled goods = Yes (`sfd-standalone-journey~`). The goods domestic status is
     * a screen of its own here, sitting between the trader reference and the container
     * question - unlike every other journey, which asks it as one field of "Transport
     * and destination details".
     */
    private async declareSfdRoute(input: SfdStandaloneConsignmentData): Promise<void> {
        await this.consignmentSteps.fillExporterDetails(input.exporterEORI, toPartyAddress('exporter', input));
        await this.consignmentSteps.fillTraderReference(input.traderReference);
        await this.standaloneSteps.selectGoodsDomesticStatus(input.goodsDomesticStatus);
        await this.declareContainerInformation(input);
        await this.consignmentSteps.selectInvoiceCurrency(input.invoiceCurrency);
    }

    /**
     * Controlled goods = No (`eidr-journey~`). Two screens and nothing else: it asks
     * for the transport document and the goods domestic status together, then the
     * container question, then goes straight to "Check your answers". Being the reduced
     * journey it skips what the controlled-goods route asks for either side of them -
     * the exporter, the trader reference and the invoice currency.
     */
    private async declareEidrRoute(input: SfdStandaloneConsignmentData): Promise<void> {
        await this.consignmentSteps.fillSfdTransportAndDestination(
            input.transportDocumentNumber, input.goodsDomesticStatus
        );
        await this.declareContainerInformation(input);
    }

    /**
     * "Container information", the one part both routes share: three screens, each
     * opened by answering Yes to the one before it. Only the first is standalone's own -
     * the other two are the ENS journey's screens, reached here through a different
     * opening question, so their steps are reused rather than copied.
     */
    private async declareContainerInformation(input: SfdStandaloneConsignmentData): Promise<void> {
        await this.standaloneSteps.declareTransportingInContainers(input.isTransportingInContainers);

        if (!input.isTransportingInContainers) {
            return;
        }

        await this.consignmentSteps.declareAllGoodsInSameContainer(input.isSameContainer);

        if (!input.isSameContainer) {
            return;
        }

        await this.consignmentSteps.fillContainerIdentification(
            input.containerIdentifierNumber,
            input.containerSize,
            input.containerPackedStatus,
            input.containerSupplierType
        );
    }
}
