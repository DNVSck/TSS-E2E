import { TaskListPage } from '../page-object/task-list-page';
import { StandaloneConsignmentDeclarePage } from '../page-object/standalone-consignment-declare-page';
import { MovementDeclarePage } from '../page-object/movement-declare-page';
import { ConsignmentDeclarePage } from '../page-object/consignment-declare-page';
import { ImmiStandaloneConsignmentData } from '../test-data/immi-standalone-consignment-data';
import { ReportLog } from '../core/report/report-log';
import { StandaloneConsignmentCommonSteps } from './common-flows/standalone-consignment-common-steps';

/**
 * The IMMI standalone "Transport Details" task, from the task list through to Finish
 * (which creates the consignment and lands on its overview).
 *
 * The screen list is a fact about this journey, so it is the method order below -
 * there is no structure table to consult. IMMI has NO vehicle screen, and its
 * arrival screen asks for the port only: no date/time, pre-lodged or arrived.
 *
 * The screens themselves are shared with the ENS wizards, so they are driven through
 * MovementDeclarePage and ConsignmentDeclarePage; only Pre-lodged or arrived is
 * standalone-specific.
 *
 * Steps identical across SFD/FFD/IMMI (pre-lodged/arrived, type of movement,
 * exporter, trader reference, invoice currency) are delegated to
 * StandaloneConsignmentCommonSteps; representation and the port-only arrival
 * screen remain IMMI-specific here.
 */
export class AddNewImmiStandaloneConsignmentFlow {
    constructor(
        private readonly taskListPage: TaskListPage,
        private readonly standalonePage: StandaloneConsignmentDeclarePage,
        private readonly movementDeclarePage: MovementDeclarePage,
        private readonly consignmentDeclarePage: ConsignmentDeclarePage,
        private readonly commonSteps: StandaloneConsignmentCommonSteps =
            new StandaloneConsignmentCommonSteps(standalonePage, movementDeclarePage, consignmentDeclarePage),
    ) { }

    async addNewImmiStandaloneConsignment(input: ImmiStandaloneConsignmentData): Promise<void> {
        await ReportLog.step('Add new IMMI standalone consignment', async () => {
            await this.taskListPage.clickTransportDetails();
            await this.commonSteps.declarePreLodgedOrArrived(input);
            await this.fillRepresentation(input);
            await this.commonSteps.chooseTypeOfMovement(input);
            await this.fillArrivalDateTime(input);
            await this.fillPortOfArrival(input);
            await this.commonSteps.fillExporter(input);
            await this.commonSteps.fillTraderReference(input.traderReference);
            await this.commonSteps.fillInvoiceCurrency(input.invoiceCurrency);
            await this.standalonePage.clickFinishButton();
        });
    }

    /**
     * "Representation information" follows pre-lodge (its Back link points there).
     * IMMI asks it, but only when the agent represents a trader - an importer signing
     * in as their own company skips the screen, which the data says by leaving
     * representationType undefined.
     */
    private async fillRepresentation(input: ImmiStandaloneConsignmentData): Promise<void> {
        const { representationType } = input;
        if (!representationType) {
            return;
        }
        await ReportLog.step('Select representation type', async () => {
            await this.standalonePage.selectRepresentationType(representationType);
        });
    }

    /**
     * "Where will the goods arrive?" - the only arrival screen IMMI shows. The
     * separate date/time screen SFD and FFD reach is never rendered here, pre-lodged
     * or arrived, which is why ImmiStandaloneConsignmentData carries no arrivalDateTime.
     */
    private async fillPortOfArrival(input: ImmiStandaloneConsignmentData): Promise<void> {
        await ReportLog.step('Select port of arrival', async () => {
            await this.movementDeclarePage.selectPortOfArrival(input.portOfArrival);
            await this.movementDeclarePage.clickContinueButton();
        });
    }

    private async fillArrivalDateTime(input: ImmiStandaloneConsignmentData): Promise<void> {
        if (!input.isPreLodged) {
            return;
        }
        await ReportLog.step('Enter arrival date and time', async () => {
            await this.movementDeclarePage.inputArrivalDateTime(input.arrivalDateTime);
            await this.movementDeclarePage.clickContinueButton();
        });
    }
}
