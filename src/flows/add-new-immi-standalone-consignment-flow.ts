import { TaskListPage } from '../page-object/task-list-page';
import { StandaloneConsignmentDeclarePage } from '../page-object/standalone-consignment-declare-page';
import { MovementDeclarePage } from '../page-object/movement-declare-page';
import { ConsignmentDeclarePage } from '../page-object/consignment-declare-page';
import { ImmiStandaloneConsignmentData } from '../test-data/immi-standalone-consignment-data';
import { PartyAddress } from '../page-object/components/party-block';
import { ReportLog } from '../core/report/report-log';

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
 */
export class AddNewImmiStandaloneConsignmentFlow {
    constructor(
        private readonly taskListPage: TaskListPage,
        private readonly standalonePage: StandaloneConsignmentDeclarePage,
        private readonly movementDeclarePage: MovementDeclarePage,
        private readonly consignmentDeclarePage: ConsignmentDeclarePage,
    ) { }

    async addNewImmiStandaloneConsignment(input: ImmiStandaloneConsignmentData): Promise<void> {
        await ReportLog.step('Add new IMMI standalone consignment', async () => {
            await this.taskListPage.clickTransportDetails();
            await this.declarePreLodgedOrArrived(input);
            await this.fillRepresentation(input);
            await this.chooseTypeOfMovement(input);
            await this.fillPortOfArrival(input);
            await this.fillExporter(input);
            await this.fillTraderReference(input);
            await this.fillInvoiceCurrency(input);
            await this.standalonePage.clickFinishButton();
        });
    }

    /**
     * "Is this a pre-lodged or arrived movement?" opens the wizard. The step name
     * carries the answer, since that is the one thing this screen contributes to the
     * report. Unlike SFD/FFD the answer shapes nothing further on IMMI.
     */
    private async declarePreLodgedOrArrived(input: ImmiStandaloneConsignmentData): Promise<void> {
        const answer = input.isPreLodged ? 'Pre-lodged' : 'Arrived';
        await ReportLog.step(`Declare movement as ${answer}`, async () => {
            if (input.isPreLodged) {
                await this.standalonePage.selectPreLodged();
            } else {
                await this.standalonePage.selectArrived();
            }
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

    /** "What type of movement is this?" - chooseTypeOfMovement selects and continues in one step. */
    private async chooseTypeOfMovement(input: ImmiStandaloneConsignmentData): Promise<void> {
        await ReportLog.step('Choose type of movement', async () => {
            await this.movementDeclarePage.chooseTypeOfMovement(input.typeOfMovement);
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

    private async fillExporter(input: ImmiStandaloneConsignmentData): Promise<void> {
        await ReportLog.step('Fill Exporter information', async () => {
            await this.consignmentDeclarePage.inputExporterDetails(input.exporterEORI, exporterAddress(input));
        });
    }

    /**
     * Trader reference and invoice currency are two consecutive screens, each with
     * its own Continue - so they report as two steps rather than one, and a failure
     * names the screen it happened on.
     */
    private async fillTraderReference(input: ImmiStandaloneConsignmentData): Promise<void> {
        await ReportLog.step('Enter trader reference', async () => {
            await this.consignmentDeclarePage.inputTraderReference(input.traderReference);
        });
    }

    private async fillInvoiceCurrency(input: ImmiStandaloneConsignmentData): Promise<void> {
        await ReportLog.step('Select invoice currency', async () => {
            await this.consignmentDeclarePage.selectInvoiceCurrency(input.invoiceCurrency);
        });
    }
}

const exporterAddress = (i: ImmiStandaloneConsignmentData): PartyAddress => ({
    name: i.exporterName, streetName: i.exporterStreetName, streetNumber: i.exporterStreetNumber,
    city: i.exporterCity, postCode: i.exporterPostCode, country: i.exporterCountryCode,
});
