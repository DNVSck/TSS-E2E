import { COUNTRY_CODE, CountryCodeKey } from '../constant/country-code-dropdown-constant';
export interface ConsignmentData {
    importerEORI: string;
    importerName?: string;
    importerStreetAndNumber?: string;
    importerCity?: string;
    importerPostCode?: string;
    importerCountry?: string;
    isBuyerEORISameAsImporter?: boolean;
    isGoodsAtRisk: boolean;
    useIMMI: boolean;
    transportDocumentNumber: string;
    isNIDOM: boolean;
    destinationCountry: string;
    isControlledGoods: boolean;
}

const defaults: ConsignmentData = {
    importerEORI: 'GB123456789000',
    importerName: 'Test Importer Ltd',
    importerStreetAndNumber: '123 Test Street',
    importerCity: 'Test City',
    importerPostCode: 'TE1 1ST',
    importerCountry: COUNTRY_CODE.UNITED_KINGDOM,
    isBuyerEORISameAsImporter: true,
    isGoodsAtRisk: false,
    useIMMI: false,
    transportDocumentNumber: 'TEST123456',
    isNIDOM: false,
    destinationCountry: COUNTRY_CODE.UNITED_KINGDOM,
    isControlledGoods: false,
};

export const consignment = (overrides?: Partial<ConsignmentData>): ConsignmentData => ({
    ...defaults,
    ...overrides,
});