import { COUNTRY_CODE } from '../constant/country-code-dropdown-constant';
import { UNLOCODE, UnlocodeCode } from '../constant/unlocode-constant';
import { ITEM_CURRENCY } from '../constant/item-currency-constant';
import { TYPE_OF_MOVEMENT_OPTION_CODE } from '../constant/type-of-movement-code-constant';
import { PORT_OF_ARRIVAL } from '../constant/port-of-arrival-constant';
import { IMO_NUMBER } from './movements-data';
import { REPRESENTATION_TYPE } from '../constant/representation-type-constant';
import { CONSIGNMENT_GOODS_DOMESTIC_STATUS } from '../constant/consignment-goods-domestic-status-constant';
import { INCOTERM } from '../constant/incoterm-constant';
import { INLAND_MODE_OF_TRANSPORT } from '../constant/inland-mode-of-transport-constant';
import { METHOD_OF_PAYMENT } from '../constant/method-of-payment-constant';
import { DECLARATION_PROCEDURE } from '../constant/declaration-procedure-constant';
import { NATURE_OF_GOODS } from '../constant/nature-of-goods-constant';
import { WAREHOUSE_TYPE } from '../constant/warehouse-type-constant';
import { SUPERVISING_CUSTOMS_OFFICE } from '../constant/supervising-customs-office-constant';
import { BUYER_EORI, EXPORTER_EORI, SELLER_EORI, FISCAL_HOLD_EORI } from '../../config/environment';
import {
    generateRandomTransportDocumentNumber, generateValidArrivalDate, generatePastArrivalDate,
    generateRandomWarehouseIdentifier,
} from '../helper/data-generate-helper';
import {
    PreviousDocumentData, previousDocument337, previousDocument355, previousDocumentDCR,
    previousDocumentMRN,
} from './previous-document-data';
import { PREVIOUS_DOCUMENT_CATEGORY } from '../constant/previous-document-category-constant';
import { locationOfGoodsOfOther } from '../helper/location-of-goods-helper';
import {
    HolderOfAuthorisationData, holderCGU, holderCWP, holderDPO, holderIPO, holderOPO,
    holderTEA,
} from './holder-of-authorisation-data';

const FFD_ARRIVAL_LEAD_MS = 5 * 60 * 1000;

/**
 * The FFD standalone consignment (the app's "Standard Declaration").
 *
 * The widest of the three standalone journeys — its wizard is about twenty screens.
 * The field list below is the screen list, in the order the app asks for them; the
 * answers that reshape the rest of the wizard are called out where they appear.
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

    /** Left undefined so the factory derives one that matches isPreLodged. */
    arrivalDateTime?: string;
    /**
     * The transport branch ends differently: ILP Air asks where the goods are LOADED,
     * every other branch asks where they ARRIVE. Both are carried for the same reason
     * as the identifiers above.
     */
    portOfArrival: string;
    locationOfGoods?: string;
    placeOfLoading: string;

    declarationProcedure: string;

    /**
     * H1. "Is the buyer the same as the importer?" — answering no opens the buyer's EORI
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

    // "Enter transport and destination details" - one screen carrying both.
    transportDocumentNumber: string;
    goodsDomesticStatus: string;
    inlandModeOfTransport: string;

    /**
     * H1. Same shape as the buyer above: the EORI opens the screen and PartyBlock
     * supplies the address only if the app asks for it.
     */
    exporterEORI: string;
    exporterName: string;
    exporterStreetName: string;
    exporterStreetNumber: string;
    exporterCity: string;
    exporterPostCode: string;
    exporterCountryCode: string;

    isSellerSameAsExporter: boolean;
    sellerEORI: string;
    sellerName: string;
    sellerStreetName: string;
    sellerStreetNumber: string;
    sellerCity: string;
    sellerPostCode: string;
    sellerCountryCode: string;

    traderReference: string;
    isTransportingInContainers: boolean;

    // "Delivery terms" - the INCOTERM and whether the UN/LOCODE is known, on one
    // screen. Yes takes the code on one screen; no asks for the country and the place.
    incoterm: string;
    isKnownUnlocode: boolean;
    unlocode: UnlocodeCode;
    deliveryCountryCode: string;
    deliveryPlaceUnlocode: UnlocodeCode;

    /** Answering yes opens a second screen asking what that nature is. */
    isSameNatureOfGoods: boolean;
    natureOfGoods: string;

    methodOfPayment: string;
    invoiceCurrency: string;
    usePostponedVat: boolean;
    warehouseType?: string;
    warehouseIdentifier?: string;
    supervisingCustomsOffice?: string;

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
    imoNumber: IMO_NUMBER,
    nationalityOfMeansOfTransport: COUNTRY_CODE.UNITED_KINGDOM,

    portOfArrival: PORT_OF_ARRIVAL.BELFAST_GVMS_PORT,
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

    declarationProcedure: DECLARATION_PROCEDURE.H1_FREE_CIRCULATION,

    goodsDomesticStatus: CONSIGNMENT_GOODS_DOMESTIC_STATUS.NIDOM,
    inlandModeOfTransport: INLAND_MODE_OF_TRANSPORT.ROAD_TRANSPORT,

    // Exporter profile.
    exporterEORI: EXPORTER_EORI,
    exporterName: 'GB Test Exporter Ltd',
    exporterStreetName: 'High Street',
    exporterStreetNumber: '10',
    exporterCity: 'London',
    exporterPostCode: 'EC1A 1BB',
    exporterCountryCode: COUNTRY_CODE.UNITED_KINGDOM,

    isSellerSameAsExporter: false,
    sellerEORI: SELLER_EORI,
    sellerName: 'GB Test Seller Ltd',
    sellerStreetName: 'Market Street',
    sellerStreetNumber: '20',
    sellerCity: 'Manchester',
    sellerPostCode: 'M1 1AA',
    sellerCountryCode: COUNTRY_CODE.UNITED_KINGDOM,

    traderReference: 'STD-AUTO-001',
    isTransportingInContainers: false,

    incoterm: INCOTERM.COST_INSURANCE_AND_FREIGHT,
    isKnownUnlocode: true,
    unlocode: UNLOCODE.BELFAST,
    deliveryCountryCode: COUNTRY_CODE.UNITED_KINGDOM,
    // A UN/LOCODE from the delivery country's list - the options depend on the country.
    deliveryPlaceUnlocode: UNLOCODE.BELFAST,

    isSameNatureOfGoods: false,
    natureOfGoods: NATURE_OF_GOODS.OUTRIGHT_PURCHASE_SALE,

    methodOfPayment: METHOD_OF_PAYMENT.TRADERS_OWN_DDA,
    invoiceCurrency: ITEM_CURRENCY.POUNDS_STERLING,
    usePostponedVat: true,

    headerPreviousDocuments: [
        previousDocument355({ documentReference: 'CSPUCN123' }),
    ],
    holdersOfAuthorisation: [],
};

