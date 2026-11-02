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
import { CONSIGNMENT_GOODS_DOMESTIC_STATUS } from '../../constant/consignment-goods-domestic-status-constant';

function requireConsignmentField<K extends keyof FfdStandaloneConsignmentData>(
    input: FfdStandaloneConsignmentData,
    field: K
): NonNullable<FfdStandaloneConsignmentData[K]> {
    const value = input[field];
    if (value === undefined || value === null || value === '') {
        throw new Error(
            `Test data for an FFD ${input.declarationProcedure} consignment must set "${String(field)}" - `
            + 'the wizard asks for it on this procedure.'
        );
    }
    return value as NonNullable<FfdStandaloneConsignmentData[K]>;
}

/**
 * The FFD standalone "Transport Details" task, from the task list through to Finish
 * (which creates the consignment and lands on its overview).
 *
 * `addNewFfdStandaloneConsignment` IS the screen list, in the order the app asks for
 * them - verified by walking the wizard on ENV=test. The answers that reshape it are
 * guarded where they appear: pre-lodged adds the arrival date/time, the declaration
 * procedure picks the tail ("h1-journey" for release to free circulation), and the
 * buyer, seller, UN/LOCODE and nature-of-goods questions each open or skip a screen.
 *
 * Standalone has ONE wizard where ENS has two, so the spine draws on three shared step
 * libraries for the screens other journeys also have. The screens NO other journey
 * shows are the private steps at the bottom of this file: a step library exists to be
 * shared, and these have exactly one consumer. Give them their own class the day a
 * second journey needs them.
 *
 * H1, H2, H3 and H4 tails are modelled; the goods-item wizard is not yet.
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

            await this.movementSteps.inputArrivalDateTime(
                input.arrivalDateTime,
                { collectsYear: !input.isPreLodged, collectsTime: input.isPreLodged }
            );
            await this.closeTransportBranch(input);

            await this.selectDeclarationProcedure(input.declarationProcedure);
            await this.declareTail(input);

            await this.standaloneSteps.finishStandaloneConsignment();
        });
    }

    private async declareTail(input: FfdStandaloneConsignmentData): Promise<void> {
        switch (input.declarationProcedure) {
            case DECLARATION_PROCEDURE.H1_FREE_CIRCULATION:
                await this.declareH1Tail(input);
                return;
            case DECLARATION_PROCEDURE.H2_CUSTOMS_WAREHOUSING:
                await this.declareH2Tail(input);
                return;
            case DECLARATION_PROCEDURE.H3_TEMPORARY_ADMISSION:
                await this.declareH3Tail(input);
                return;
            case DECLARATION_PROCEDURE.H4_INWARD_PROCESSING:
                await this.declareH4Tail(input);
                return;
            default:
                throw new Error(
                    `FFD declaration procedure "${input.declarationProcedure}" is not modelled - `
                    + `only H1 (${DECLARATION_PROCEDURE.H1_FREE_CIRCULATION}), `
                    + `H2 (${DECLARATION_PROCEDURE.H2_CUSTOMS_WAREHOUSING}), `
                    + `H3 (${DECLARATION_PROCEDURE.H3_TEMPORARY_ADMISSION}) and `
                    + `H4 (${DECLARATION_PROCEDURE.H4_INWARD_PROCESSING}) are.`
                );
        }
    }

    private async declareH1Tail(input: FfdStandaloneConsignmentData): Promise<void> {
        await this.fillBuyerInformation(input);
        await this.consignmentSteps.fillSfdTransportAndDestination(
            input.transportDocumentNumber, input.goodsDomesticStatus
        );
        if (!input.isPreLodged) {
            await this.selectInlandModeOfTransport(input.inlandModeOfTransport);
        }
        await this.fillExporterAndSeller(input);
        await this.declareCommercialDetails(input);
        if (input.goodsDomesticStatus === CONSIGNMENT_GOODS_DOMESTIC_STATUS.NIIMP) {
            await this.answerPostponedVat(input.usePostponedVat);
        }
    }

    private async declareH2Tail(input: FfdStandaloneConsignmentData): Promise<void> {
        await this.consignmentSteps.fillSfdTransportAndDestination(
            input.transportDocumentNumber, input.goodsDomesticStatus
        );
        await this.fillWarehouseIdentifier(
            requireConsignmentField(input, 'warehouseType'),
            requireConsignmentField(input, 'warehouseIdentifier')
        );
        await this.selectSupervisingCustomsOffice(requireConsignmentField(input, 'supervisingCustomsOffice'));
        await this.consignmentSteps.fillTraderReference(input.traderReference);
        await this.standaloneSteps.declareTransportingInContainers(input.isTransportingInContainers);
        await this.declareNatureOfGoods(input);
    }

    /**
     * H3 (temporary admission) tail. Skips buyer and seller — TA goods are not
     * sold, so the app does not ask for those parties. The supervising customs
     * office moves to the goods-item wizard for H3 (unlike H2, where it sits at
     * consignment level).
     */
    private async declareH3Tail(input: FfdStandaloneConsignmentData): Promise<void> {
        await this.consignmentSteps.fillSfdTransportAndDestination(
            input.transportDocumentNumber, input.goodsDomesticStatus
        );
        if (!input.isPreLodged) {
            await this.selectInlandModeOfTransport(input.inlandModeOfTransport);
        }
        await this.consignmentSteps.fillExporterDetails(input.exporterEORI, toPartyAddress('exporter', input));
        await this.declareCommercialDetails(input);
    }

    private async declareCommercialDetails(input: FfdStandaloneConsignmentData): Promise<void> {
        await this.consignmentSteps.fillTraderReference(input.traderReference);
        await this.standaloneSteps.declareTransportingInContainers(input.isTransportingInContainers);
        await this.enterDeliveryTerms(input.incoterm, input.isKnownUnlocode);
        await this.declareDeliveryLocation(input);
        await this.declareNatureOfGoods(input);
        await this.selectMethodOfPayment(input.methodOfPayment);
        await this.consignmentSteps.selectInvoiceCurrency(input.invoiceCurrency);
    }

    private async declareNatureOfGoods(input: FfdStandaloneConsignmentData): Promise<void> {
        await this.declareSameNatureOfGoods(input.isSameNatureOfGoods);
        // Saying every item shares one nature is what opens the screen that asks
        // what that nature is.
        if (input.isSameNatureOfGoods) {
            await this.selectNatureOfGoods(input.natureOfGoods);
        }
    }

    // ===================== Routing =====================
    // These pick which screens the answers open. They report nothing themselves.

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

        if (input.locationOfGoods) {
            await this.movementSteps.enterLocationOfGoods(input.portOfArrival, input.locationOfGoods);
            return;
        }

        await this.movementSteps.selectPortOfArrival(input.portOfArrival);
    }

    private async fillExporterAndSeller(input: FfdStandaloneConsignmentData): Promise<void> {
        await this.consignmentSteps.fillExporterDetails(input.exporterEORI, toPartyAddress('exporter', input));
        await this.consignmentSteps.declareSellerSameAsExporter(input.isSellerSameAsExporter);

        if (!input.isSellerSameAsExporter) {
            await this.consignmentSteps.fillSellerDetails(input.sellerEORI, toPartyAddress('seller', input));
        }
    }

    private async declareDeliveryLocation(input: FfdStandaloneConsignmentData): Promise<void> {
        if (input.isKnownUnlocode) {
            await this.selectUnlocode(input.unlocode);
            return;
        }

        await this.selectDeliveryCountry(input.deliveryCountryCode);
        await this.selectDeliveryPlace(input.deliveryPlaceUnlocode);
    }

    // ===================== FFD-only screens =====================
    // One method per screen, each owning its Allure step name - the same shape as a
    // shared *Steps class, kept here because no other journey shows these screens.

    private async selectInlandModeOfTransport(inlandModeOfTransport: string): Promise<void> {
        await ReportLog.step('Select the inland mode of transport', async () => {
            await this.ffdPage.selectInlandModeOfTransport(inlandModeOfTransport);
        });
    }

    private async continueFromInlandModeOfTransport(): Promise<void> {
        await ReportLog.step('Continue from inland mode of transport', async () => {
            await this.ffdPage.continueFromInlandModeOfTransport();
        });
    }

    private async continueFromWarehouseIdentifier(): Promise<void> {
        await ReportLog.step('Continue from warehouse identifier', async () => {
            await this.ffdPage.continueFromWarehouseIdentifier();
        });
    }

    /** Picks the tail of the wizard; see declareTail. */
    private async selectDeclarationProcedure(declarationProcedure: string): Promise<void> {
        await ReportLog.step('Answer "Which type of declaration do you intend to make?"', async () => {
            await this.ffdPage.selectDeclarationProcedure(declarationProcedure);
        });
    }

    /** One screen: the INCOTERM plus whether the trader knows the UN/LOCODE. */
    private async enterDeliveryTerms(incoterm: string, isKnownUnlocode: boolean): Promise<void> {
        await ReportLog.step('Enter the delivery terms', async () => {
            await this.commercialTermsPage.enterDeliveryTerms(incoterm, isKnownUnlocode);
        });
    }

    private async selectUnlocode(unlocode: string): Promise<void> {
        await ReportLog.step('Select the UN/LOCODE of the delivery location', async () => {
            await this.commercialTermsPage.selectUnlocode(unlocode);
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

    /**
     * H4 (inward processing) tail. No buyer or seller screens — IP goods are not
     * being sold outright. The supervising customs office is at consignment level (like
     * H2). Inland mode of transport and warehouse identifier are always shown but left
     * blank (the app accepts no selection on both screens).
     */
    private async declareH4Tail(input: FfdStandaloneConsignmentData): Promise<void> {
        await this.consignmentSteps.fillSfdTransportAndDestination(
            input.transportDocumentNumber, input.goodsDomesticStatus
        );
        await this.continueFromInlandModeOfTransport();
        if (input.warehouseType && input.warehouseIdentifier) {
            await this.fillWarehouseIdentifier(input.warehouseType, input.warehouseIdentifier);
        } else {
            await this.continueFromWarehouseIdentifier();
        }
        await this.selectSupervisingCustomsOffice(requireConsignmentField(input, 'supervisingCustomsOffice'));
        await this.consignmentSteps.fillExporterDetails(input.exporterEORI, toPartyAddress('exporter', input));
        await this.declareCommercialDetails(input);
    }

    private async fillWarehouseIdentifier(warehouseType: string, warehouseIdentifier: string): Promise<void> {
        await ReportLog.step('Enter the warehouse identifier', async () => {
            await this.ffdPage.fillWarehouseIdentifier(warehouseType, warehouseIdentifier);
        });
    }

    private async selectSupervisingCustomsOffice(supervisingCustomsOffice: string): Promise<void> {
        await ReportLog.step('Select the supervising customs office', async () => {
            await this.ffdPage.selectSupervisingCustomsOffice(supervisingCustomsOffice);
        });
    }

    private async answerPostponedVat(usePostponedVat: boolean): Promise<void> {
        await ReportLog.step('Answer "Do you want to use Postponed VAT Accounting?"', async () => {
            await this.ffdPage.answerPostponedVat(usePostponedVat);
        });
    }
}
