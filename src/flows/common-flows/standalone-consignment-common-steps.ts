import { StandaloneConsignmentDeclarePage } from '../../page-object/standalone-consignment-declare-page';
import { MovementDeclarePage } from '../../page-object/movement-declare-page';
import { ConsignmentDeclarePage } from '../../page-object/consignment-declare-page';
import { ReportLog } from '../../core/report/report-log';
import { toPartyAddress } from './party-address-mapper';

/**
 * The fields every standalone-consignment flow needs from its own input type to
 * drive the steps below. Each journey's *ConsignmentData still owns its full,
 * journey-specific shape (with fields these steps never touch, e.g. FFD's
 * representationType) - this is only the slice that is common to all three.
 */
export interface StandaloneConsignmentCommonFields {
    isPreLodged: boolean;
    typeOfMovement: string;
    exporterEORI: string;
    traderReference: string;
    invoiceCurrency: string;
    exporterName: string;
    exporterStreetName: string;
    exporterStreetNumber: string;
    exporterCity: string;
    exporterPostCode: string;
    exporterCountryCode: string;
}

/**
 * Steps shared, verbatim, by every standalone consignment journey (SFD, FFD,
 * IMMI): declare pre-lodged/arrived, choose type of movement, the vehicle
 * screen, exporter, trader reference, invoice currency, and the
 * "does it cross the EU border?" / container screens.
 *
 * Journey-specific steps (arrival date/time+port, representation, controlled
 * goods, ...) stay on each journey's own flow class, since those differ
 * enough between SFD/FFD/IMMI that forcing them in here would recreate the
 * branch-heavy wizard these standalone flows were deliberately split out of.
 */
export class StandaloneConsignmentCommonSteps {
    constructor(
        private readonly standalonePage: StandaloneConsignmentDeclarePage,
        private readonly movementDeclarePage: MovementDeclarePage,
        private readonly consignmentDeclarePage: ConsignmentDeclarePage,
    ) { }

    /**
     * "Is this a pre-lodged or arrived movement?" opens the wizard. The step
     * name carries the answer, since that is what a report reader needs at a
     * glance.
     */
    async declarePreLodgedOrArrived(input: Pick<StandaloneConsignmentCommonFields, 'isPreLodged'>): Promise<void> {
        const answer = input.isPreLodged ? 'Pre-lodged' : 'Arrived';
        await ReportLog.step(`Declare movement as ${answer}`, async () => {
            if (input.isPreLodged) {
                await this.standalonePage.selectPreLodged();
            } else {
                await this.standalonePage.selectArrived();
            }
        });
    }

    /** "What type of movement is this?" - selects and continues in one step. */
    async chooseTypeOfMovement(input: Pick<StandaloneConsignmentCommonFields, 'typeOfMovement'>): Promise<void> {
        await ReportLog.step('Choose type of movement', async () => {
            await this.movementDeclarePage.chooseTypeOfMovement(input.typeOfMovement);
        });
    }

    /** The vehicle registration screen, shared by SFD and FFD (IMMI has none). */
    async fillVehicleDetails(vehicleRegistration: string): Promise<void> {
        await ReportLog.step('Enter transport details (vehicle)', async () => {
            await this.movementDeclarePage.inputVehicleRegistrationNumber(vehicleRegistration);
            await this.movementDeclarePage.clickContinueButton();
        });
    }

    async fillExporter(input: StandaloneConsignmentCommonFields): Promise<void> {
        await ReportLog.step('Fill Exporter information', async () => {
            await this.consignmentDeclarePage.inputExporterDetails(
                input.exporterEORI,
                toPartyAddress('exporter', input),
            );
        });
    }

    /**
     * Trader reference and invoice currency are two consecutive screens, each
     * with its own Continue - so they report as two steps rather than one, and
     * a failure names the screen it happened on.
     */
    async fillTraderReference(traderReference: string): Promise<void> {
        await ReportLog.step('Enter trader reference', async () => {
            await this.consignmentDeclarePage.inputTraderReference(traderReference);
        });
    }

    async fillInvoiceCurrency(invoiceCurrency: string): Promise<void> {
        await ReportLog.step('Select invoice currency', async () => {
            await this.consignmentDeclarePage.selectInvoiceCurrency(invoiceCurrency);
        });
    }

    /**
     * "Does this consignment contain controlled goods?" - shared by SFD
     * standalone and (in a slightly different spot) ENS. Kept here since SFD
     * standalone is the only standalone journey that asks it.
     */
    async declareControlledGoods(isControlledGoods: boolean): Promise<void> {
        await ReportLog.step('Declare controlled goods', async () => {
            if (isControlledGoods) {
                await this.consignmentDeclarePage.selectControlledGoodsYes();
            } else {
                await this.consignmentDeclarePage.selectControlledGoodsNo();
            }
        });
    }

    /**
     * "Does this consignment cross the EU external border?" and, when yes,
     * the container screens. Identical between SFD standalone and ENS
     * (add-new-consignment-flow.ts) - both drive the same ConsignmentDeclarePage
     * screens off the same three answers.
     */
    async fillBorderAndContainerInformation(input: {
        isGoodsCrossEUBorder: boolean;
        isSameContainer: boolean;
        containerIdentifierNumber: string;
        containerSize: string;
        containerPackedStatus: string;
        containerSupplierType: string;
    }): Promise<void> {
        await ReportLog.step('Fill Border and container information', async () => {
            if (!input.isGoodsCrossEUBorder) {
                await this.consignmentDeclarePage.selectGoodsCrossEUBorderNo();
                return;
            }

            await this.consignmentDeclarePage.selectGoodsCrossEUBorderYes();

            if (input.isSameContainer) {
                await this.consignmentDeclarePage.selectAllGoodsInSameContainersYes();
                await this.consignmentDeclarePage.fillContainerIdentification(
                    input.containerIdentifierNumber,
                    input.containerSize,
                    input.containerPackedStatus,
                    input.containerSupplierType,
                );
            } else {
                await this.consignmentDeclarePage.selectAllGoodsInSameContainersNo();
            }
        });
    }
}