/**
 * Pre-lodged is the default; an arrived movement is the same data with
 * `isPreLodged: false`, so the two variants stay one factory. Method of
 * payment: Trader DDA.
 */
export const ffdH1StandaloneConsignment = (
    overrides?: Partial<FfdStandaloneConsignmentData>
): FfdStandaloneConsignmentData => {
    const data = {
        ...defaults,
        transportDocumentNumber: generateRandomTransportDocumentNumber(),
        ...overrides,
    };

    return {
        ...data,
        arrivalDateTime: data.arrivalDateTime
            ?? (data.isPreLodged ? generateValidArrivalDate(FFD_ARRIVAL_LEAD_MS) : generatePastArrivalDate()),
    };
};

/**
 * H2 (customs warehousing) defaults. The H2 wizard diverges from H1 at the
 * declaration-procedure fork: it shows warehouse identifier and supervising
 * customs office screens, and skips buyer, exporter, seller, delivery terms,
 * method of payment and invoice currency entirely.
 *
 * Only the fields the H2 tail actually reads are given H2 values here; the H1
 * fields (buyer, exporter, …) carry over from `defaults` but the flow ignores them.
 */
export const ffdH2StandaloneConsignment = (
    overrides?: Partial<FfdStandaloneConsignmentData>
): FfdStandaloneConsignmentData => ffdH1StandaloneConsignment({
    declarationProcedure: DECLARATION_PROCEDURE.H2_CUSTOMS_WAREHOUSING,
    warehouseType: WAREHOUSE_TYPE.PRIVATE_CUSTOMS_WAREHOUSE,
    warehouseIdentifier: generateRandomWarehouseIdentifier(WAREHOUSE_TYPE.PRIVATE_CUSTOMS_WAREHOUSE),
    supervisingCustomsOffice: SUPERVISING_CUSTOMS_OFFICE.GBBEL001,
    isSameNatureOfGoods: true,
    holdersOfAuthorisation: [
        holderCWP(),
    ],
    ...overrides,
});

/**
 * H3 (temporary admission) defaults. The H3 wizard diverges from H1 at the
 * declaration-procedure fork: it skips buyer and seller screens and has no
 * invoice currency at the end. The supervising customs office moves from the
 * consignment wizard to the goods-item wizard (unlike H2, where it stays at
 * consignment level). Method of payment: Trader DDA. TSS DDA
 * (CARD_PAYMENT_THROUGH_TSS) is not available for H3.
 *
 * Only the fields the H3 tail actually reads are given H3 values here; the H1
 * fields that are ignored (buyer, seller, warehouse, …) carry over from `defaults`.
 */
