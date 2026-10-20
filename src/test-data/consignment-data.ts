
import { COUNTRY_CODE } from '../constant/country-code-dropdown-constant';
import { CONSIGNMENT_GOODS_DOMESTIC_STATUS } from '../constant/consignment-goods-domestic-status-constant';
import { ENS_ONLY_REASON } from '../constant/ens-only-reason-constant';
import { ITEM_CURRENCY } from '../constant/item-currency-constant';
import { CONTAINER_SIZE } from '../constant/container-size-constant';
import { CONTAINER_PACKED_STATUS } from '../constant/container-packed-status-constant';
import { CONTAINER_SUPPLIER_TYPE } from '../constant/container-supplier-type-constant';
import { PreviousDocumentData } from './previous-document-data';
import { HolderOfAuthorisationData } from './holder-of-authorisation-data';
import {
    generateRandomTransportDocumentNumber, generateRandomContainerIdentifierNumber,
} from '../helper/data-generate-helper';
import { IMPORTER_EORI, BUYER_EORI, CONSIGNOR_EORI, CONSIGNEE_EORI, SELLER_EORI } from '../../config/environment';

/**
 * One shape for both consignment journeys.
 *
 * "ENS only" is a shorter journey: it never asks for the importer, the exporter,
 * goods-at-risk, IMMI, controlled goods, the warehouse identifier or the goods
 * domestic status, and it asks for the buyer and seller directly instead of
 * "is this the same as the importer/exporter?".
 *
 * The two journeys nevertheless share most of their data — six trade parties,
 * the containers, the transport document. Splitting the type in two would
 * duplicate that and let the copies drift, so the branch is expressed by
 * `isEnsOnly` plus the two factories below, not by two types.
 */
export interface ConsignmentData {
    /** Chooses the journey. See `consignment()` and `ensOnlyConsignment()`. */
    isEnsOnly: boolean;
    /** Required when isEnsOnly; ignored otherwise. */
    ensOnlyReason?: string;

    importerEORI: string;

    representationType?: string;
    importerName: string;
    importerStreetName: string;
    importerStreetNumber: string;
    importerCity: string;
    importerPostCode: string;
    importerCountryCode: string;

    /** Only asked on the full journey — the ENS-only journey has no importer. */
    isBuyerSameAsImporter: boolean;
    buyerEORI: string;
    buyerName: string;
    buyerStreetName: string;
    buyerStreetNumber: string;
    buyerCity: string;
    buyerPostCode: string;
    buyerCountryCode: string;

    /**
     * Not asked on the ENS-only journey, and not asked at all unless IMMI is
     * enabled on `importerEORI` — that is environment setup, not test data, so a
     * journey that sets this needs an importer that has it.
     */
    useIMMI: boolean;
    useImporterSde?: boolean;
    generateSupplementaryDeclaration?: boolean;
    /** Asked when IMMI is declined, and when the importer was never offered it. */
    isControlledGoods: boolean;

    /**
     * The service rejects a transport document number it has already seen, so a
     * fresh one is generated per factory call. Six to ten digits.
     */
    transportDocumentNumber: string;
    /** Only on the non-IMMI transport screen. See CONSIGNMENT_GOODS_DOMESTIC_STATUS. */
    goodsDomesticStatus: string;
    /** Only on the ENS-only transport screen. */
    destinationCountryCode: string;

    consignorEORI: string;
    consignorName: string;
    consignorStreetName: string;
    consignorStreetNumber: string;
    consignorCity: string;
    consignorPostCode: string;
    consignorCountryCode: string;

    consigneeEORI: string;
    consigneeName: string;
    consigneeStreetName: string;
    consigneeStreetNumber: string;
    consigneeCity: string;
    consigneePostCode: string;
    consigneeCountryCode: string;

    // Full journey only — the ENS-only journey has no exporter.
    exporterEORI: string;
    exporterName: string;
    exporterStreetName: string;
    exporterStreetNumber: string;
    exporterCity: string;
    exporterPostCode: string;
    exporterCountryCode: string;

    /** Only asked on the full journey — the ENS-only journey has no exporter. */
    isSellerSameAsExporter: boolean;
    sellerEORI: string;
    sellerName: string;
    sellerStreetName: string;
    sellerStreetNumber: string;
    sellerCity: string;
    sellerPostCode: string;
    sellerCountryCode: string;

    /** Every journey reaches the trader reference screen, and it asks for nothing else. */
    traderReference?: string;

    isGoodsCrossEUBorder: boolean;
    isSameContainer: boolean;

    // The "Container identification number" screen asks for all four of these.
    containerIdentifierNumber: string;
    containerSize: string;
    containerPackedStatus: string;
    containerSupplierType: string;

    /** The last screen before "check your answers". */
    invoiceCurrency: string;

    /**
     * The consignment-overview tabs that each hold a list of records. Empty by
     * default so existing journeys are unchanged — a spec opts in by supplying
     * entries, and the overview flow replays the matching wizard once per element.
     */
    headerPreviousDocuments: PreviousDocumentData[];
    holdersOfAuthorisation: HolderOfAuthorisationData[];
}

