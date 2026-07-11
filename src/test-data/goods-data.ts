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


export interface GoodsData {
    /**
     * Answer to the "use TGP?" screen. Only consulted when that screen appears —
     * IMMI goods where the signed-in trader has a TGP profile. Ignored on every
     * other journey, where the screen never shows.
     */
    useTGP: boolean;
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
}

const defaults: GoodsData = {
    // "Do you want to use TGP?" — IMMI goods only; false = "without TGP".
    useTGP: false,
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
    commodityCode: '2403199000',
    // "Goods description"
    goodsDescription: '"Smoking tobacco, whether or not containing tobacco substitutes in any proportion, 100 packs',
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
    containerIdentifierNumber: '1',
    containerSize: CONTAINER_SIZE.TRAILER,
    containerStatus: CONTAINER_PACKED_STATUS.NOT_EMPTY,
    containerSupplierType: CONTAINER_SUPPLIER_TYPE.SHIPPER_SUPPLIED,
};

export const goods = (overrides?: Partial<GoodsData>): GoodsData => ({
    ...defaults,
    ...overrides,
});