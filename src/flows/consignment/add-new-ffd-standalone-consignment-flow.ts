import { FfdStandaloneConsignmentData } from '../../test-data/ffd-standalone-consignment-data';
import { toPartyAddress } from '../../page-object/components/party-block';
import { FfdStandaloneConsignmentDeclarePage } from '../../page-object/ffd-standalone-consignment-declare-page';
import { CommercialTermsDeclarePage } from '../../page-object/commercial-terms-declare-page';
import { ReportLog } from '../../core/report/report-log';
import { MovementSteps } from '../movement/movement-steps';
import { ConsignmentSteps } from './consignment-steps';
import { StandaloneConsignmentSteps } from './standalone-consignment-steps';
import { DECLARATION_PROCEDURE } from '../../constant/declaration-procedure-constant';
import { TYPE_OF_MOVEMENT_OPTION_CODE } from '../../constant/type-of-movement-code-constant';

/**
 * The FFD standalone "Transport Details" task, from the task list through to Finish
 * (which creates the consignment and lands on its overview).
 *
 * `addNewFfdStandaloneConsignment` IS the screen list, in the order the app asks for
 * them - verified by walking the wizard on ENV=test. Three answers reshape it, and
 * each is guarded there: pre-lodged adds the arrival date/time, customs warehousing
 * swaps the exporter and seller screens for the warehouse ones, and "buyer same as
 * importer" decides whether the buyer EORI is asked.
 *
 * Standalone has ONE wizard where ENS has two, so the spine draws on three shared step
 * libraries for the screens other journeys also have. The screens NO other journey
 * shows are the private steps at the bottom of this file: a step library exists to be
 * shared, and these have exactly one consumer. Give them their own class the day a
 * second journey needs them.
 *
 * Revisit both once the journey is corrected; the goods-item wizard is unmodelled too.
 */
export class AddNewFfdStandaloneConsignmentFlow {
    constructor(
        private readonly standaloneSteps: StandaloneConsignmentSteps,
        private readonly movementSteps: MovementSteps,
        private readonly consignmentSteps: ConsignmentSteps,
        private readonly ffdPage: FfdStandaloneConsignmentDeclarePage,
        private readonly commercialTermsPage: CommercialTermsDeclarePage,
    ) { }

    async addNewFfdStandaloneConsignment(input: FfdStandaloneConsignmentData): Promise<void> {
        await ReportLog.step('Add new FFD standalone consignment', async () => {
            await this.standaloneSteps.declarePreLodgedOrArrived(input.isPreLodged);

            // Asked only when the agent represents a trader; an importer signing in as
            // their own company skips it, which the data says by leaving it undefined.
            if (input.representationType) {
                await this.standaloneSteps.selectRepresentationType(input.representationType);
            }

            await this.movementSteps.chooseTypeOfMovement(input.typeOfMovement);
            await this.identifyMethodOfTransport(input);
            await this.selectInlandModeOfTransport(input.inlandModeOfTransport);

            // Goods declared as already arrived have no future arrival to state.
            if (input.isPreLodged) {
                await this.movementSteps.inputArrivalDateTime(input.arrivalDateTime);
            }
            await this.closeTransportBranch(input);

            await this.fillBuyerInformation(input);

            await this.selectDeclarationProcedure(input.declarationProcedure);
            await this.consignmentSteps.fillSfdTransportAndDestination(
                input.transportDocumentNumber, input.goodsDomesticStatus
            );
            await this.declareWarehouseOrParties(input);

            await this.consignmentSteps.fillTraderReference(input.traderReference);
            await this.standaloneSteps.declareTransportingInContainers(input.isTransportingInContainers);

            await this.enterDeliveryTerms(input.incoterm, input.isKnownUnlocode);
            await this.selectDeliveryCountry(input.deliveryCountryCode);
            await this.selectDeliveryPlace(input.deliveryPlaceUnlocode);

            await this.declareSameNatureOfGoods(input.isSameNatureOfGoods);
            // Saying every item shares one nature is what opens the screen that asks
            // what that nature is.
            if (input.isSameNatureOfGoods) {
                await this.selectNatureOfGoods(input.natureOfGoods);
            }

            await this.selectMethodOfPayment(input.methodOfPayment);
            await this.consignmentSteps.selectInvoiceCurrency(input.invoiceCurrency);

            await this.standaloneSteps.finishStandaloneConsignment();
        });
    }

    // ===================== Routing =====================
    // These pick which screens the answers open. They report nothing themselves.

    /**
     * SUSPECTED DEFECT: FFD is not meant to
     * ask for a buyer at all - the journey's parties are the carrier, the haulier, the
     * importer and the exporter. The app shows these screens today, so they are
     * answered to get past them; remove this once the journey is corrected.
     */
    private async fillBuyerInformation(input: FfdStandaloneConsignmentData): Promise<void> {
        await this.consignmentSteps.declareBuyerSameAsImporter(input.isBuyerSameAsImporter);

        if (input.isBuyerSameAsImporter) {
            await this.consignmentSteps.fillBuyerAddress(toPartyAddress('buyer', input));
            return;
        }

        await this.consignmentSteps.fillBuyerDetails(input.buyerEORI, toPartyAddress('buyer', input));
    }

