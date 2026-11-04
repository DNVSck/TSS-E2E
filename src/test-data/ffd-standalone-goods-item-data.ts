import { GoodsData, goods } from './goods-data';
import { documentReference } from './document-reference-data';
import { additionalInformation } from './additional-information-data';
import { previousDocument } from './previous-document-data';
import { PREVIOUS_DOCUMENT_TYPE } from '../constant/previous-document-type-constant';
import { ADDITIONAL_RISK_STATUS } from '../constant/additional-risk-status-constant';
import { ADDITIONAL_INFORMATION_CODE } from '../constant/additional-information-constant';
import { NATURE_OF_GOODS } from '../constant/nature-of-goods-constant';
import { PREFERENCE_CODE, VALUATION_METHOD } from '../constant/preference-and-valuation-constant';
import { TYPE_OF_PACKAGES } from '../constant/type-of-packages-constant';
import { DOCUMENT_CODE } from '../constant/document-code-constant';
import { DOCUMENT_STATUS } from '../constant/document-status-constant';
import { PROCEDURE_CODES } from '../constant/procedure-codes-constant';
import { ADDITIONAL_PROCEDURE_CODES } from '../constant/additional-procedure-codes-constant';
import { SUPERVISING_CUSTOMS_OFFICE } from '../constant/supervising-customs-office-constant';
import { NATIONAL_ADDITIONAL_CODE } from '../constant/national-additional-code-constant';
import { COUNTRY_CODE } from '../constant/country-code-dropdown-constant';
import { defermentAccountNumber } from '../helper/authorisation-helper';
import { generateRandomInvoiceNumber } from '../helper/data-generate-helper';
import { IMPORTER_DPO, IMPORTER_CWP, IMPORTER_TEA, IMPORTER_IPO, IMPORTER_CGU, IMPORTER_OPO, FISCAL_HOLD_TEA, FISCAL_HOLD_IPO } from '../../config/environment';

const traderDdaDocument = () => documentReference({
    documentCode: DOCUMENT_CODE['1207'],
    documentStatus: DOCUMENT_STATUS.AG,
    documentReference: defermentAccountNumber(IMPORTER_DPO),
});

const organicRegulationExemptionDocument = () => documentReference({
    documentCode: DOCUMENT_CODE.Y929,
    documentReference: '',
    documentStatus: '',
    documentReason: 'Reason for Waiver',
});

const authorisationByDeclarationInformations = () => [
    additionalInformation({ code: ADDITIONAL_INFORMATION_CODE.SIMPLIFIED_AUTHORISATION_00100, description: 'Simplified Authorisation' }),
    additionalInformation({ code: ADDITIONAL_INFORMATION_CODE.AUTHORISATION_BY_DECLARATION_ABDIN, description: 'Authorisation by Declaration' }),
];

/**
 * The goods item an FFD standalone consignment declares.
 *
 * FFD values the goods on the goods item itself, which no other frontier journey does,
 * so it carries the screens that do that - the same codes a supplementary declaration
 * uses - on top of the shared GoodsData. They live here rather than on GoodsData so the
 * journeys that never show those screens do not carry them.
 */
export interface FfdH1GoodsData extends GoodsData {
    additionalRiskStatus: string;
    preference: string;
    countryOfPreferentialOrigin?: string;
    natureOfGoods: string;
    valuationMethod: string;
}

export const ffdH1StandaloneGoodsItem = (overrides?: Partial<FfdH1GoodsData>): FfdH1GoodsData => ({
    ...goods(overrides),
    additionalRiskStatus: ADDITIONAL_RISK_STATUS.NO_ADDITIONAL_RISK_STATUS,
    preference: PREFERENCE_CODE.NORMAL_THIRD_COUNTRY_TARIFF,
    natureOfGoods: NATURE_OF_GOODS.TRANSFER_OF_OWNERSHIP_FOR_COMPENSATION,
    valuationMethod: VALUATION_METHOD.TRANSACTION_VALUE,
    typeOfPackages: TYPE_OF_PACKAGES.PACKAGE,
    numberOfPackages: '28',
    grossMass: '100',
    netMass: '100',
    invoiceNumber: generateRandomInvoiceNumber(),
    itemPriceAmount: '500',
    ...overrides,
});

export const ffdH1TraderDdaGoodsItem = (overrides?: Partial<FfdH1GoodsData>): FfdH1GoodsData =>
    ffdH1StandaloneGoodsItem({
        documentReferences: [
            traderDdaDocument(),
        ],
        ...overrides,
    });

/**
 * The goods item an FFD H3 (temporary admission) consignment declares.
 *
 * H3 drops additional risk status (no risk categorisation for TA). The supervising
 * customs office moves to goods level (unlike H2, where it lives at consignment level).
 * Valuation method IS required for H3 (DE 4/13 is present in the wizard).
 * Nature of goods is asked at goods level when the consignment said its items are not
 * all traded for the same reason. The [1207] document charges duty to Trader DDA.
 */
