import { TaskListPage } from '../page-object/task-list-page';
import { StandaloneConsignmentDeclarePage } from '../page-object/standalone-consignment-declare-page';
import { MovementDeclarePage } from '../page-object/movement-declare-page';
import { ConsignmentDeclarePage } from '../page-object/consignment-declare-page';
import { StandaloneConsignmentData, exporterAddress } from '../test-data/standalone-consignment-data';
import { INITIAL_FORM_DECLARATION } from '../constant/initial-form-declaration-constants';
import { LOCAL_REFERENCE } from '../constant/local-reference-constants';
import { ReportLog } from '../core/report/report-log';

/** Which screens a standalone journey shows, derived from its declaration type. */
interface StandaloneStructure {
    hasRepresentationScreen: boolean;
    hasVehicleScreen: boolean;
    /** The prefix the service gives this journey's consignment reference. */
    referencePrefix: RegExp;
}

const { INTERNAL_MARKET_MOVEMENT_INFORMATION, SIMPLIFIED_DECLARATION, STANDARD_DECLARATION } =
    INITIAL_FORM_DECLARATION.STANDALONE_DECLARATION_TYPE;

/**
 * The journey structure is a fact about the declaration type, not test data, so it
 * lives here (single source of truth) rather than as fields on StandaloneConsignmentData.
 * IMMI skips the vehicle screen; SFD and FFD add it. Only IMMI and FFD ask about
 * representation - SFD never shows that screen. Each journey also stamps its own
 * reference prefix on the consignment it creates.
 *
 * The arrival screen is NOT listed here: all three journeys ask for the port, and
 * whether they also ask for the date/time follows the pre-lodged/arrived choice,
 * which is test data - see fillArrival.
 */
const STANDALONE_STRUCTURE: Record<string, StandaloneStructure> = {
    [INTERNAL_MARKET_MOVEMENT_INFORMATION]: {
        hasRepresentationScreen: true,
        hasVehicleScreen: false,
        referencePrefix: LOCAL_REFERENCE.GLR_PREFIX,
    },
    [SIMPLIFIED_DECLARATION]: {
        hasRepresentationScreen: false,
        hasVehicleScreen: true,
        referencePrefix: LOCAL_REFERENCE.SFD_PREFIX,
    },
    [STANDARD_DECLARATION]: {
        hasRepresentationScreen: false,
        hasVehicleScreen: true,
        referencePrefix: LOCAL_REFERENCE.FFD_PREFIX,
    },
};

function standaloneStructure(declarationType: string): StandaloneStructure {
    const structure = STANDALONE_STRUCTURE[declarationType];
    if (!structure) {
        throw new Error(`No standalone journey structure for declaration type "${declarationType}".`);
    }
    return structure;
}

/**
 * The prefix this journey's consignment reference must start with, so the overview
 * check asserts the journey it actually ran rather than accepting any standalone
 * reference. Exported because the check happens on the overview, after this flow.
 */
export function standaloneReferencePrefix(declarationType: string): RegExp {
    return standaloneStructure(declarationType).referencePrefix;
}

/**
 * The standalone consignment "Transport Details" task, from the task list through
 * to Finish (which creates the consignment and lands on its overview). The screens
 * are the same as the ENS wizards, so they are reused from MovementDeclarePage and
 * ConsignmentDeclarePage; only Pre-lodged or arrived is standalone-specific.
 */
export class AddNewStandaloneConsignmentFlow {
    constructor(
        private readonly taskListPage: TaskListPage,
        private readonly standalonePage: StandaloneConsignmentDeclarePage,
        private readonly movementDeclarePage: MovementDeclarePage,
        private readonly consignmentDeclarePage: ConsignmentDeclarePage,
    ) { }

    async addNewStandaloneConsignment(input: StandaloneConsignmentData): Promise<void> {
        const structure = standaloneStructure(input.standaloneDeclarationType);
        await ReportLog.step('Add new standalone consignment', async () => {
            await this.taskListPage.clickTransportDetails();
            await this.declarePreLodgedOrArrived(input);
            await this.fillRepresentation(input, structure);
            // chooseTypeOfMovement selects and continues in one step.
            await this.movementDeclarePage.chooseTypeOfMovement(input.typeOfMovement);
            await this.fillVehicleDetails(input, structure);
            await this.fillArrival(input);
            await this.fillExporter(input);
            await this.fillTraderReferenceAndCurrency(input);
            await this.standalonePage.clickFinishButton();
        });
    }

    /**
     * "Is this a pre-lodged or arrived movement?" opens every standalone wizard. The
     * answer also shapes the arrival screen further down - see fillArrival.
     */
    private async declarePreLodgedOrArrived(input: StandaloneConsignmentData): Promise<void> {
        if (input.isPreLodged) {
            await this.standalonePage.selectPreLodged();
            return;
        }
        await this.standalonePage.selectArrived();
    }

    /**
     * "Representation information" follows pre-lodge (its Back link points there).
     * Two things have to be true for it to appear: the journey must ask at all (IMMI
     * and FFD do, SFD does not), and the agent must be representing a trader - an
     * importer signing in as their own company skips it, which the data says by
     * leaving representationType undefined.
     */
    private async fillRepresentation(
        input: StandaloneConsignmentData,
        structure: StandaloneStructure,
    ): Promise<void> {
        const { representationType } = input;
        if (!structure.hasRepresentationScreen || !representationType) {
            return;
        }
        await ReportLog.step('Select representation type', async () => {
            await this.standalonePage.selectRepresentationType(representationType);
        });
    }

    /** SFD/FFD ask for a vehicle registration here; IMMI skips this screen. */
    private async fillVehicleDetails(input: StandaloneConsignmentData, structure: StandaloneStructure): Promise<void> {
        if (!structure.hasVehicleScreen) {
            return;
        }
        await ReportLog.step('Enter transport details (vehicle)', async () => {
            await this.movementDeclarePage.inputVehicleRegistrationNumber(input.vehicleRegistration);
            await this.movementDeclarePage.clickContinueButton();
        });
    }

    /**
     * "When and where will the goods arrive?" - one screen, same on all three journeys.
     * The port is always asked. The date and time are asked only for a PRE-LODGED
     * movement: goods declared as already arrived have no future arrival to state.
     */
    private async fillArrival(input: StandaloneConsignmentData): Promise<void> {
        await ReportLog.step('Enter arrival details', async () => {
            if (input.isPreLodged) {
                await this.movementDeclarePage.inputArrivalDateTime(input.arrivalDateTime);
            }
            await this.movementDeclarePage.selectPortOfArrival(input.portOfArrival);
            await this.movementDeclarePage.clickContinueButton();
        });
    }

    private async fillExporter(input: StandaloneConsignmentData): Promise<void> {
        await ReportLog.step('Fill Exporter information', async () => {
            await this.consignmentDeclarePage.inputExporterDetails(input.exporterEORI, exporterAddress(input));
        });
    }

    private async fillTraderReferenceAndCurrency(input: StandaloneConsignmentData): Promise<void> {
        await ReportLog.step('Fill trader reference and invoice currency', async () => {
            await this.consignmentDeclarePage.inputTraderReference(input.traderReference);
            await this.consignmentDeclarePage.selectInvoiceCurrency(input.invoiceCurrency);
        });
    }
}
