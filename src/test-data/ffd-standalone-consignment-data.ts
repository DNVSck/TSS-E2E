import { COUNTRY_CODE } from '../constant/country-code-dropdown-constant';
import { ITEM_CURRENCY } from '../constant/item-currency-constant';
import { TYPE_OF_MOVEMENT_OPTION_CODE } from '../constant/type-of-movement-code-constant';
import { PORT_OF_ARRIVAL } from '../constant/port-of-arrival-constant';
import { REPRESENTATION_TYPE } from '../constant/representation-type-constant';
import { CONSIGNMENT_GOODS_DOMESTIC_STATUS } from '../constant/consignment-goods-domestic-status-constant';
import { INLAND_MODE_OF_TRANSPORT } from '../constant/inland-mode-of-transport-constant';
import { INCOTERM } from '../constant/incoterm-constant';
import { METHOD_OF_PAYMENT } from '../constant/method-of-payment-constant';
import { WAREHOUSE_TYPE, WarehouseTypeCode } from '../constant/warehouse-type-constant';
import { DECLARATION_PROCEDURE } from '../constant/declaration-procedure-constant';
import { NATURE_OF_GOODS } from '../constant/nature-of-goods-constant';
import { BUYER_EORI, EXPORTER_EORI } from '../../config/environment';
import {
    generateRandomTransportDocumentNumber, generateRandomWarehouseIdentifier,
} from '../helper/data-generate-helper';
import { PreviousDocumentData } from './previous-document-data';
import { HolderOfAuthorisationData } from './holder-of-authorisation-data';

/**
 * The FFD standalone consignment (the app's "Standard Declaration").
 *
 * The widest of the three standalone journeys — its wizard is about twenty screens.
 * The field list below is the screen list, in the order the app asks for them; three
 * answers reshape the rest of the wizard and are called out where they appear.
 *
 * It asks for the BUYER, not the exporter: unlike IMMI and SFD standalone there is no
 * exporter screen on this journey at all.
 */
export interface FfdStandaloneConsignmentData {
    /**
     * "What type of representation?" — shown ONLY when the agent represents a trader.
     * Leave undefined for an importer self-login journey, where the screen never appears.
     */
    representationType?: string;

    /**
     * FORK. "Is this a pre-lodged or arrived movement?" — the first screen. A
     * pre-lodged movement is then asked when the goods will arrive; an arrived one is
     * not, because it already has.
     */
    isPreLodged: boolean;

    /**
     * FORK. "What method of transport are you using?" — RoRo, ILP Air and ILP Maritime
     * each open a different transport branch. Only the RoRo branches are modelled.
     */
    typeOfMovement: string;

    /**
     * The transport screen, which is one screen carrying an identifier plus the
     * nationality — but WHICH identifier follows from typeOfMovement:
     *
     *   RoRo accompanied    vehicle registration
     *   RoRo unaccompanied  trailer registration
     *   ILP Air             IATA flight number
     *   ILP Maritime        IMO number (exactly 7 digits)
     *
     * All four are carried so a spec only has to change typeOfMovement.
     */
    vehicleRegistration: string;
    trailerRegistration: string;
    iataFlightNumber: string;
    imoNumber: string;
    nationalityOfMeansOfTransport: string;

    inlandModeOfTransport: string;
    /** Left undefined so the flow generates a valid (within 14 days) date/time. */
    arrivalDateTime?: string;
    /**
     * The transport branch ends differently: ILP Air asks where the goods are LOADED,
     * every other branch asks where they ARRIVE. Both are carried for the same reason
     * as the identifiers above.
     */
    portOfArrival: string;
    placeOfLoading: string;

    /**
     * "Is the buyer the same as the importer?" — answering no opens the buyer's EORI
     * screen. The address is carried for the same reason the ENS journeys carry it:
     * PartyBlock decides at runtime whether the app asks for it, and a blank or
     * unregistered EORI is what makes it ask.
     */
    isBuyerSameAsImporter: boolean;
    buyerEORI: string;
    buyerName: string;
    buyerStreetName: string;
    buyerStreetNumber: string;
    buyerCity: string;
    buyerPostCode: string;
    buyerCountryCode: string;

    /**
     * FORK, and the biggest one. "Which type of declaration do you intend to make?"
     * picks one of two different tails:
     *
     *   customs warehousing -> warehouse type + identifier, NO exporter or seller
     *   anything else       -> exporter + seller, NO warehouse
     *
     * See DECLARATION_PROCEDURE.
     */
    declarationProcedure: string;

    // "Enter transport and destination details" - one screen carrying both.
    transportDocumentNumber: string;
    goodsDomesticStatus: string;

    // Customs-warehousing tail only.
    warehouseType?: WarehouseTypeCode;
    warehouseIdentifier?: string;

    /**
     * Every other tail. Same shape as the buyer above: the EORI opens the screen and
     * PartyBlock supplies the address only if the app asks for it.
     *
     * There is NO seller on this journey. The app currently shows "Seller is the same
     * as exporter" and a seller EORI screen after the exporter - that is a defect
     * (confirmed 2026-08-02), not a screen FFD is meant to have, so no seller fields
     * are modelled here.
     */
    exporterEORI: string;
    exporterName: string;
    exporterStreetName: string;
    exporterStreetNumber: string;
    exporterCity: string;
    exporterPostCode: string;
    exporterCountryCode: string;

