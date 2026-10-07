import { MovementDeclarePage, ArrivalDateTimeOptions } from '../../page-object/movement-declare-page';
import { ReportLog } from '../../core/report/report-log';

/**
 * One method per movement wizard screen: it owns that screen's Allure step name, so
 * every journey reports the same screen under the same name.
 *
 * NOT a page object — it holds no locators. Locators and raw interaction stay in
 * MovementDeclarePage; this layer decides what a screen means for a journey, and the
 * per-journey flows decide which screens they visit and in what order.
 *
 * Used from BOTH sides of the suite: the ENS journeys reach these screens through
 * their own movement task, and the standalone journeys reach several of them inside
 * their single consignment wizard. That is why the methods take plain values rather
 * than a journey's data object — ENS and standalone carry unrelated data types, so a
 * shared screen cannot depend on either.
 *
 */
export class MovementSteps {
    constructor(
        private readonly movementDeclarePage: MovementDeclarePage,
    ) { }

    // ===================== Means of transport =====================

    async chooseTypeOfMovement(typeOfMovement: string): Promise<void> {
        await ReportLog.step('Choose the type of movement', async () => {
            // chooseTypeOfMovement selects AND continues, so this step ends with the
            // next screen already open. Do not add a Continue: it would submit that
            // screen blind, which only fails validation (and so looks harmless) while
            // the screen is empty - the moment the app pre-fills a value the extra
            // Continue succeeds, the wizard advances a screen, and the next step
            // cannot find its field.
            await this.movementDeclarePage.chooseTypeOfMovement(typeOfMovement);
        });
    }

    async inputMeansOfTransport(imoNumber: string, nationality: string): Promise<void> {
        await ReportLog.step('Input IMO number and nationality of the means of transport', async () => {
            await this.movementDeclarePage.inputImoAndNationalityOfMeanOfTransport(imoNumber, nationality);
            await this.movementDeclarePage.clickContinueButton();
        });
    }

    async inputTrailerRegistrationNumber(trailerRegistrationNumber?: string): Promise<void> {
        await ReportLog.step('Input the trailer registration number', async () => {
            await this.movementDeclarePage.inputTrailerRegistrationNumber(trailerRegistrationNumber);
            await this.movementDeclarePage.clickContinueButton();
        });
    }

    async selectTypeOfPassiveTransport(typeOfPassiveTransport: string): Promise<void> {
        await ReportLog.step('Select the type of passive transport', async () => {
            await this.movementDeclarePage.selectTypeOfPassiveTransport(typeOfPassiveTransport);
            await this.movementDeclarePage.clickContinueButton();
        });
    }

    /**
     * The standalone "Enter vehicle details" screen — registration AND nationality on
     * one screen. ENS asks those two on separate screens, so this is its own step.
     */
    async enterVehicleDetails(vehicleRegistrationNumber: string, nationality: string): Promise<void> {
        await ReportLog.step('Enter vehicle details', async () => {
            await this.movementDeclarePage.enterVehicleDetails(vehicleRegistrationNumber, nationality);
        });
    }

    /** The unaccompanied twin of the step above: a trailer instead of a vehicle. */
    async enterTrailerDetails(trailerRegistrationNumber: string, nationality: string): Promise<void> {
        await ReportLog.step('Enter trailer details', async () => {
            await this.movementDeclarePage.enterTrailerDetails(trailerRegistrationNumber, nationality);
        });
    }

    /** The ILP Air twin: a flight number instead of a registration. */
    async enterFlightDetails(iataFlightNumber: string, nationality: string): Promise<void> {
        await ReportLog.step('Enter flight details', async () => {
            await this.movementDeclarePage.enterFlightDetails(iataFlightNumber, nationality);
        });
    }

    /** The ILP Maritime twin: an IMO number instead of a registration. */
    async enterVesselDetails(imoNumber: string, nationality: string): Promise<void> {
        await ReportLog.step('Enter vessel details', async () => {
            await this.movementDeclarePage.enterVesselDetails(imoNumber, nationality);
        });
    }

    async inputVehicleRegistrationNumber(vehicleRegistrationNumber?: string): Promise<void> {
        await ReportLog.step('Input the vehicle registration number', async () => {
            await this.movementDeclarePage.inputVehicleRegistrationNumber(vehicleRegistrationNumber);
            await this.movementDeclarePage.clickContinueButton();
        });
    }

    // ===================== Responsibility =====================

    /** One screen, two radios: the role and whether a separate haulier is involved. */
    async declareBusinessRole(role: string): Promise<void> {
        await ReportLog.step('Answer "What role does your business have in this movement?"', async () => {
            await this.movementDeclarePage.chooseBusinessRole(role);
            await this.movementDeclarePage.clickContinueButton();
            ReportLog.setParameter('Business role', role);
        });
    }

    /** Only when declaring on behalf of the carrier. */
    async inputCarrierEori(carrierEori: string): Promise<void> {
        await ReportLog.step('Input the carrier EORI', async () => {
            await this.movementDeclarePage.inputCarrierEori(carrierEori);
            await this.movementDeclarePage.clickContinueButton();
        });
    }

    /** Only when the haulier is separate from the carrier. */
    async inputHaulierEori(haulierEori: string): Promise<void> {
        await ReportLog.step('Input the haulier EORI', async () => {
            await this.movementDeclarePage.inputHaulierEori(haulierEori);
            await this.movementDeclarePage.clickContinueButton();
        });
    }