export interface FfdH3GoodsData extends GoodsData {
    preference: string;
    countryOfPreferentialOrigin?: string;
    natureOfGoods: string;
    valuationMethod: string;
}

export const ffdH3StandaloneGoodsItem = (overrides?: Partial<FfdH3GoodsData>): FfdH3GoodsData => ({
    ...goods(overrides),
    procedureCode: PROCEDURE_CODES.ENTRY_TO_TA_5300,
    additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.GOODS_FOR_EVENTS_OR_SALE_D23,
    supervisingCustomsOffice: SUPERVISING_CUSTOMS_OFFICE.GBIPS001,
    preference: PREFERENCE_CODE.NORMAL_THIRD_COUNTRY_TARIFF,
    natureOfGoods: NATURE_OF_GOODS.TRANSFER_OF_OWNERSHIP_FOR_COMPENSATION,
    valuationMethod: VALUATION_METHOD.TRANSACTION_VALUE_OF_SIMILAR_GOODS,
    typeOfPackages: TYPE_OF_PACKAGES.DRUM,
    numberOfPackages: '28',
    grossMass: '100',
    netMass: '100',
    invoiceNumber: generateRandomInvoiceNumber(),
    itemPriceAmount: '500',
    documentReferences: [
        documentReference({
            documentCode: DOCUMENT_CODE.C516,
            documentStatus: '',
            documentReference: IMPORTER_TEA,
        }),
    ],
    additionalInformations: [
        additionalInformation({ code: ADDITIONAL_INFORMATION_CODE.NIREM, description: '' }),
        additionalInformation({ code: ADDITIONAL_INFORMATION_CODE.GEN45, description: '12345' }),
        additionalInformation({
            code: ADDITIONAL_INFORMATION_CODE.GEN33,
            description: 'Test Holder. 1 Main Street, Belfast BT1 1AA. Re-export date - 01/01/2027',
        }),
    ],
    previousDocuments: [
        previousDocument(),
    ],
    ...overrides,
});

export const ffdH3TraderDdaGoodsItem = (overrides?: Partial<FfdH3GoodsData>): FfdH3GoodsData =>
    ffdH3StandaloneGoodsItem({
        documentReferences: [
            documentReference({
                documentCode: DOCUMENT_CODE.C516,
                documentStatus: '',
                documentReference: IMPORTER_TEA,
            }),
            traderDdaDocument(),
        ],
        ...overrides,
    });

export const ffdH3FiscalHoldGoodsItem = (overrides?: Partial<FfdH3GoodsData>): FfdH3GoodsData =>
    ffdH3StandaloneGoodsItem({
        documentReferences: [
            documentReference({
                documentCode: DOCUMENT_CODE.C516,
                documentStatus: '',
                documentReference: FISCAL_HOLD_TEA,
            }),
            traderDdaDocument(),
        ],
        ...overrides,
    });

/**
 * The goods item an FFD H2 (customs warehousing) consignment declares.
 *
 * H2 goods differ from H1 in several ways: no additional risk status screen,
 * no supervising customs office or warehouse screen at goods level (both moved
 * to the consignment wizard), and no valuation method (duty is suspended at
 * warehouse entry). The invoice details screen asks only for an invoice number.
 *
 * The document references carry the two documents CDS requires for H2:
 *   C644 — certificate of origin
 *   C517 — the CWP authorisation (IMPORTER_CWP), which names the warehouse keeper
 */
export interface FfdH2GoodsData extends GoodsData {
    preference: string;
    countryOfPreferentialOrigin?: string;
}

export const ffdH2StandaloneGoodsItem = (overrides?: Partial<FfdH2GoodsData>): FfdH2GoodsData => ({
    ...goods(overrides),
    procedureCode: PROCEDURE_CODES.ENTRY_TO_CW_7100,
    additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.NO_OTHER_ADDITIONAL_CODE_000,
    preference: PREFERENCE_CODE.NORMAL_THIRD_COUNTRY_TARIFF,
    typeOfPackages: TYPE_OF_PACKAGES.PACKAGE,
    numberOfPackages: '28',
    grossMass: '100',
    netMass: '100',
    invoiceNumber: generateRandomInvoiceNumber(),
    documentReferences: [
        documentReference({
            documentCode: DOCUMENT_CODE.C644,
            documentStatus: DOCUMENT_STATUS.GE,
            documentReference: 'COI.XI.2025.AUTO001',
        }),
        documentReference({
            documentCode: DOCUMENT_CODE.C517,
            documentStatus: undefined,
            documentReference: IMPORTER_CWP,
            documentReason: '',
        }),
    ],
    ...overrides,
});