    /**
     * The four transport branches open the same screen with a different identifier on
     * it. Verified by walking each branch on ENV=test.
     */
    private async identifyMethodOfTransport(input: FfdStandaloneConsignmentData): Promise<void> {
        const nationality = input.nationalityOfMeansOfTransport;

        switch (input.typeOfMovement) {
            case TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED:
                await this.movementSteps.enterVehicleDetails(input.vehicleRegistration, nationality);
                return;

            case TYPE_OF_MOVEMENT_OPTION_CODE.RORO_UNACCOMPANIED:
                await this.movementSteps.enterTrailerDetails(input.trailerRegistration, nationality);
                return;

            case TYPE_OF_MOVEMENT_OPTION_CODE.AIR:
                await this.movementSteps.enterFlightDetails(input.iataFlightNumber, nationality);
                return;

            case TYPE_OF_MOVEMENT_OPTION_CODE.MARITIME:
                await this.movementSteps.enterVesselDetails(input.imoNumber, nationality);
                return;

            default:
                throw new Error(`Unsupported FFD movement type: ${input.typeOfMovement}.`);
        }
    }

    /**
     * The last screen of the transport branch. ILP Air asks where the goods are LOADED
     * and never asks for a port; RoRo and ILP Maritime ask for the port of arrival and
     * never for the place of loading.
     */
    private async closeTransportBranch(input: FfdStandaloneConsignmentData): Promise<void> {
        if (input.typeOfMovement === TYPE_OF_MOVEMENT_OPTION_CODE.AIR) {
            await this.movementSteps.inputPlaceOfLoading(input.placeOfLoading);
            return;
        }

        await this.movementSteps.selectPortOfArrival(input.portOfArrival);
    }

    /**
     * The declaration procedure picks one of two tails here, and they are exclusive:
     * customs warehousing asks for the warehouse and never for the exporter or seller,
     * every other procedure the other way round.
     */
    private async declareWarehouseOrParties(input: FfdStandaloneConsignmentData): Promise<void> {
        if (input.declarationProcedure === DECLARATION_PROCEDURE.CUSTOMS_WAREHOUSING) {
            if (!input.warehouseType || !input.warehouseIdentifier) {
                throw new Error(
                    'Test data for a customs-warehousing FFD consignment must set BOTH ' +
                    '"warehouseType" and "warehouseIdentifier" - see CUSTOMS_WAREHOUSING.'
                );
            }
            await this.selectWarehouseType(input.warehouseType);
            await this.inputWarehouseIdentifier(input.warehouseIdentifier);
            return;
        }

        // The exporter is the last party this journey asks for. The app currently
        // follows it with "Seller is the same as exporter" and a seller EORI screen -
        // a defect, so they are deliberately not answered here.
        // Until it is fixed the wizard stalls on those screens and this test fails at
        // the next step; that failure IS the defect signal, so leave it red.
        await this.consignmentSteps.fillExporterDetails(input.exporterEORI, toPartyAddress('exporter', input));
    }

    // ===================== FFD-only screens =====================
    // One method per screen, each owning its Allure step name - the same shape as a
    // shared *Steps class, kept here because no other journey shows these screens.

    private async selectInlandModeOfTransport(inlandMode: string): Promise<void> {
        await ReportLog.step('Select the inland mode of transport', async () => {
            await this.ffdPage.selectInlandModeOfTransport(inlandMode);
        });
    }

    /** Answering "customs warehousing" swaps the exporter/seller tail for the warehouse one. */
    private async selectDeclarationProcedure(declarationProcedure: string): Promise<void> {
        await ReportLog.step('Answer "Which type of declaration do you intend to make?"', async () => {
            await this.ffdPage.selectDeclarationProcedure(declarationProcedure);
        });
    }

    private async selectWarehouseType(warehouseType: string): Promise<void> {
        await ReportLog.step('Select the warehouse type', async () => {
            await this.ffdPage.selectWarehouseType(warehouseType);
        });
    }

    private async inputWarehouseIdentifier(warehouseIdentifier: string): Promise<void> {
        await ReportLog.step('Input the warehouse identifier', async () => {
            await this.ffdPage.inputWarehouseIdentifier(warehouseIdentifier);
        });
    }

    /** One screen: the INCOTERM plus whether the trader knows the UN/LOCODE. */
    private async enterDeliveryTerms(incoterm: string, isKnownUnlocode: boolean): Promise<void> {
        await ReportLog.step('Enter the delivery terms', async () => {
            await this.commercialTermsPage.enterDeliveryTerms(incoterm, isKnownUnlocode);
        });
    }

    private async selectDeliveryCountry(countryCode: string): Promise<void> {
        await ReportLog.step('Select the delivery country', async () => {
            await this.commercialTermsPage.selectDeliveryCountry(countryCode);
        });
    }

    private async selectDeliveryPlace(unlocodePlace: string): Promise<void> {
        await ReportLog.step('Select the delivery place', async () => {
            await this.commercialTermsPage.selectDeliveryPlace(unlocodePlace);
        });
    }

    /** Answering yes leads to selectNatureOfGoods, which asks what that nature is. */
    private async declareSameNatureOfGoods(isSameNatureOfGoods: boolean): Promise<void> {
        await ReportLog.step('Answer "Are the goods all of the same nature?"', async () => {
            await this.ffdPage.selectSameNatureOfGoods(isSameNatureOfGoods);
        });
    }

    private async selectNatureOfGoods(natureOfGoods: string): Promise<void> {
        await ReportLog.step('Select the nature of the goods', async () => {
            await this.ffdPage.selectNatureOfGoods(natureOfGoods);
        });
    }

    private async selectMethodOfPayment(methodOfPayment: string): Promise<void> {
        await ReportLog.step('Select the method of payment', async () => {
            await this.commercialTermsPage.selectMethodOfPayment(methodOfPayment);
        });
    }
}