export const ffdH3StandaloneConsignment = (
    overrides?: Partial<FfdStandaloneConsignmentData>
): FfdStandaloneConsignmentData => ffdH1StandaloneConsignment({
    declarationProcedure: DECLARATION_PROCEDURE.H3_TEMPORARY_ADMISSION,
    headerPreviousDocuments: [],
    holdersOfAuthorisation: [
        holderTEA(),
    ],
    ...overrides,
});

export const ffdH3FiscalHoldConsignment = (
    overrides?: Partial<FfdStandaloneConsignmentData>
): FfdStandaloneConsignmentData => ffdH3StandaloneConsignment({
    holdersOfAuthorisation: [
        holderTEA({ roleId: FISCAL_HOLD_EORI }),
    ],
    ...overrides,
});

/**
 * H4 (inward processing) defaults. The H4 wizard diverges from H1 at the
 * declaration-procedure fork: it skips buyer and seller screens, shows the
 * warehouse identifier and inland mode screens but accepts both blank, and
 * keeps the supervising customs office at consignment level (like H2). Method
 * of payment: Trader DDA.
 *
 * Only the fields the H4 tail actually reads are given H4 values here; the H1
 * fields that are ignored (buyer, seller, …) carry over from `defaults`.
 */
export const ffdH4StandaloneConsignment = (
    overrides?: Partial<FfdStandaloneConsignmentData>
): FfdStandaloneConsignmentData => ffdH1StandaloneConsignment({
    declarationProcedure: DECLARATION_PROCEDURE.H4_INWARD_PROCESSING,
    supervisingCustomsOffice: SUPERVISING_CUSTOMS_OFFICE.GBBEL001,
    isSameNatureOfGoods: true,
    natureOfGoods: NATURE_OF_GOODS.TRANSFER_OF_OWNERSHIP_FOR_COMPENSATION,
    holdersOfAuthorisation: [
        holderIPO(),
        holderCGU(),
        holderDPO(),
    ],
    headerPreviousDocuments: [
        previousDocumentDCR({ documentReference: 'CSPUCN123' }),
    ],
    ...overrides,
});

export const ffdH4FiscalHoldConsignment = (
    overrides?: Partial<FfdStandaloneConsignmentData>
): FfdStandaloneConsignmentData => ffdH4StandaloneConsignment({
    holdersOfAuthorisation: [
        holderIPO({ roleId: FISCAL_HOLD_EORI }),
        holderCGU({ roleId: FISCAL_HOLD_EORI }),
        holderDPO({ roleId: FISCAL_HOLD_EORI }),
    ],
    ...overrides,
});

/**
 * MOP presets for FFD standalone — one entry per valid method of payment.
 * Spread into any ffdH_StandaloneConsignment override to set the MOP without
 * repeating the constant. Use named factory wrappers (see below) rather than
 * spreading these directly in a test, so the intent stays visible and the
 * call happens at runtime (keeping arrivalDateTime and transportDocumentNumber
 * fresh on every run).
 *
 * H2 has no MOP (the wizard skips it entirely) and is therefore absent.
 * TSS DDA (CARD_PAYMENT_THROUGH_TSS) is not available for H3.
 */
export const FFD_MOP = {
    TRADER_DDA: {
        methodOfPayment: METHOD_OF_PAYMENT.TRADERS_OWN_DDA,
    },
    ELECTRONIC_TRANSFER: {
        methodOfPayment: METHOD_OF_PAYMENT.IMMEDIATE_PAYMENT_BY_ELECTRONIC_TRANSFER,
    },
    TRADER_CASH_ACCOUNT: {
        methodOfPayment: METHOD_OF_PAYMENT.TRADERS_CDS_CASH_ACCOUNT,
    },
    AGENT_CASH_ACCOUNT: {
        methodOfPayment: METHOD_OF_PAYMENT.AGENTS_CDS_CASH_ACCOUNT,
    },
} satisfies Record<string, Partial<FfdStandaloneConsignmentData>>;

/**
 * Named H+MOP factory combinations. Add one entry per test-worthy combination;
 * each thin wrapper keeps the H-type defaults and layers the MOP on top.
 * Tests call these with transport/prelodge overrides only — H and MOP are fixed
 * by the factory name, not by the caller.
 *
 * ffdH1StandaloneConsignment  →  H1 + Trader DDA  (the base factory IS this combination)
 * ffdH2StandaloneConsignment  →  H2 (no MOP)       (the base factory IS this combination)
 * ffdH3StandaloneConsignment  →  H3 + Trader DDA  (the base factory IS this combination)
 */