    traderReference: string;
    isTransportingInContainers: boolean;

    // "Delivery terms" - the INCOTERM and whether the UN/LOCODE is known, on one
    // screen; then the country and the place.
    incoterm: string;
    isKnownUnlocode: boolean;
    deliveryCountryCode: string;
    deliveryPlaceUnlocode: string;

    /** Answering yes opens a second screen asking what that nature is. */
    isSameNatureOfGoods: boolean;
    natureOfGoods: string;

    methodOfPayment: string;
    invoiceCurrency: string;

    /**
     * Consignment-overview tabs, each a list of records. Empty by default so a
     * journey that declares none is unaffected.
     */
    headerPreviousDocuments: PreviousDocumentData[];
    holdersOfAuthorisation: HolderOfAuthorisationData[];
}

// `transportDocumentNumber` is deliberately absent: generating it here would freeze
// one value at module import and every consignment in the run would reuse it.
const defaults: Omit<FfdStandaloneConsignmentData, 'transportDocumentNumber'> = {
    representationType: REPRESENTATION_TYPE.DIRECT,
    isPreLodged: true,

    typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
    vehicleRegistration: 'GB12ABC',
    trailerRegistration: 'TRL1234',
    iataFlightNumber: 'BA1234',
    imoNumber: '9198941',
    nationalityOfMeansOfTransport: COUNTRY_CODE.UNITED_KINGDOM,

    inlandModeOfTransport: INLAND_MODE_OF_TRANSPORT.ROLL_ON_ROLL_OFF,
    portOfArrival: PORT_OF_ARRIVAL.BELFAST_PORT,
    placeOfLoading: 'Liverpool',

    // Buyer profile. A registered EORI means the app does not ask for the address,
    // but it is carried so an unregistered one still works - see PartyBlock.
    isBuyerSameAsImporter: false,
    buyerEORI: BUYER_EORI,
    buyerName: 'John Doe',
    buyerStreetName: 'Main Street',
    buyerStreetNumber: '1234',
    buyerCity: 'London',
    buyerPostCode: 'SW1A 1AA',
    buyerCountryCode: COUNTRY_CODE.UNITED_KINGDOM,

    // Free circulation is the plain path: exporter and seller, no warehouse.
    declarationProcedure: DECLARATION_PROCEDURE.FREE_CIRCULATION,

    goodsDomesticStatus: CONSIGNMENT_GOODS_DOMESTIC_STATUS.NIDOM,

    // Exporter profile.
    exporterEORI: EXPORTER_EORI,
    exporterName: 'GB Test Exporter Ltd',
    exporterStreetName: 'High Street',
    exporterStreetNumber: '10',
    exporterCity: 'London',
    exporterPostCode: 'EC1A 1BB',
    exporterCountryCode: COUNTRY_CODE.UNITED_KINGDOM,

    traderReference: 'STD-AUTO-001',
    isTransportingInContainers: false,

    incoterm: INCOTERM.COST_INSURANCE_AND_FREIGHT,
    // The trader does not know the UN/LOCODE, so the app asks for the country and the
    // place instead of a code.
    isKnownUnlocode: false,
    deliveryCountryCode: COUNTRY_CODE.UNITED_KINGDOM,
    // A UN/LOCODE from the delivery country's list - the options depend on the country.
    deliveryPlaceUnlocode: 'GBBEL',

    isSameNatureOfGoods: true,
    natureOfGoods: NATURE_OF_GOODS.OUTRIGHT_PURCHASE_SALE,

    methodOfPayment: METHOD_OF_PAYMENT.TRADERS_OWN_DDA,
    invoiceCurrency: ITEM_CURRENCY.POUNDS_STERLING,

    headerPreviousDocuments: [],
    holdersOfAuthorisation: [],
};

/**
 * The customs-warehousing tail, for a test that opts into it. NOT yet verified
 * end-to-end: only the free-circulation tail has been run against the app.
 */
export const CUSTOMS_WAREHOUSING = {
    declarationProcedure: DECLARATION_PROCEDURE.CUSTOMS_WAREHOUSING,
    warehouseType: WAREHOUSE_TYPE.PRIVATE_CUSTOMS_WAREHOUSE,
    // No warehouseIdentifier: the factory derives one from the type above, so the two
    // cannot disagree. State it here only to pin a specific authorisation number.
} as const;

/**
 * Pre-lodged is the default; an arrived movement is the same data with
 * `isPreLodged: false`, which also drops the arrival date/time screen.
 */
export const ffdStandaloneConsignment = (
    overrides?: Partial<FfdStandaloneConsignmentData>
): FfdStandaloneConsignmentData => {
    const data = {
        ...defaults,
        transportDocumentNumber: generateRandomTransportDocumentNumber(),
        ...overrides,
    };

    return {
        ...data,
        // Derived AFTER the overrides are applied, because the identifier OPENS with the
        // warehouse type letter (U + 1234567 + GB). Computing it any earlier would let a
        // spec change the type and be left with an identifier still naming the old one -
        // two screens of the same declaration contradicting each other, which the form
        // would likely accept and no assertion here would catch.
        //
        // Undefined when no warehouse tail was chosen: every other declaration procedure
        // never reaches the warehouse screens.
        warehouseIdentifier: data.warehouseIdentifier
            ?? (data.warehouseType
                ? generateRandomWarehouseIdentifier(data.warehouseType)
                : undefined),
    };
};