/**
 * The goods item an FFD H4 (inward processing) consignment declares.
 *
 * H4 has no additional risk status screen (no risk categorisation for IP). The
 * supervising customs office is at consignment level (unlike H3, where it is at goods
 * level). Valuation method IS required (DE 4/13 is present). The invoice number is
 * also the N935 document reference, so it is generated once and shared.
 *
 * Documents declared in the wizard: N935 (invoice), C601 (IPO authorisation).
 * C505 (CGU) is auto-populated by the service. C506 (DPO) is auto-populated when
 * 1207 is present (Trader DDA); for Immediate Payment it must be declared explicitly.
 */
export interface FfdH4GoodsData extends GoodsData {
    preference: string;
    countryOfPreferentialOrigin?: string;
    natureOfGoods: string;
    valuationMethod: string;
}

export const ffdH4StandaloneGoodsItem = (overrides?: Partial<FfdH4GoodsData>): FfdH4GoodsData => {
    const invoiceNumber = overrides?.invoiceNumber ?? generateRandomInvoiceNumber();
    return {
        ...goods(overrides),
        procedureCode: PROCEDURE_CODES.ENTRY_TO_IP_5100,
        additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.NO_OTHER_ADDITIONAL_CODE_000,
        preference: PREFERENCE_CODE.NORMAL_THIRD_COUNTRY_TARIFF,
        natureOfGoods: NATURE_OF_GOODS.TRANSFER_OF_OWNERSHIP_FOR_COMPENSATION,
        valuationMethod: VALUATION_METHOD.TRANSACTION_VALUE,
        typeOfPackages: TYPE_OF_PACKAGES.PACKAGE,
        numberOfPackages: '28',
        grossMass: '100',
        netMass: '100',
        invoiceNumber,
        itemPriceAmount: '2000',
        documentReferences: [
            documentReference({
                documentCode: DOCUMENT_CODE.N935,
                documentStatus: DOCUMENT_STATUS.AC,
                documentReference: invoiceNumber,
            }),
            documentReference({
                documentCode: DOCUMENT_CODE.C601,
                documentStatus: '',
                documentReference: IMPORTER_IPO,
            }),
        ],
        ...overrides,
    };
};

export const ffdH4ImmediatePaymentGoodsItem = (overrides?: Partial<FfdH4GoodsData>): FfdH4GoodsData => {
    const invoiceNumber = overrides?.invoiceNumber ?? generateRandomInvoiceNumber();
    return ffdH4StandaloneGoodsItem({
        invoiceNumber,
        documentReferences: [
            documentReference({
                documentCode: DOCUMENT_CODE.N935,
                documentStatus: DOCUMENT_STATUS.AC,
                documentReference: invoiceNumber,
            }),
            documentReference({
                documentCode: DOCUMENT_CODE.C644,
                documentStatus: DOCUMENT_STATUS.AE,
                documentReference: 'COI.XI.2026.3367889',
            }),
        ],
        additionalInformations: [
            additionalInformation({ code: ADDITIONAL_INFORMATION_CODE.SIMPLIFIED_AUTHORISATION_00100, description: 'Simplified authorisation' }),
            additionalInformation({ code: ADDITIONAL_INFORMATION_CODE.AUTHORISATION_BY_DECLARATION_ABDIN, description: 'Authorisation by Declaration' }),
        ],
        ...overrides,
    });
};

export const ffdH4TraderDdaGoodsItem = (overrides?: Partial<FfdH4GoodsData>): FfdH4GoodsData => {
    const invoiceNumber = overrides?.invoiceNumber ?? generateRandomInvoiceNumber();
    return ffdH4StandaloneGoodsItem({
        invoiceNumber,
        documentReferences: [
            documentReference({
                documentCode: DOCUMENT_CODE.N935,
                documentStatus: DOCUMENT_STATUS.AC,
                documentReference: invoiceNumber,
            }),
            documentReference({
                documentCode: DOCUMENT_CODE.C601,
                documentStatus: '',
                documentReference: IMPORTER_IPO,
            }),
            traderDdaDocument(),
        ],
        ...overrides,
    });
};

export const ffdH4CashAccountGoodsItem = (overrides?: Partial<FfdH4GoodsData>): FfdH4GoodsData => {
    const invoiceNumber = overrides?.invoiceNumber ?? generateRandomInvoiceNumber();
    return ffdH4StandaloneGoodsItem({
        invoiceNumber,
        documentReferences: [
            documentReference({
                documentCode: DOCUMENT_CODE.N935,
                documentStatus: DOCUMENT_STATUS.AC,
                documentReference: invoiceNumber,
            }),
            documentReference({
                documentCode: DOCUMENT_CODE.C601,
                documentStatus: '',
                documentReference: IMPORTER_IPO,
                documentReason: '',
            }),
            documentReference({
                documentCode: DOCUMENT_CODE.C505,
                documentStatus: DOCUMENT_STATUS.CC,
                documentReference: IMPORTER_CGU,
                documentReason: '',
            }),
        ],
        ...overrides,
    });
};