    // ===================== Arrival =====================

    async inputArrivalDateTime(
        arrivalDateTime?: string,
        options?: ArrivalDateTimeOptions
    ): Promise<void> {
        await ReportLog.step('Input when the goods will arrive', async () => {
            await this.movementDeclarePage.inputArrivalDateTime(arrivalDateTime, options);
            await this.movementDeclarePage.clickContinueButton();
        });
    }

    async selectPortOfArrival(portOfArrival: string): Promise<void> {
        await ReportLog.step('Select the port of arrival', async () => {
            await this.movementDeclarePage.selectPortOfArrival(portOfArrival);
            await this.movementDeclarePage.clickContinueButton();
        });
    }

    async chooseArrivalLocation(portOfArrival: string): Promise<void> {
        await ReportLog.step('Choose where the goods will arrive', async () => {
            await this.movementDeclarePage.chooseArrivalLocation(portOfArrival);
            await this.movementDeclarePage.clickContinueButton();
        });
    }

    /**
     * The arrived branch's arrival screen (`arrival-details-others`), which asks where
     * the goods are in one of TWO ways: pick a listed port, or type an alternative one.
     *
     * They are mutually EXCLUSIVE, and the app enforces it - answering both is rejected
     * with "Select a port of arrival from the list or enter an alternative port below,
     * but not both" (measured on sit 2026-08-12). So the alternative, when a journey
     * supplies one, REPLACES the dropdown rather than adding to it.
     *
     * A separate step rather than an optional argument on selectPortOfArrival above,
     * because the second field only EXISTS here - the shared step serves ENS, SFD and
     * FFD, where filling it would spend the full action timeout on a missing input.
     */
    async enterLocationOfGoods(
        portOfArrival: string,
        alternativePort?: string
    ): Promise<void> {
        await ReportLog.step('Enter the location of goods', async () => {
            if (alternativePort) {
                await this.movementDeclarePage.inputPortOfArrivalOthers(alternativePort);
            } else {
                await this.movementDeclarePage.selectPortOfArrival(portOfArrival);
            }
            await this.movementDeclarePage.clickContinueButton();
        });
    }

    /**
     * The FFD standalone arrival screen, which asks for the date/time AND the port
     * together — elsewhere they are two screens with a Continue each. A separate
     * method rather than a flag on the two above, because it really is a third screen.
     * The date is omitted for an arrived movement: it has no future arrival to state.
     */
    async enterArrivalDateTimeAndPort(portOfArrival: string, arrivalDateTime?: string): Promise<void> {
        await ReportLog.step('Enter arrival details', async () => {
            if (arrivalDateTime !== undefined) {
                await this.movementDeclarePage.inputArrivalDateTime(arrivalDateTime);
            }
            await this.movementDeclarePage.selectPortOfArrival(portOfArrival);
            await this.movementDeclarePage.clickContinueButton();
        });
    }

    // ===================== Loading, acceptance, unloading, delivery =====================

    async inputPlaceOfLoading(placeOfLoading: string): Promise<void> {
        await ReportLog.step('Input the place of loading', async () => {
            await this.movementDeclarePage.inputPlaceOfLoading(placeOfLoading);
            await this.movementDeclarePage.clickContinueButton();
        });
    }

    /** Answering no adds the place-of-acceptance screen. */
    async declareAcceptanceSameAsLoading(isSame: boolean): Promise<void> {
        await ReportLog.step('Answer "Are the goods accepted where they are loaded?"', async () => {
            if (isSame) {
                await this.movementDeclarePage.selectAcceptanceSameAsloading();
            } else {
                await this.movementDeclarePage.selectAcceptanceNotSameAsloading();
            }
        });
    }

    async inputPlaceOfAcceptance(placeOfAcceptance: string): Promise<void> {
        await ReportLog.step('Input the place of acceptance', async () => {
            await this.movementDeclarePage.inputPlaceOfAcceptance(placeOfAcceptance);
        });
    }

    async inputPlaceOfUnloading(placeOfUnloading: string): Promise<void> {
        await ReportLog.step('Input the place of unloading', async () => {
            await this.movementDeclarePage.inputPlaceOfUnloading(placeOfUnloading);
            await this.movementDeclarePage.clickContinueButton();
        });
    }

    /** Answering no adds the place-of-delivery screen. */
    async declareDeliverySameAsUnloading(isSame: boolean): Promise<void> {
        await ReportLog.step('Answer "Are the goods delivered where they are unloaded?"', async () => {
            if (isSame) {
                await this.movementDeclarePage.selectDeliverySameAsUnloading();
            } else {
                await this.movementDeclarePage.selectDeliveryNotSameAsUnloading();
            }
        });
    }

    async inputPlaceOfDelivery(placeOfDelivery: string): Promise<void> {
        await ReportLog.step('Input the place of delivery', async () => {
            await this.movementDeclarePage.inputPlaceOfDelivery(placeOfDelivery);
        });
    }

    // ===================== Tail =====================

    async selectTransportCharges(transportCharges: string): Promise<void> {
        await ReportLog.step('Select the method of payment for transport charges', async () => {
            await this.movementDeclarePage.selectTransportCharges(transportCharges);
            await this.movementDeclarePage.clickContinueButton();
        });
    }

    async finishMovementDeclaration(): Promise<void> {
        await ReportLog.step('Finish movement header declaration', async () => {
            await this.movementDeclarePage.clickFinishButton();
        });
    }
}
