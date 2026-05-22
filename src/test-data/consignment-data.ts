
import { COUNTRY_CODE } from '../constant/country-code-dropdown-constant';
import { NEW_CONSIGNMENT_DECLARATION } from '../constant/consignment-declaration-constants';

export interface ConsignmentData {
    importerEORI: string;
    importerName: string;
    importerStreetAndNumber: string;
    importerCity: string;
    importerPostCode: string;
    importerCountryCode: string;
    isBuyerSameAsImporter: string;
    buyerEORI: string;
    buyerName: string;
    buyerStreetAndNumber: string;
    buyerCity: string;
    buyerPostCode: string;
    buyerCountryCode: string;
    isGoodsAtRisk: string;
    useIMMI: string;
    isControlledGoods: string;
    transportDocumentNumber: string;
    goodsDomesticStatus: string;
    destinationCountryCode: string;
    warehouseIdentifier: string;
    consignorEORI: string;
    consignorName: string;
    consignorStreetAndNumber: string;
    consignorCity: string;
    consignorPostCode: string;
    consignorCountryCode: string;
    consigneeEORI: string;
    consigneeName: string;
    consigneeStreetAndNumber: string;
    consigneeCity: string;
    consigneePostCode: string;
    consigneeCountryCode: string;
    exporterEORI: string;
    exporterName: string;
    exporterStreetAndNumber: string;
    exporterCity: string;
    exporterPostCode: string;
    exporterCountryCode: string;
    isSellerSameAsExporter: string;
    sellerEORI: string;
    sellerName: string;
    sellerStreetAndNumber: string;
    sellerCity: string;
    sellerPostCode: string;
    sellerCountryCode: string;
    consignmentDescription?: string;
    traderReference?: string;
    isGoodsCrossEUBorder: string;
    isSameContainer: string;
    containerIdentifierNumber: string;
}

const defaults: ConsignmentData = {
    
    //Importer profile
    importerEORI: 'XI021111238000',
    importerName: 'John Doe',
    importerStreetAndNumber: '123 Main Street',
    importerCity: 'London',
    importerPostCode: 'SW1A 1AA',
    importerCountryCode: COUNTRY_CODE.UNITED_KINGDOM,

    //Buyer profile
    isBuyerSameAsImporter: 'yes',
    buyerEORI: 'GB427168118378',
    buyerName: 'John Doe 2',
    buyerStreetAndNumber: '1234 Main Street',
    buyerCity: 'London',
    buyerPostCode: 'SW1A 1AA',
    buyerCountryCode: COUNTRY_CODE.UNITED_KINGDOM,

    //Consignment information
    isGoodsAtRisk: 'yes',
    useIMMI: 'no',
    isControlledGoods: 'yes',

    //Transport and destination details
    transportDocumentNumber: '5583920174',
    goodsDomesticStatus: NEW_CONSIGNMENT_DECLARATION.GOODS_DOMESTIC_STATUS.NIDOM,
    destinationCountryCode: COUNTRY_CODE.UNITED_KINGDOM,
    warehouseIdentifier: '',

    //Consignor profile
    consignorEORI: '',
    consignorName: 'John Doe 3',
    consignorStreetAndNumber: '1235 Main Street',
    consignorCity: 'London',
    consignorPostCode: 'SW1A 1AA',
    consignorCountryCode: COUNTRY_CODE.UNITED_KINGDOM,

    //Consignee profile
    consigneeEORI: '',
    consigneeName: 'John Doe 4',
    consigneeStreetAndNumber: '1236 Main Street',
    consigneeCity: 'London',
    consigneePostCode: 'SW1A 1AA',
    consigneeCountryCode: COUNTRY_CODE.UNITED_KINGDOM,

    //Exporter profile
    exporterEORI: '',
    exporterName: 'John Doe 5',
    exporterStreetAndNumber: '1237 Main Street',
    exporterCity: 'London',
    exporterPostCode: 'SW1A 1AA',
    exporterCountryCode: COUNTRY_CODE.UNITED_KINGDOM,

    //Seller profile
    isSellerSameAsExporter: 'yes',
    sellerEORI: '',
    sellerName: 'John Doe 5',
    sellerStreetAndNumber: '1237 Main Street',
    sellerCity: 'London',
    sellerPostCode: 'SW1A 1AA',
    sellerCountryCode: COUNTRY_CODE.UNITED_KINGDOM,

    //Consignment references
    consignmentDescription: '',
    traderReference: '',
    isGoodsCrossEUBorder: 'yes',
    isSameContainer: 'yes',
    containerIdentifierNumber: '1',
};


export const consignment = (overrides?: Partial<ConsignmentData>): ConsignmentData => ({
    ...defaults,
    ...overrides,
});

