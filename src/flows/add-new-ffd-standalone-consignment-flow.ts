import { TaskListPage } from '../page-object/task-list-page';
import { StandaloneConsignmentDeclarePage } from '../page-object/standalone-consignment-declare-page';
import { MovementDeclarePage } from '../page-object/movement-declare-page';
import { ConsignmentDeclarePage } from '../page-object/consignment-declare-page';
import { FfdStandaloneConsignmentData } from '../test-data/ffd-standalone-consignment-data';
import { PartyAddress } from '../page-object/components/party-block';
import { ReportLog } from '../core/report/report-log';

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
 */
export class AddNewFfdStandaloneConsignmentFlow {
    constructor(
        private readonly taskListPage: TaskListPage,
        private readonly standalonePage: StandaloneConsignmentDeclarePage,
        private readonly movementDeclarePage: MovementDeclarePage,
        private readonly consignmentDeclarePage: ConsignmentDeclarePage,
    ) { }

    async addNewFfdStandaloneConsignment(input: FfdStandaloneConsignmentData): Promise<void> {
        await ReportLog.step('Add new FFD standalone consignment', async () => {
            await this.taskListPage.clickTransportDetails();
            await this.declarePreLodgedOrArrived(input);
            await this.fillRepresentation(input);
            await this.chooseTypeOfMovement(input);
            await this.fillVehicleDetails(input);
            await this.fillArrival(input);
            await this.fillExporter(input);
            await this.fillTraderReference(input);
            await this.fillInvoiceCurrency(input);
            await this.standalonePage.clickFinishButton();
        });
    }

    /**
     * "Is this a pre-lodged or arrived movement?" opens the wizard. The step name
     * carries the answer: it also decides whether the arrival screen asks for a
     * date/time further down - see fillArrival.
     */
    private async declarePreLodgedOrArrived(input: FfdStandaloneConsignmentData): Promise<void> {
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

    /** "What type of movement is this?" - chooseTypeOfMovement selects and continues in one step. */
    private async chooseTypeOfMovement(input: FfdStandaloneConsignmentData): Promise<void> {
        await ReportLog.step('Choose type of movement', async () => {
            await this.movementDeclarePage.chooseTypeOfMovement(input.typeOfMovement);
        });
    }

    private async fillVehicleDetails(input: FfdStandaloneConsignmentData): Promise<void> {
        await ReportLog.step('Enter transport details (vehicle)', async () => {
            await this.movementDeclarePage.inputVehicleRegistrationNumber(input.vehicleRegistration);
            await this.movementDeclarePage.clickContinueButton();
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

    private async fillExporter(input: FfdStandaloneConsignmentData): Promise<void> {
        await ReportLog.step('Fill Exporter information', async () => {
            await this.consignmentDeclarePage.inputExporterDetails(input.exporterEORI, exporterAddress(input));
        });
    }

    /**
     * Trader reference and invoice currency are two consecutive screens, each with
     * its own Continue - so they report as two steps rather than one, and a failure
     * names the screen it happened on.
     */
    private async fillTraderReference(input: FfdStandaloneConsignmentData): Promise<void> {
        await ReportLog.step('Enter trader reference', async () => {
            await this.consignmentDeclarePage.inputTraderReference(input.traderReference);
        });
    }

    private async fillInvoiceCurrency(input: FfdStandaloneConsignmentData): Promise<void> {
        await ReportLog.step('Select invoice currency', async () => {
            await this.consignmentDeclarePage.selectInvoiceCurrency(input.invoiceCurrency);
        });
    }
}

const exporterAddress = (i: FfdStandaloneConsignmentData): PartyAddress => ({
    name: i.exporterName, streetName: i.exporterStreetName, streetNumber: i.exporterStreetNumber,
    city: i.exporterCity, postCode: i.exporterPostCode, country: i.exporterCountryCode,
});