// `transportDocumentNumber` and `containerIdentifierNumber` are deliberately absent:
// generating either here would freeze one value at module import and every consignment
// in the run would reuse it - which the service rejects outright for the transport
// document. Omit<> makes the compiler demand both from the factories below.
const defaults: Omit<ConsignmentData, 'transportDocumentNumber' | 'containerIdentifierNumber'> = {
    isEnsOnly: false,

    //Importer profile.
    // The importer's EORI must already exist in TSS — the app rejects an unknown
    // one outright — so it comes from the environment rather than a literal.
    importerEORI: IMPORTER_EORI,
    importerName: 'John Doe',
    importerStreetName: 'Main Street',
    importerStreetNumber: '123',
    importerCity: 'London',
    importerPostCode: 'SW1A 1AA',
    importerCountryCode: COUNTRY_CODE.UNITED_KINGDOM,

    //Buyer profile
    isBuyerSameAsImporter: false,
    buyerEORI: BUYER_EORI,
    buyerName: 'John Doe',
    buyerStreetName: 'Main Street',
    buyerStreetNumber: '1234',
    buyerCity: 'London',
    buyerPostCode: 'SW1A 1AA',
    buyerCountryCode: COUNTRY_CODE.UNITED_KINGDOM,

    //Consignment information
    useIMMI: false,
    isControlledGoods: true,

    //Transport and destination details
    goodsDomesticStatus: CONSIGNMENT_GOODS_DOMESTIC_STATUS.NIDOM,
    destinationCountryCode: COUNTRY_CODE.UNITED_KINGDOM,

    //Consignor profile
    consignorEORI: CONSIGNOR_EORI,
    consignorName: 'John Doe',
    consignorStreetName: 'Main Street',
    consignorStreetNumber: '1235',
    consignorCity: 'London',
    consignorPostCode: 'SW1A 1AA',
    consignorCountryCode: COUNTRY_CODE.UNITED_KINGDOM,

    //Consignee profile
    consigneeEORI: CONSIGNEE_EORI,
    consigneeName: 'John Doe',
    consigneeStreetName: 'Main Street',
    consigneeStreetNumber: '1236',
    consigneeCity: 'London',
    consigneePostCode: 'SW1A 1AA',
    consigneeCountryCode: COUNTRY_CODE.UNITED_KINGDOM,

    //Exporter profile
    exporterEORI: '',
    exporterName: 'John Doe',
    exporterStreetName: 'REGENT ROAD',
    exporterStreetNumber: '157',
    exporterCity: 'LIVERPOOL',
    exporterPostCode: 'L5 9TF',
    exporterCountryCode: COUNTRY_CODE.UNITED_KINGDOM,

    //Seller profile
    isSellerSameAsExporter: false,
    sellerEORI: SELLER_EORI,
    sellerName: 'John Doe',
    sellerStreetName: 'Main Street',
    sellerStreetNumber: '1237',
    sellerCity: 'London',
    sellerPostCode: 'SW1A 1AA',
    sellerCountryCode: COUNTRY_CODE.UNITED_KINGDOM,

    //Consignment references
    traderReference: '',
    isGoodsCrossEUBorder: false,
    isSameContainer: false,

    //Container identification
    containerSize: CONTAINER_SIZE.TRAILER,
    containerPackedStatus: CONTAINER_PACKED_STATUS.NOT_EMPTY,
    containerSupplierType: CONTAINER_SUPPLIER_TYPE.SHIPPER_SUPPLIED,

    //Invoice currency
    invoiceCurrency: ITEM_CURRENCY.POUNDS_STERLING,

    //Consignment-overview tabs (opt-in per spec)
    headerPreviousDocuments: [],
    holdersOfAuthorisation: [],
};

export const declaresControlledGoods = (consignment: ConsignmentData): boolean =>
    !consignment.isEnsOnly && !consignment.useIMMI && consignment.isControlledGoods;

export const declaresExporter = (consignment: ConsignmentData): boolean =>
    !consignment.isEnsOnly;

export const declaresInvoiceCurrency = (consignment: ConsignmentData): boolean =>
    !consignment.isEnsOnly && (consignment.useIMMI || consignment.isControlledGoods);

/** The full customs consignment journey. */
export const consignment = (overrides?: Partial<ConsignmentData>): ConsignmentData => ({
    ...defaults,
    transportDocumentNumber: generateRandomTransportDocumentNumber(),
    containerIdentifierNumber: generateRandomContainerIdentifierNumber(),
    ...overrides,
});

export const CANCELLATION_REASON = 'Cancelled by the automated regression suite';

export const UNKNOWN_CONSIGNMENT_REFERENCE = 'DEC000000000000001';

export type ContainerIdentification = Pick<ConsignmentData,
    'containerIdentifierNumber' | 'containerSize' | 'containerPackedStatus' | 'containerSupplierType'>;

export const containerIdentification = (
    overrides?: Partial<ContainerIdentification>
): ContainerIdentification => ({
    containerIdentifierNumber: generateRandomContainerIdentifierNumber(),
    containerSize: defaults.containerSize,
    containerPackedStatus: defaults.containerPackedStatus,
    containerSupplierType: defaults.containerSupplierType,
    ...overrides,
});

/**
 * The "ENS only" journey. A reason is mandatory, so it is supplied here rather
 * than left to every call site to remember.
 */
export const ensOnlyConsignment = (overrides?: Partial<ConsignmentData>): ConsignmentData => ({
    ...defaults,
    transportDocumentNumber: generateRandomTransportDocumentNumber(),
    containerIdentifierNumber: generateRandomContainerIdentifierNumber(),
    isEnsOnly: true,
    ensOnlyReason: ENS_ONLY_REASON.STANDALONE_DECLARATION_IN_TSS,
    ...overrides,
});

export const CONSIGNMENT_MAX_SCREEN_COVERAGE: Partial<ConsignmentData> = {
    isGoodsCrossEUBorder: true,
    isSameContainer: false,
};