export const ffdH4FiscalHoldGoodsItem = (overrides?: Partial<FfdH4GoodsData>): FfdH4GoodsData => {
    const invoiceNumber = overrides?.invoiceNumber ?? generateRandomInvoiceNumber();
    return ffdH4StandaloneGoodsItem({
        invoiceNumber,
        documentReferences: [
            documentReference({
                documentCode: DOCUMENT_CODE.N935,
                documentStatus: DOCUMENT_STATUS.AC,
                documentReference: invoiceNumber,
            }),
            documentReference({
                documentCode: DOCUMENT_CODE.C601,
                documentStatus: '',
                documentReference: FISCAL_HOLD_IPO,
            }),
            traderDdaDocument(),
        ],
        ...overrides,
    });
};

/**
 * Goods item for an FFD H1 4051-1EN Inward Processing journey (IP discharge to
 * free circulation). The IP-specific documents and additional information codes
 * follow the same pattern as the IMMI 4051-1EN case; the H1 fields (preference,
 * nature of goods, valuation method, risk status) use the standard H1 defaults.
 */
export const ffdH1InwardProcessingGoodsItem = (
): FfdH1GoodsData => ffdH1StandaloneGoodsItem({
    procedureCode: PROCEDURE_CODES.FREE_CIRC_AFTER_IP_4051,
    additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.NO_OTHER_ADDITIONAL_CODE_000,
});

export const ffdH1InwardProcessingAbdGoodsItem = (
): FfdH1GoodsData => {
    const base = ffdH1InwardProcessingGoodsItem();
    return {
        ...base,
        additionalInformations: [
            ...(base.additionalInformations ?? []),
            additionalInformation({ code: ADDITIONAL_INFORMATION_CODE.SIMPLIFIED_AUTHORISATION_00100, description: 'Simplified authorisation' }),
            additionalInformation({ code: ADDITIONAL_INFORMATION_CODE.AUTHORISATION_BY_DECLARATION_ABDOU, description: '' }),
        ],
    };
};

/**
 * Goods item for an FFD H1 GB-NI 'At Risk' journey with EU CAP Safeguarding Duties.
 *
 * Commodity 0207141000 (poultry) enters NI at risk under the Windsor Framework —
 * EU duties apply, hence the safeguarding duty document set. C505/C506 are
 * declared explicitly alongside the 1207 Trader DDA indicator; N853 carries
 * the official health certificate; Y929 and 9120 cover the restriction waivers.
 */
export const ffdH1AtRiskEuCapGoodsItem = (overrides?: Partial<FfdH1GoodsData>): FfdH1GoodsData => {
    const invoiceNumber = overrides?.invoiceNumber ?? generateRandomInvoiceNumber();
    return ffdH1StandaloneGoodsItem({
        commodityCode: '0207141000',
        invoiceNumber,
        documentReferences: [
             traderDdaDocument(),
            documentReference({
                documentCode: DOCUMENT_CODE.N853,
                documentStatus: DOCUMENT_STATUS.XW,
                documentReference: 'GBCHD2025.001234',
                documentReason: 'Waiver claimed as licence not reqd',
            }),
            documentReference({
                documentCode: DOCUMENT_CODE['9120'],
                documentStatus: DOCUMENT_STATUS.AE,
                documentReference: 'GBAHC1234',
            }),
            documentReference({
                documentCode: DOCUMENT_CODE.N935,
                documentStatus: DOCUMENT_STATUS.AC,
                documentReference: invoiceNumber,
            }),
            organicRegulationExemptionDocument(),
        ],
        additionalInformations: [
            additionalInformation({ code: ADDITIONAL_INFORMATION_CODE.SIMPLIFIED_AUTHORISATION_00500, description: 'D' }),
        ],
        nationalAdditionalCodes: [NATIONAL_ADDITIONAL_CODE.VATZ],
        ...overrides,
    });
};

export const ffdH1AtRiskEuCapArrivedGoodsItem = (overrides?: Partial<FfdH1GoodsData>): FfdH1GoodsData =>
    ffdH1AtRiskEuCapGoodsItem({
        additionalInformations: [
            additionalInformation({ code: ADDITIONAL_INFORMATION_CODE.NIIMP, description: '' }),
            additionalInformation({ code: ADDITIONAL_INFORMATION_CODE.SIMPLIFIED_AUTHORISATION_00500, description: 'A' }),
        ],
        ...overrides,
    });