export const ffdH3ElectronicTransferConsignment = (
    overrides?: Partial<FfdStandaloneConsignmentData>
): FfdStandaloneConsignmentData => ffdH3StandaloneConsignment({
    ...FFD_MOP.ELECTRONIC_TRANSFER,
    ...overrides,
});

export const ffdH4ElectronicTransferConsignment = (
    overrides?: Partial<FfdStandaloneConsignmentData>
): FfdStandaloneConsignmentData => ffdH4StandaloneConsignment({
    ...FFD_MOP.ELECTRONIC_TRANSFER,
    ...overrides,
});

export const ffdH4ImmediatePaymentConsignment = (
    overrides?: Partial<FfdStandaloneConsignmentData>
): FfdStandaloneConsignmentData => ffdH4ElectronicTransferConsignment({
    holdersOfAuthorisation: [],
    ...overrides,
});

export const ffdH4TraderCashAccountConsignment = (
    overrides?: Partial<FfdStandaloneConsignmentData>
): FfdStandaloneConsignmentData => ffdH4StandaloneConsignment({
    ...FFD_MOP.TRADER_CASH_ACCOUNT,
    holdersOfAuthorisation: [
        holderIPO(),
        holderCGU(),
    ],
    ...overrides,
});

export const ffdH4AgentCashAccountConsignment = (
    overrides?: Partial<FfdStandaloneConsignmentData>
): FfdStandaloneConsignmentData => ffdH4TraderCashAccountConsignment({
    ...FFD_MOP.AGENT_CASH_ACCOUNT,
    ...overrides,
});

const ffdH1WarrenpointArrivedConsignment = (
    overrides?: Partial<FfdStandaloneConsignmentData>
): FfdStandaloneConsignmentData => ffdH1StandaloneConsignment({
    isPreLodged: false,
    typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
    portOfArrival: PORT_OF_ARRIVAL.WARRENPOINT_GVMS_PORT,
    inlandModeOfTransport: INLAND_MODE_OF_TRANSPORT.MARITIME_SEA_TRANSPORT,
    unlocode: UNLOCODE.WARRENPOINT,
    deliveryPlaceUnlocode: UNLOCODE.WARRENPOINT,
    isSameNatureOfGoods: true,
    natureOfGoods: NATURE_OF_GOODS.TRANSFER_OF_OWNERSHIP_FOR_COMPENSATION,
    ...overrides,
});

const gbNiEntrySummaryDeclaration = () => previousDocument355({ documentReference: '23GB34F7Y1O2CX8PT4' });

export const ffdH1GbNiRiskArrivedConsignment = (
    overrides?: Partial<FfdStandaloneConsignmentData>
): FfdStandaloneConsignmentData => ffdH1WarrenpointArrivedConsignment({
    vehicleRegistration: 'IMO12345',
    goodsDomesticStatus: CONSIGNMENT_GOODS_DOMESTIC_STATUS.NIDOM,
    natureOfGoods: NATURE_OF_GOODS.OTHER_TRANSACTIONS,
    headerPreviousDocuments: [gbNiEntrySummaryDeclaration()],
    ...overrides,
});

export const ffdH1GbNiSubsidyAppliedArrivedConsignment = (
    overrides?: Partial<FfdStandaloneConsignmentData>
): FfdStandaloneConsignmentData => ffdH1WarrenpointArrivedConsignment({
    goodsDomesticStatus: CONSIGNMENT_GOODS_DOMESTIC_STATUS.NIDOM,
    headerPreviousDocuments: [gbNiEntrySummaryDeclaration()],
    ...overrides,
});

export const ffdH1StandardFrontierArrivedConsignment = (
    overrides?: Partial<FfdStandaloneConsignmentData>
): FfdStandaloneConsignmentData => ffdH1WarrenpointArrivedConsignment({
    headerPreviousDocuments: [
        previousDocumentDCR({ documentReference: '4GB553202734852-12345' }),
        gbNiEntrySummaryDeclaration(),
    ],
    ...overrides,
});

export const ffdH1StandardFrontierMultipleGoodsArrivedConsignment = (
    overrides?: Partial<FfdStandaloneConsignmentData>
): FfdStandaloneConsignmentData => ffdH1WarrenpointArrivedConsignment({
    headerPreviousDocuments: [
        previousDocumentDCR({ documentReference: '1GB553202734852-12345' }),
    ],
    ...overrides,
});

