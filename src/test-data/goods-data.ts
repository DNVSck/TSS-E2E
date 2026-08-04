import { ADDITIONAL_RISK_STATUS } from "../constant/additional-risk-status-constant";
import { GOODS_DOMESTIC_STATUS } from "../constant/goods-domestic-status-constant";
import {COUNTRY_CODE} from "../constant/country-code-dropdown-constant";
import {TYPE_OF_PACKAGES} from "../constant/type-of-packages-constant";
import { PROCEDURE_CODES } from "../constant/procedure-codes-constant";
import { ADDITIONAL_PROCEDURE_CODES } from "../constant/additional-procedure-codes-constant";
import { ITEM_CURRENCY } from "../constant/item-currency-constant";
import { CONTAINER_SIZE } from "../constant/container-size-constant";
import { CONTAINER_PACKED_STATUS } from "../constant/container-packed-status-constant";
import { CONTAINER_SUPPLIER_TYPE } from "../constant/container-supplier-type-constant";
import { DocumentReferenceData } from "./document-reference-data";
import { AdditionalInformationData } from "./additional-information-data";
import { PreviousDocumentData } from "./previous-document-data";
import { TgpRecordData } from "./tgp-record-data";


export interface GoodsData {
    /**
     * Answer to the "use TGP?" screen. Only consulted when that screen appears —
     * IMMI goods where the signed-in trader has a TGP profile. Ignored on every
     * other journey, where the screen never shows.
     */
    useTGP: boolean;
    /**
     * The TGP record to declare against — see TGP_RECORD for the ones that exist.
     * Optional and NOT defaulted: which records exist depends on the environment and
     * on the trader being declared for, so there is no record that is right for every
     * test. Answering yes without naming one is a test-data mistake, and declareTgp
     * fails on it rather than picking a record nobody chose.
     *
     * Read twice. It drives the lookup on the "Enter your Trader Goods Profile
     * number" screen, and the values the goods-item overview must afterwards show.
     */
    tgpRecord?: TgpRecordData;
    goodsDomesticStatus: string;
    additionalRiskStatus: string;
    areGooodsControlled: boolean;
    isDangerousGoods: boolean;
    dangerousGoodsCodes: string;
    commodityCode: string;
    goodsDescription: string;
    countryOfOrigin: string;
    supplementaryUnits?: string;
    cusCode?: string;
    taricAdditionalCode?: string;
    nationalAdditionalCode?: string;
    shippingMarks: string;
    typeOfPackages: string;
    numberOfPackages: string;
    numberOfPieces?: string;
    grossMass: string;
    netMass?: string;
    goodsProcedureCode: string;
    additionalProcedureCode: string;
    invoiceNumber?: string;
    itemCurrency: string;
    itemPriceAmount: string;

    // Per-item container screens — only reached when the consignment declared goods
    // in different containers (isGoodsCrossEUBorder && !isSameContainer).
    containerIdentifierNumber: string;
    containerSize: string;
    containerStatus: string;
    containerSupplierType: string;

    // Goods-item overview tabs (opt-in per test). No-op unless entries are supplied.
    documentReferences: DocumentReferenceData[];
    additionalInformations: AdditionalInformationData[];
    // The goods item's "Previous documents" tab reuses the same wizard (and data) as
    // the consignment's "Header previous documents" tab.
    previousDocuments: PreviousDocumentData[];
    // Extra codes declared via the "Additional procedure codes" tab, on top of the
    // primary `additionalProcedureCode` chosen during the goods declaration.
    additionalProcedureCodes: string[];
    // Extra codes declared via the "Taric additional codes" tab, on top of the
    // primary `taricAdditionalCode` chosen during the goods declaration.
    taricAdditionalCodes: string[];
    // Extra codes declared via the "National additional codes" tab, on top of the
    // primary `nationalAdditionalCode` chosen during the goods declaration.
    nationalAdditionalCodes: string[];
}

const defaults: GoodsData = {
    // "Do you want to use TGP?" — IMMI goods only; false = "without TGP".
    useTGP: false,
    // Deliberately no default record: which records exist depends on the environment and
    // the trader, so a default would let a test that forgot to name one run silently
    // against whichever record happened to sit here.
    tgpRecord: undefined,
    // "Enter goods domestic status"
    goodsDomesticStatus: GOODS_DOMESTIC_STATUS.NIDOM,
    // "Additional risk status"
    additionalRiskStatus: ADDITIONAL_RISK_STATUS.NO_ADDITIONAL_RISK_STATUS,
    // "Are these goods controlled?"
    areGooodsControlled: true,
    // "Dangerous goods"
    isDangerousGoods: false,
    // "Dangerous goods codes"
    dangerousGoodsCodes: '1234',
    // "Commodity code"
    commodityCode: '2404199000',
    // "Goods description"
    goodsDescription: 'Smoking tobacco, whether or not containing tobacco substitutes in any proportion, 100 packs',
    // "Country of origin"
    countryOfOrigin: COUNTRY_CODE.UNITED_KINGDOM,
    // "Supplementary units" (Optional field)
    supplementaryUnits: '',
    // "CUS code" (Optional field)
    cusCode: '',
    // "TARIC additional code" (Optional field)
    taricAdditionalCode: '',
    // "National additional code" (Optional field)
    nationalAdditionalCode: '',
    // "Shipping marks"
    shippingMarks: 'ADRN123456123',
    // "Type of packages"
    typeOfPackages: TYPE_OF_PACKAGES.BOX,
    // "Number of packages"
    numberOfPackages: '2',
    // "Number of pieces" (Optional field)
    numberOfPieces: '10',
    // "Gross mass"
    grossMass: '100',
    // "Net mass" — optional on some journeys, required on others; kept <= gross mass.
    netMass: '90',
    // "Goods procedure code"
    goodsProcedureCode: PROCEDURE_CODES.FREE_CIRCULATION_4000,
    // "Additional procedure code"
    additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.NO_OTHER_ADDITIONAL_CODE_000,
    // "Invoice number" (Optional field)
    invoiceNumber: '',
    // "Item currency"
    itemCurrency: ITEM_CURRENCY.POUNDS_STERLING,
    // "Item price amount"
    itemPriceAmount: '1000',

    // Per-item container details (only used when goods are in different containers)
    // Value of Container Identifier Number must follow ISO standard
    containerIdentifierNumber: 'MSKU3988348',
    containerSize: CONTAINER_SIZE.TRAILER,
    containerStatus: CONTAINER_PACKED_STATUS.NOT_EMPTY,
    containerSupplierType: CONTAINER_SUPPLIER_TYPE.SHIPPER_SUPPLIED,

    // Goods-item overview tabs (opt-in per test)
    documentReferences: [],
    additionalInformations: [],
    previousDocuments: [],
    additionalProcedureCodes: [],
    taricAdditionalCodes: [],
    nationalAdditionalCodes: [],
};

export const goods = (overrides?: Partial<GoodsData>): GoodsData => ({
    ...defaults,
    ...overrides,
});