export const ffdH1NidomGoodsItem = (overrides?: Partial<FfdH1GoodsData>): FfdH1GoodsData =>
    ffdH1StandaloneGoodsItem({
        commodityCode: '6109100010',
        goodsDescription: 'Childrens clothing, packaged as sets various garments as a grouped consignment',
        invoiceNumber: '2000',
        countryOfOrigin: COUNTRY_CODE.UNITED_KINGDOM,
        procedureCode: PROCEDURE_CODES.FREE_CIRCULATION_4000,
        additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.SIMPLIFICATION_MULTI_TARIFF_F47,
        grossMass: '200',
        netMass: '150',
        numberOfPackages: '100',
        numberOfPieces: '3000',
        supplementaryUnits: '30',
        shippingMarks: 'CDSPDOEU987654',
        typeOfPackages: TYPE_OF_PACKAGES.BOX,
        valuationMethod: VALUATION_METHOD.TRANSACTION_VALUE,
        documentReferences: [
            traderDdaDocument(),
            documentReference({ documentCode: DOCUMENT_CODE.N935, documentStatus: DOCUMENT_STATUS.AC, documentReference: '12345/09.01.2022' }),
            documentReference({ documentCode: DOCUMENT_CODE['9WKS'], documentStatus: DOCUMENT_STATUS.AC, documentReference: 'GB553202734852', documentReason: '' }),
        ],
        additionalInformations: [
            additionalInformation({ code: ADDITIONAL_INFORMATION_CODE.NIREM, description: '' }),
        ],
        nationalAdditionalCodes: [NATIONAL_ADDITIONAL_CODE.VATZ],
        ...overrides,
    });

export const ffdH1NotAtRiskGoodsItem = (overrides?: Partial<FfdH1GoodsData>): FfdH1GoodsData =>
    ffdH1StandaloneGoodsItem({
        commodityCode: '0707000590',
        goodsDescription: 'Small cucumbers of a length not exceeding 15 cm',
        invoiceNumber: '2000',
        countryOfOrigin: COUNTRY_CODE.UNITED_KINGDOM,
        procedureCode: PROCEDURE_CODES.FREE_CIRCULATION_4000,
        additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.NO_OTHER_ADDITIONAL_CODE_000,
        grossMass: '505',
        netMass: '500',
        numberOfPackages: '100',
        shippingMarks: 'GBSB123456',
        typeOfPackages: TYPE_OF_PACKAGES.BOX,
        preference: PREFERENCE_CODE.NORMAL_THIRD_COUNTRY_TARIFF,
        valuationMethod: VALUATION_METHOD.TRANSACTION_VALUE,
        documentReferences: [
            traderDdaDocument(),
            organicRegulationExemptionDocument(),
            documentReference({ documentCode: DOCUMENT_CODE.N935, documentStatus: DOCUMENT_STATUS.AC, documentReference: '12345/31.07.2023' }),
        ],
        additionalInformations: [
            additionalInformation({ code: ADDITIONAL_INFORMATION_CODE.SIMPLIFIED_AUTHORISATION_00500, description: 'IMPORTER' }),
            additionalInformation({ code: ADDITIONAL_INFORMATION_CODE.NIREM, description: '' }),
        ],
        nationalAdditionalCodes: [NATIONAL_ADDITIONAL_CODE.VATZ],
        ...overrides,
    });

export const ffdH1AtRiskGoodsItem = (overrides?: Partial<FfdH1GoodsData>): FfdH1GoodsData =>
    ffdH1NotAtRiskGoodsItem({
        additionalInformations: [
            additionalInformation({ code: ADDITIONAL_INFORMATION_CODE.SIMPLIFIED_AUTHORISATION_00500, description: 'IMPORTER' }),
        ],
        ...overrides,
    });

export const ffdH1AtRiskSubsidyAppliedGoodsItem = (overrides?: Partial<FfdH1GoodsData>): FfdH1GoodsData =>
    ffdH1AtRiskGoodsItem({
        additionalRiskStatus: ADDITIONAL_RISK_STATUS.NIAID,
        preference: PREFERENCE_CODE.PREFERENCE_WITHOUT_CONDITIONS_OR_LIMITS,
        countryOfPreferentialOrigin: COUNTRY_CODE.UNITED_KINGDOM,
        documentReferences: [
            traderDdaDocument(),
            documentReference({ documentCode: DOCUMENT_CODE.C505, documentStatus: DOCUMENT_STATUS.CC, documentReference: 'GBCGUGuaranteenotrequired' }),
            organicRegulationExemptionDocument(),
            documentReference({
                documentCode: DOCUMENT_CODE.C644,
                documentStatus: DOCUMENT_STATUS.GE,
                documentReference: 'COI.XI.2025.AUTO001',
            }),
            documentReference({
                documentCode: DOCUMENT_CODE.U045,
                documentStatus: DOCUMENT_STATUS.AP,
                documentReference: 'U045-0054047',
            }),
            documentReference({ documentCode: DOCUMENT_CODE.N935, documentStatus: DOCUMENT_STATUS.AC, documentReference: '12345/23.04.2024' }),
        ],
        ...overrides,
    });

