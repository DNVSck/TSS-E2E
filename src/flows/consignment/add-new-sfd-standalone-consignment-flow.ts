import { SfdStandaloneConsignmentData } from '../../test-data/sfd-standalone-consignment-data';
import { toPartyAddress } from '../../page-object/components/party-block';
import { ReportLog } from '../../core/report/report-log';
import { MovementSteps } from '../movement/movement-steps';
import { ConsignmentSteps } from './consignment-steps';
import { StandaloneConsignmentSteps } from './standalone-consignment-steps';
import { AccessibilityCheckpoint } from '../accessibility-audit-flow';

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

    async addNewSfdStandaloneConsignment(
        input: SfdStandaloneConsignmentData,
        checkpoint?: AccessibilityCheckpoint
    ): Promise<void> {
        await ReportLog.step('Add new SFD standalone consignment', async () => {
            await checkpoint?.('Consignment - pre-lodged or arrived', { probeErrors: true });
            await this.standaloneSteps.declarePreLodgedOrArrived(input.isPreLodged);

            if (input.representationType) {
                await checkpoint?.('Consignment - representation type', { probeErrors: true });
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
            await checkpoint?.('Movement - arrival date and time', { probeErrors: true });
            await this.movementSteps.inputArrivalDateTime(
                input.arrivalDateTime,
                { collectsYear: !input.isPreLodged, collectsTime: input.isPreLodged }
            );
            await this.enterArrivalLocation(input, checkpoint);

            await checkpoint?.('Consignment - controlled goods', { probeErrors: true });
            await this.consignmentSteps.declareControlledGoods(input.isControlledGoods);

            if (input.isControlledGoods) {
                await this.declareSfdRoute(input, checkpoint);
            } else {
                await this.declareEidrRoute(input, checkpoint);
            }

            await checkpoint?.('Consignment - check your answers');
            await this.standaloneSteps.finishStandaloneConsignment();
        });
    }

    /**
     * Controlled goods = Yes (`sfd-standalone-journey~`). The goods domestic status is
     * a screen of its own here, sitting between the trader reference and the container
     * question - unlike every other journey, which asks it as one field of "Transport
     * and destination details".
     */
    private async declareSfdRoute(
        input: SfdStandaloneConsignmentData,
        checkpoint?: AccessibilityCheckpoint
    ): Promise<void> {
        await this.consignmentSteps.auditPartyScreens('exporter', checkpoint);
        await this.consignmentSteps.fillExporterDetails(input.exporterEORI, toPartyAddress('exporter', input));
        // No probe: the trader reference is the one optional field in the wizard.
        await checkpoint?.('Consignment - trader reference');
        await this.consignmentSteps.fillTraderReference(input.traderReference);
        await checkpoint?.('Consignment - goods domestic status', { probeErrors: true });
        await this.standaloneSteps.selectGoodsDomesticStatus(input.goodsDomesticStatus);
        await this.declareContainerInformation(input, checkpoint);
        await checkpoint?.('Consignment - invoice currency', { probeErrors: true });
        await this.consignmentSteps.selectInvoiceCurrency(input.invoiceCurrency);
    }

    /**
     * Controlled goods = No (`eidr-journey~`). The exporter, then the transport
     * document and the goods domestic status together, then the container question,
     * then straight to "Check your answers". Being the reduced journey it skips the
     * trader reference and the invoice currency the controlled-goods route asks for.
     */
    private async declareEidrRoute(
        input: SfdStandaloneConsignmentData,
        checkpoint?: AccessibilityCheckpoint
    ): Promise<void> {
        await this.consignmentSteps.auditPartyScreens('exporter', checkpoint);
        await this.consignmentSteps.fillExporterDetails(input.exporterEORI, toPartyAddress('exporter', input));
        await checkpoint?.('Consignment - transport and destination', { probeErrors: true });
        await this.consignmentSteps.fillSfdTransportAndDestination(
            input.transportDocumentNumber, input.goodsDomesticStatus
        );
        await this.declareContainerInformation(input, checkpoint);
    }

    /**
     * "Container information", the one part both routes share: three screens, each
     * opened by answering Yes to the one before it. Only the first is standalone's own -
     * the other two are the ENS journey's screens, reached here through a different
     * opening question, so their steps are reused rather than copied.
     */
    private async declareContainerInformation(
        input: SfdStandaloneConsignmentData,
        checkpoint?: AccessibilityCheckpoint
    ): Promise<void> {
        await checkpoint?.('Consignment - transporting in containers', { probeErrors: true });
        await this.standaloneSteps.declareTransportingInContainers(input.isTransportingInContainers);

        if (!input.isTransportingInContainers) {
            return;
        }

        await checkpoint?.('Consignment - all goods in same container', { probeErrors: true });
        await this.consignmentSteps.declareAllGoodsInSameContainer(input.isSameContainer);

        if (!input.isSameContainer) {
            return;
        }

        await checkpoint?.('Consignment - container identification', { probeErrors: true });
        await this.consignmentSteps.fillContainerIdentification(
            input.containerIdentifierNumber,
            input.containerSize,
            input.containerPackedStatus,
            input.containerSupplierType
        );
    }

    private async enterArrivalLocation(
        input: SfdStandaloneConsignmentData,
        checkpoint?: AccessibilityCheckpoint
    ): Promise<void> {
        // One checkpoint for both branches: they are the same screen asked in the two
        // shapes the arrived and pre-lodged routes give it.
        await checkpoint?.('Movement - arrival location', { probeErrors: true });

        if (input.isPreLodged) {
            await this.movementSteps.chooseArrivalLocation(input.portOfArrival);
            return;
        }

        await this.movementSteps.selectPortOfArrival(input.portOfArrival);
    }
}
