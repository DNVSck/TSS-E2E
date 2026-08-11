import { TaskListPage } from '../page-object/task-list-page';
import { StandaloneConsignmentDeclarePage } from '../page-object/standalone-consignment-declare-page';
import { MovementDeclarePage } from '../page-object/movement-declare-page';
import { ConsignmentDeclarePage } from '../page-object/consignment-declare-page';
import { SfdStandaloneConsignmentData } from '../test-data/sfd-standalone-consignment-data';
import { ReportLog } from '../core/report/report-log';
import { StandaloneConsignmentCommonSteps } from './common-flows/standalone-consignment-common-steps';

/**
 * The SFD standalone "Transport Details" task, from the task list through to Finish
 * (which creates the consignment and lands on its overview).
 *
 * The screen list is a fact about this journey, so it is the method order below.
 * SFD is the only standalone journey with NO "Representation information" screen; it
 * does have the vehicle screen, and its arrival screen asks for a date/time when the
 * movement is pre-lodged.
 *
 * Steps identical across SFD/FFD/IMMI (pre-lodged/arrived, type of movement,
 * vehicle, exporter, trader reference, invoice currency, border/container) are
 * delegated to StandaloneConsignmentCommonSteps; only SFD-specific screens
 * (controlled goods, arrival date/time, port of arrival) live here.
 */
export class AddNewSfdStandaloneConsignmentFlow {
    constructor(
        private readonly taskListPage: TaskListPage,
        private readonly standalonePage: StandaloneConsignmentDeclarePage,
        private readonly movementDeclarePage: MovementDeclarePage,
        private readonly consignmentDeclarePage: ConsignmentDeclarePage,
        private readonly commonSteps: StandaloneConsignmentCommonSteps =
            new StandaloneConsignmentCommonSteps(standalonePage, movementDeclarePage, consignmentDeclarePage),
    ) { }

    async addNewSfdStandaloneConsignment(input: SfdStandaloneConsignmentData): Promise<void> {
        await ReportLog.step('Add new SFD standalone consignment', async () => {
            await this.taskListPage.clickTransportDetails();
            await this.commonSteps.declarePreLodgedOrArrived(input);
            await this.commonSteps.chooseTypeOfMovement(input);
            await this.commonSteps.fillVehicleDetails(input.vehicleRegistration);
            await this.fillArrivalDateTime(input);
            await this.fillPortOfArrival(input);
            await this.commonSteps.declareControlledGoods(input.isControlledGoods);
            if (input.isControlledGoods) {
                // SFD: exporter → trader ref → currency → transport → border
                await this.commonSteps.fillExporter(input);
                await this.commonSteps.fillTraderReference(input.traderReference);
                await this.commonSteps.fillInvoiceCurrency(input.invoiceCurrency);
                await this.fillTransportAndDestinationDetails(input);
                await this.commonSteps.fillBorderAndContainerInformation(input);
            } else {
                await this.fillTransportAndDestinationDetails(input);
                await this.commonSteps.fillBorderAndContainerInformation(input);
            }
            await this.standalonePage.clickFinishButton();
        });
    }

    /**
     * "When will the goods arrive?" - its OWN screen with its own Continue, shown only
     * for a PRE-LODGED movement: goods declared as already arrived have no future
     * arrival to state, so an arrived movement goes straight to the port screen.
     */
    private async fillArrivalDateTime(input: SfdStandaloneConsignmentData): Promise<void> {
        if (!input.isPreLodged) {
            return;
        }
        await ReportLog.step('Enter arrival date and time', async () => {
            await this.movementDeclarePage.inputArrivalDateTime(input.arrivalDateTime);
            await this.movementDeclarePage.clickContinueButton();
        });
    }

    /** "Where will the goods arrive?" - a separate screen, asked on every movement. */
    private async fillPortOfArrival(input: SfdStandaloneConsignmentData): Promise<void> {
        await ReportLog.step('Select port of arrival', async () => {
            await this.movementDeclarePage.selectPortOfArrival(input.portOfArrival);
            await this.movementDeclarePage.clickContinueButton();
        });
    }

    private async fillTransportAndDestinationDetails(input: SfdStandaloneConsignmentData): Promise<void> {
        await ReportLog.step('Fill transport and destination details', async () => {
            await this.consignmentDeclarePage.fillSfdTransportAndDestinationDetails(
                input.transportDocumentNumber,
                input.goodsDomesticStatus,
            );
        });
    }
}