export const ffdH1StandardFrontierGoodsItem = (overrides?: Partial<FfdH1GoodsData>): FfdH1GoodsData =>
    ffdH1TraderDdaGoodsItem({
        commodityCode: '8510900000',
        goodsDescription: 'Parts for electric shavers, hair clippers and hair-removing appliances',
        invoiceNumber: '1000',
        countryOfOrigin: COUNTRY_CODE.UNITED_STATE_AMERICA,
        procedureCode: PROCEDURE_CODES.FREE_CIRCULATION_4000,
        additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.NO_OTHER_ADDITIONAL_CODE_000,
        grossMass: '150',
        netMass: '100',
        numberOfPackages: '50',
        shippingMarks: 'BX-1234228/34',
        typeOfPackages: TYPE_OF_PACKAGES.BOX,
        preference: PREFERENCE_CODE.NORMAL_THIRD_COUNTRY_TARIFF,
        valuationMethod: VALUATION_METHOD.TRANSACTION_VALUE,
        documentReferences: [
            traderDdaDocument(),
            documentReference({ documentCode: DOCUMENT_CODE.N935, documentStatus: DOCUMENT_STATUS.AC, documentReference: '12345/23.04.2024' }),
        ],
        ...overrides,
    });

export const ffdH1StandardFrontierMultipleGoodsItems = (): FfdH1GoodsData[] => {
    const shared: Partial<FfdH1GoodsData> = {
        shippingMarks: 'BX-1234228/35',
        documentReferences: [
            traderDdaDocument(),
            documentReference({ documentCode: DOCUMENT_CODE.C505, documentStatus: DOCUMENT_STATUS.CC, documentReference: 'GBCGUGuaranteenotrequired' }),
            documentReference({ documentCode: DOCUMENT_CODE.N935, documentStatus: DOCUMENT_STATUS.AC, documentReference: '12345/19.01.2021' }),
        ],
        previousDocuments: [
            previousDocument({ documentType: PREVIOUS_DOCUMENT_TYPE.ENTRY_SUMMARY_DECLARATION_355, documentReference: '21GB34F7Y1O2CX8PT4' }),
        ],
    };
    const smallItem: Partial<FfdH1GoodsData> = {
        ...shared,
        grossMass: '15',
        netMass: '10',
        supplementaryUnits: '10',
        invoiceNumber: '100',
        numberOfPackages: '15',
    };
    return [
        ffdH1StandardFrontierGoodsItem({ ...shared, goodsDescription: 'Parts for shavers and hair clippers' }),
        ffdH1StandardFrontierGoodsItem({ ...smallItem, commodityCode: '8510100000', goodsDescription: 'Shavers' }),
        ffdH1StandardFrontierGoodsItem({ ...smallItem, commodityCode: '8510200000', goodsDescription: 'Hair Clippers' }),
    ];
};

export const ffdH2ReimportAfterTemporaryExportGoodsItem = (overrides?: Partial<FfdH2GoodsData>): FfdH2GoodsData =>
    ffdH2StandaloneGoodsItem({
        procedureCode: PROCEDURE_CODES.ENTRY_TO_CW_AFTER_OP_OTHER_7122,
        additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.RETURN_AFTER_REPAIR_GUARANTEE_B02,
        commodityCode: '42021219',
        goodsDescription: 'Vanity case with outer surface made of plastic sheet',
        countryOfOrigin: COUNTRY_CODE.UNITED_STATE_AMERICA,
        grossMass: '150',
        shippingMarks: 'CDSSCENARIO07',
        numberOfPackages: '50',
        typeOfPackages: TYPE_OF_PACKAGES.BOX,
        documentReferences: [
            documentReference({ documentCode: DOCUMENT_CODE.C019, documentStatus: undefined, documentReference: IMPORTER_OPO, documentReason: '' }),
            documentReference({ documentCode: DOCUMENT_CODE.C505, documentStatus: DOCUMENT_STATUS.CC, documentReference: IMPORTER_CGU }),
            documentReference({ documentCode: DOCUMENT_CODE.C517, documentStatus: undefined, documentReference: IMPORTER_CWP, documentReason: '' }),
        ],
        additionalInformations: [
            additionalInformation({ code: ADDITIONAL_INFORMATION_CODE.SIMPLIFIED_AUTHORISATION_00500, description: 'IMPORTER' }),
            additionalInformation({ code: ADDITIONAL_INFORMATION_CODE.GEN45, description: 'Handbag defect repair invoice 123456' }),
        ],
        ...overrides,
    });