export const ffdH2ReimportAfterTemporaryExportConsignment = (
    overrides?: Partial<FfdStandaloneConsignmentData>
): FfdStandaloneConsignmentData => ffdH2StandaloneConsignment({
    typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
    supervisingCustomsOffice: SUPERVISING_CUSTOMS_OFFICE.GBLBA001,
    natureOfGoods: NATURE_OF_GOODS.OTHER_TRANSACTIONS_NOT_CLASSIFIED,
    holdersOfAuthorisation: [
        holderCGU(),
        holderOPO(),
        holderCWP(),
    ],
    headerPreviousDocuments: [
        previousDocument355({ documentReference: '21GB34F7Y1O2CX8PT4' }),
        previousDocumentMRN(),
    ],
    ...overrides,
});

const temporaryStorageDeclaration = (documentReference: string) => previousDocument337({ documentCategory: PREVIOUS_DOCUMENT_CATEGORY.X, documentReference });

export const ffdH3TemporaryAdmissionOfPackingsConsignment = (
    overrides?: Partial<FfdStandaloneConsignmentData>
): FfdStandaloneConsignmentData => ffdH3StandaloneConsignment({
    isPreLodged: false,
    typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
    inlandModeOfTransport: INLAND_MODE_OF_TRANSPORT.FIXED_TRANSPORT_INSTALLATIONS,
    isSameNatureOfGoods: true,
    natureOfGoods: NATURE_OF_GOODS.OTHER_TRANSACTIONS,
    headerPreviousDocuments: [
        previousDocumentDCR({ documentReference: 'CSPUCN123' }),
        previousDocument337(),
    ],
    holdersOfAuthorisation: [
        holderTEA(),
    ],
    ...overrides,
});

export const ffdH3ProfessionalEquipmentConsignment = (
    overrides?: Partial<FfdStandaloneConsignmentData>
): FfdStandaloneConsignmentData => ffdH3StandaloneConsignment({
    isPreLodged: false,
    typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
    inlandModeOfTransport: INLAND_MODE_OF_TRANSPORT.FIXED_TRANSPORT_INSTALLATIONS,
    isSameNatureOfGoods: true,
    natureOfGoods: NATURE_OF_GOODS.OTHER_TRANSACTIONS,
    headerPreviousDocuments: [temporaryStorageDeclaration('CSPUCN123')],
    holdersOfAuthorisation: [
        holderTEA(),
    ],
    ...overrides,
});

export const ffdH3MedicalEquipmentWithoutC516Consignment = (
    overrides?: Partial<FfdStandaloneConsignmentData>
): FfdStandaloneConsignmentData => ffdH3StandaloneConsignment({
    typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
    isSameNatureOfGoods: true,
    natureOfGoods: NATURE_OF_GOODS.OTHER_TRANSACTIONS,
    headerPreviousDocuments: [temporaryStorageDeclaration('CSPUCN12')],
    holdersOfAuthorisation: [],
    ...overrides,
});

export const ffdH4AuthorisationByDeclarationConsignment = (
    overrides?: Partial<FfdStandaloneConsignmentData>
): FfdStandaloneConsignmentData => ffdH4StandaloneConsignment({
    isPreLodged: false,
    typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
    supervisingCustomsOffice: SUPERVISING_CUSTOMS_OFFICE.GBIPS001,
    holdersOfAuthorisation: [
        holderDPO(),
        holderCGU(),
    ],
    headerPreviousDocuments: [
        previousDocument355({ documentReference: 'CSPUCN123' }),
    ],
    ...overrides,
});

const CUSTOMS_WAREHOUSE_IDENTIFIER = 'U8887776GB';

export const ffdH4FromCustomsWarehouseConsignment = (
    overrides?: Partial<FfdStandaloneConsignmentData>
): FfdStandaloneConsignmentData => ffdH4AuthorisationByDeclarationConsignment({
    warehouseType: WAREHOUSE_TYPE.PRIVATE_CUSTOMS_WAREHOUSE,
    warehouseIdentifier: CUSTOMS_WAREHOUSE_IDENTIFIER,
    locationOfGoods: locationOfGoodsOfOther(`CWP${CUSTOMS_WAREHOUSE_IDENTIFIER}`),
    exporterEORI: '',
    exporterName: 'US Trading Commodities Inc.',
    exporterStreetName: 'Trade Street',
    exporterStreetNumber: '1',
    exporterCity: 'New York',
    exporterPostCode: 'NY1 234',
    exporterCountryCode: COUNTRY_CODE.UNITED_KINGDOM,
    holdersOfAuthorisation: [
        holderCWP(),
    ],
    ...overrides,
});
