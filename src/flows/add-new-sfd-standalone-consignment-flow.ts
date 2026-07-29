import { TaskListPage } from '../page-object/task-list-page';
import { StandaloneConsignmentDeclarePage } from '../page-object/standalone-consignment-declare-page';
import { MovementDeclarePage } from '../page-object/movement-declare-page';
import { ConsignmentDeclarePage } from '../page-object/consignment-declare-page';
import { SfdStandaloneConsignmentData } from '../test-data/sfd-standalone-consignment-data';
import { PartyAddress } from '../page-object/components/party-block';
import { ReportLog } from '../core/report/report-log';

/**
 * The SFD standalone "Transport Details" task, from the task list through to Finish
 * (which creates the consignment and lands on its overview).
 *
 * The screen list is a fact about this journey, so it is the method order below.
 * SFD is the only standalone journey with NO "Representation information" screen; it
 * does have the vehicle screen, and its arrival screen asks for a date/time when the
 * movement is pre-lodged.
 */
export class AddNewSfdStandaloneConsignmentFlow {
    constructor(
        private readonly taskListPage: TaskListPage,
        private readonly standalonePage: StandaloneConsignmentDeclarePage,
        private readonly movementDeclarePage: MovementDeclarePage,
        private readonly consignmentDeclarePage: ConsignmentDeclarePage,
    ) { }

    async addNewSfdStandaloneConsignment(input: SfdStandaloneConsignmentData): Promise<void> {
        await ReportLog.step('Add new SFD standalone consignment', async () => {
            await this.taskListPage.clickTransportDetails();
            await this.declarePreLodgedOrArrived(input);
            await this.chooseTypeOfMovement(input);
            await this.fillVehicleDetails(input);
            await this.fillArrivalDateTime(input);
            await this.fillPortOfArrival(input);
            await this.declareControlledGoods(input);
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
    private async declarePreLodgedOrArrived(input: SfdStandaloneConsignmentData): Promise<void> {
        const answer = input.isPreLodged ? 'Pre-lodged' : 'Arrived';
        await ReportLog.step(`Declare movement as ${answer}`, async () => {
            if (input.isPreLodged) {
                await this.standalonePage.selectPreLodged();
            } else {
                await this.standalonePage.selectArrived();
            }
        });
    }

    /** "What type of movement is this?" - chooseTypeOfMovement selects and continues in one step. */
    private async chooseTypeOfMovement(input: SfdStandaloneConsignmentData): Promise<void> {
        await ReportLog.step('Choose type of movement', async () => {
            await this.movementDeclarePage.chooseTypeOfMovement(input.typeOfMovement);
        });
    }

    private async fillVehicleDetails(input: SfdStandaloneConsignmentData): Promise<void> {
        await ReportLog.step('Enter transport details (vehicle)', async () => {
            await this.movementDeclarePage.inputVehicleRegistrationNumber(input.vehicleRegistration);
            await this.movementDeclarePage.clickContinueButton();
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

    /**
     * "Does this consignment contain controlled goods?" - its own screen, reached
     * straight after the port of arrival. selectControlledGoodsYes/No each continue.
     */
    private async declareControlledGoods(input: SfdStandaloneConsignmentData): Promise<void> {
        await ReportLog.step('Declare controlled goods', async () => {
            if (input.isControlledGoods) {
                await this.consignmentDeclarePage.selectControlledGoodsYes();
            } else {
                await this.consignmentDeclarePage.selectControlledGoodsNo();
            }
        });
    }

    private async fillExporter(input: SfdStandaloneConsignmentData): Promise<void> {
        await ReportLog.step('Fill Exporter information', async () => {
            await this.consignmentDeclarePage.inputExporterDetails(input.exporterEORI, exporterAddress(input));
        });
    }

    /**
     * Trader reference and invoice currency are two consecutive screens, each with
     * its own Continue - so they report as two steps rather than one, and a failure
     * names the screen it happened on.
     */
    private async fillTraderReference(input: SfdStandaloneConsignmentData): Promise<void> {
        await ReportLog.step('Enter trader reference', async () => {
            await this.consignmentDeclarePage.inputTraderReference(input.traderReference);
        });
    }

    private async fillInvoiceCurrency(input: SfdStandaloneConsignmentData): Promise<void> {
        await ReportLog.step('Select invoice currency', async () => {
            await this.consignmentDeclarePage.selectInvoiceCurrency(input.invoiceCurrency);
        });
    }
}

const exporterAddress = (i: SfdStandaloneConsignmentData): PartyAddress => ({
    name: i.exporterName, streetName: i.exporterStreetName, streetNumber: i.exporterStreetNumber,
    city: i.exporterCity, postCode: i.exporterPostCode, country: i.exporterCountryCode,
});