export const ffdH3TemporaryAdmissionOfPackingsGoodsItem = (overrides?: Partial<FfdH3GoodsData>): FfdH3GoodsData =>
    ffdH3StandaloneGoodsItem({
        procedureCode: PROCEDURE_CODES.ENTRY_TO_TA_5300,
        additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.PACKINGS_EMPTY_D15,
        commodityCode: '4415101000',
        goodsDescription: 'Cases, boxes, crates, drums and similar packings',
        countryOfOrigin: COUNTRY_CODE.UNITED_STATE_AMERICA,
        preference: PREFERENCE_CODE.NORMAL_THIRD_COUNTRY_TARIFF,
        valuationMethod: VALUATION_METHOD.TRANSACTION_VALUE,
        grossMass: '1000',
        netMass: '800',
        supplementaryUnits: '1',
        invoiceNumber: '1000',
        shippingMarks: 'CS-1234228/34',
        numberOfPackages: '30',
        typeOfPackages: TYPE_OF_PACKAGES.CASE,
        documentReferences: [
            traderDdaDocument(),
            documentReference({ documentCode: DOCUMENT_CODE.Y900, documentStatus: '', documentReason: 'CITES Permits not required', documentReference:'' }),
            documentReference({ documentCode: DOCUMENT_CODE.C516, documentStatus: '', documentReference: IMPORTER_TEA }),
        ],
        additionalInformations: [
            additionalInformation({ code: ADDITIONAL_INFORMATION_CODE.SIMPLIFIED_AUTHORISATION_00500, description: 'IMPORTER' }),
            additionalInformation({ code: ADDITIONAL_INFORMATION_CODE.GEN28, description: '28 days duration to be re exported on 30112021' }),
        ],
        ...overrides,
    });

export const ffdH3ProfessionalEquipmentMultipleGoodsItems = (): FfdH3GoodsData[] => {
    const shared: Partial<FfdH3GoodsData> = {
        procedureCode: PROCEDURE_CODES.ENTRY_TO_TA_5300,
        additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.PROFESSIONAL_EQUIPMENT_D12,
        supervisingCustomsOffice: SUPERVISING_CUSTOMS_OFFICE.GBSFY001,
        countryOfOrigin: COUNTRY_CODE.UNITED_STATE_AMERICA,
        preference: PREFERENCE_CODE.NORMAL_THIRD_COUNTRY_TARIFF,
        valuationMethod: VALUATION_METHOD.TRANSACTION_VALUE,
        numberOfPackages: '1',
        typeOfPackages: TYPE_OF_PACKAGES.CASE,
        additionalInformations: [
            additionalInformation({ code: ADDITIONAL_INFORMATION_CODE.SIMPLIFIED_AUTHORISATION_00100, description: 'Simplified Authorisation' }),
            additionalInformation({ code: ADDITIONAL_INFORMATION_CODE.AUTHORISATION_BY_DECLARATION_ABDIN, description: 'Authorisation by declaration' }),
            additionalInformation({ code: ADDITIONAL_INFORMATION_CODE.GEN28, description: '28 days duration to be re exported on 30112021' }),
            additionalInformation({ code: ADDITIONAL_INFORMATION_CODE.GEN30, description: 'Instruments for tour band playing at London Arena' }),
            additionalInformation({ code: ADDITIONAL_INFORMATION_CODE.GEN31, description: 'Les McQueen New York US 1 Main Street NY1 234 sales invoices in name of' }),
        ],
    };
    const citesNotRequired = documentReference({ documentCode: DOCUMENT_CODE.Y900, documentStatus: '', documentReason: 'CITES Permits not required', documentReference:'' });
    const temporaryAdmission = documentReference({
        documentCode: DOCUMENT_CODE.C516,
        documentStatus: '',
        documentReference: IMPORTER_TEA,
        documentReason: '',
    });
    return [
        ffdH3StandaloneGoodsItem({
            ...shared,
            commodityCode: '9207901000',
            goodsDescription: 'Electric Guitar in aluminium case',
            grossMass: '10',
            netMass: '8',
            supplementaryUnits: '1',
            invoiceNumber: '1000',
            shippingMarks: 'CS-1234228/34',
            documentReferences: [traderDdaDocument(), citesNotRequired, temporaryAdmission],
        }),
        ffdH3StandaloneGoodsItem({
            ...shared,
            commodityCode: '9206000000',
            goodsDescription: 'Drum Kit in aluminium shipping case',
            grossMass: '80',
            netMass: '70',
            invoiceNumber: '2000',
            shippingMarks: 'CS-1234228/35',
            documentReferences: [
                traderDdaDocument(),
                citesNotRequired,
                documentReference({ documentCode: DOCUMENT_CODE.Y922, documentStatus: '', documentReason: 'No cat or dog fur' }),
                temporaryAdmission,
                documentReference({ documentCode: DOCUMENT_CODE['9028'], documentStatus: DOCUMENT_STATUS.AC, documentReference: 'DEFRAIV 0054037-0054047' }),
            ],
        }),
        ffdH3StandaloneGoodsItem({
            ...shared,
            commodityCode: '9207105000',
            goodsDescription: 'Drum Kit in aluminium shipping case',
            grossMass: '20',
            netMass: '15',
            supplementaryUnits: '1',
            invoiceNumber: '3000',
            shippingMarks: 'CS-1234228/36',
            documentReferences: [traderDdaDocument(), temporaryAdmission],
        }),
    ];
};

