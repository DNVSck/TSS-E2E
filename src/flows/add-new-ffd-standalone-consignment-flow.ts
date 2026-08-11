import { TaskListPage } from '../page-object/task-list-page';
import { StandaloneConsignmentDeclarePage } from '../page-object/standalone-consignment-declare-page';
import { MovementDeclarePage } from '../page-object/movement-declare-page';
import { ConsignmentDeclarePage } from '../page-object/consignment-declare-page';
import { FfdStandaloneConsignmentData } from '../test-data/ffd-standalone-consignment-data';
import { ReportLog } from '../core/report/report-log';
import { StandaloneConsignmentCommonSteps } from './common-flows/standalone-consignment-common-steps';

/**
 * The FFD standalone "Transport Details" task, from the task list through to Finish
 * (which creates the consignment and lands on its overview).
 *
 * The screen list is a fact about this journey, so it is the method order below. FFD
 * asks for representation AND a vehicle AND an arrival date/time - the widest of the
 * three journeys.
 *
 * It also reaches screens neither IMMI nor SFD has: flight details, inland mode of
 * transport, the intended declaration type, and - only for customs warehousing - the
 * warehouse type. Those are not modelled yet; they go here as they are built, which
 * is why this journey has its own wizard rather than flags on a shared one.
 *
 * Steps identical across SFD/FFD/IMMI (pre-lodged/arrived, type of movement,
 * vehicle, exporter, trader reference, invoice currency) are delegated to
 * StandaloneConsignmentCommonSteps; representation and arrival remain
 * FFD-specific here.
 */
export class AddNewFfdStandaloneConsignmentFlow {
    constructor(
        private readonly taskListPage: TaskListPage,
        private readonly standalonePage: StandaloneConsignmentDeclarePage,
        private readonly movementDeclarePage: MovementDeclarePage,
        private readonly consignmentDeclarePage: ConsignmentDeclarePage,
        private readonly commonSteps: StandaloneConsignmentCommonSteps =
            new StandaloneConsignmentCommonSteps(standalonePage, movementDeclarePage, consignmentDeclarePage),
    ) { }

    async addNewFfdStandaloneConsignment(input: FfdStandaloneConsignmentData): Promise<void> {
        await ReportLog.step('Add new FFD standalone consignment', async () => {
            await this.taskListPage.clickTransportDetails();
            await this.commonSteps.declarePreLodgedOrArrived(input);
            await this.fillRepresentation(input);
            await this.commonSteps.chooseTypeOfMovement(input);
            await this.commonSteps.fillVehicleDetails(input.vehicleRegistration);
            await this.fillArrival(input);
            await this.commonSteps.fillExporter(input);
            await this.commonSteps.fillTraderReference(input.traderReference);
            await this.commonSteps.fillInvoiceCurrency(input.invoiceCurrency);
            await this.standalonePage.clickFinishButton();
        });
    }

    /**
     * "Representation information" follows pre-lodge (its Back link points there).
     * Shown only when the agent represents a trader - an importer signing in as their
     * own company skips the screen, which the data says by leaving representationType
     * undefined.
     */
    private async fillRepresentation(input: FfdStandaloneConsignmentData): Promise<void> {
        const { representationType } = input;
        if (!representationType) {
            return;
        }
        await ReportLog.step('Select representation type', async () => {
            await this.standalonePage.selectRepresentationType(representationType);
        });
    }

    /**
     * "When and where will the goods arrive?" - the port is always asked. The date and
     * time are asked only for a PRE-LODGED movement: goods declared as already arrived
     * have no future arrival to state.
     */
    private async fillArrival(input: FfdStandaloneConsignmentData): Promise<void> {
        await ReportLog.step('Enter arrival details', async () => {
            if (input.isPreLodged) {
                await this.movementDeclarePage.inputArrivalDateTime(input.arrivalDateTime);
            }
            await this.movementDeclarePage.selectPortOfArrival(input.portOfArrival);
            await this.movementDeclarePage.clickContinueButton();
        });
    }
}