export const ffdH3MedicalEquipmentWithoutC516GoodsItem = (overrides?: Partial<FfdH3GoodsData>): FfdH3GoodsData =>
    ffdH3StandaloneGoodsItem({
        procedureCode: PROCEDURE_CODES.ENTRY_TO_TA_5300,
        additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.MEDICAL_SURGICAL_LAB_EQUIPMENT_D07,
        commodityCode: '9019202000',
        goodsDescription: 'Mechanical ventilation apparatus, non-invasive',
        countryOfOrigin: COUNTRY_CODE.UNITED_STATE_AMERICA,
        preference: PREFERENCE_CODE.NORMAL_THIRD_COUNTRY_TARIFF,
        valuationMethod: VALUATION_METHOD.TRANSACTION_VALUE,
        grossMass: '1000',
        netMass: '800',
        supplementaryUnits: '800',
        invoiceNumber: '10000',
        shippingMarks: 'CS-1234228/34',
        numberOfPackages: '30',
        typeOfPackages: TYPE_OF_PACKAGES.CASE,
        documentReferences: [
            traderDdaDocument(),
            documentReference({
                documentCode: DOCUMENT_CODE.Y160,
                documentStatus: '',
                documentReference: '',
                documentReason: 'Not concerned with Reg 2024/573',
            }),
        ],
        additionalInformations: [
            ...authorisationByDeclarationInformations(),
            additionalInformation({ code: ADDITIONAL_INFORMATION_CODE.GEN28, description: '15 days duration to be re exported on 29022024' }),
            additionalInformation({ code: ADDITIONAL_INFORMATION_CODE.GEN30, description: '30 days duration to be re exported on 29022024' }),
            additionalInformation({ code: ADDITIONAL_INFORMATION_CODE.SIMPLIFIED_AUTHORISATION_00500, description: 'IMPORTER' }),
        ],
        nationalAdditionalCodes: [NATIONAL_ADDITIONAL_CODE.VATZ],
        ...overrides,
    });

export const ffdH4AuthorisationByDeclarationWithoutC601GoodsItem = (overrides?: Partial<FfdH4GoodsData>): FfdH4GoodsData =>
    ffdH4StandaloneGoodsItem({
        procedureCode: PROCEDURE_CODES.ENTRY_TO_IP_5100,
        additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.NO_OTHER_ADDITIONAL_CODE_000,
        commodityCode: '0703900000',
        goodsDescription: 'Premium quality Leeks',
        countryOfOrigin: COUNTRY_CODE.UNITED_STATE_AMERICA,
        preference: PREFERENCE_CODE.NORMAL_THIRD_COUNTRY_TARIFF,
        valuationMethod: VALUATION_METHOD.TRANSACTION_VALUE,
        grossMass: '2200',
        netMass: '2000',
        itemPriceAmount: '2500',
        shippingMarks: 'ADRN123456123',
        numberOfPackages: '100',
        typeOfPackages: TYPE_OF_PACKAGES.BOX,
        documentReferences: [
            traderDdaDocument(),
            documentReference({ documentCode: DOCUMENT_CODE.C644, documentStatus: DOCUMENT_STATUS.AE, documentReference: 'COI.XI.2025.AUTO001' }),
        ],
        additionalInformations: [
            ...authorisationByDeclarationInformations(),
            additionalInformation({ code: ADDITIONAL_INFORMATION_CODE.SIMPLIFIED_AUTHORISATION_00500, description: 'Simplified Authorisation' }),
        ],
        nationalAdditionalCodes: [NATIONAL_ADDITIONAL_CODE.VATZ],
        ...overrides,
    });

export const ffdH4FromCustomsWarehouseWithoutC601GoodsItem = (overrides?: Partial<FfdH4GoodsData>): FfdH4GoodsData =>
    ffdH4AuthorisationByDeclarationWithoutC601GoodsItem({
        procedureCode: PROCEDURE_CODES.ENTRY_TO_IP_FROM_CW_5171,
        documentReferences: [
            traderDdaDocument(),
            documentReference({ documentCode: DOCUMENT_CODE.C517, documentStatus: undefined, documentReference: IMPORTER_CWP, documentReason: '' }),
            documentReference({ documentCode: DOCUMENT_CODE.C644, documentStatus: DOCUMENT_STATUS.AE, documentReference: 'COI.XI.2025.AUTO001' }),
        ],
        ...overrides,
    });
