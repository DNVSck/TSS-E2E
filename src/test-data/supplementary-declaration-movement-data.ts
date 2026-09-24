import { MovementData } from './movements-data';
import { ConsignmentData } from './consignment-data';
import { GoodsData } from './goods-data';
import { previousDocument } from './previous-document-data';
import { TYPE_OF_MOVEMENT_OPTION_CODE } from '../constant/type-of-movement-code-constant';
import { documentReference, ensSfdGoodsDocuments, goodsDocumentsWithoutSde } from './document-reference-data';
import { holderOfAuthorisation } from './holder-of-authorisation-data';
import { PROCEDURE_CODES } from '../constant/procedure-codes-constant';
import { ADDITIONAL_RISK_STATUS } from '../constant/additional-risk-status-constant';
import { ADDITIONAL_PROCEDURE_CODES } from '../constant/additional-procedure-codes-constant';
import { DOCUMENT_CODE } from '../constant/document-code-constant';
import { DOCUMENT_STATUS } from '../constant/document-status-constant';
import { AUTHORISATION_TYPE_CODE } from '../constant/authorisation-type-code-constant';
import { additionalInformation } from './additional-information-data';
import { ADDITIONAL_INFORMATION_CODE } from '../constant/additional-information-constant';
import {
    IMPORTER_CGU, IMPORTER_IPO, IMPORTER_SDE, IMPORTER_TEA,
    TSS_DDA_COMPANY_NAME, TSS_DDA_EORI, assertEnvSet,
} from '../../config/environment';
import { COUNTRY_CODE } from '../constant/country-code-dropdown-constant';
import { CONSIGNMENT_GOODS_DOMESTIC_STATUS } from '../constant/consignment-goods-domestic-status-constant';

/**
 * The frontier movement a supplementary declaration is raised FROM.
 *
 * Not a declaration in its own right - it is the three sets of answers that shape the
 * ENS-SFD journey run to produce an SD, expressed the way
 * `completeEnsDeclarationFlow` asks for them. Everything else about that journey comes
 * from its own defaults; only what this journey needs differently is stated here.
 *
 * Kept apart from SupplementaryDeclarationData because they answer different screens at
 * different times: this one is spent before the SD exists, that one after. A single
 * object holding both would let a spec set a field that had already stopped mattering.
 */
export interface SupplementaryDeclarationMovementData {
    movementOverrides: Partial<MovementData>;
    consignmentOverrides: Partial<ConsignmentData>;
    goodsItemOverrides: Partial<GoodsData>;
}

const defaults: SupplementaryDeclarationMovementData = {
    movementOverrides: {
        typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
    },
    consignmentOverrides: {
        headerPreviousDocuments: [
            previousDocument({ documentReference: '3XI352196303000-12345' })
        ],
    },
    goodsItemOverrides: {
        documentReferences: ensSfdGoodsDocuments(),
    },
};

/**
 * Build the answers for the movement a supplementary declaration is raised from.
 *
 * Overrides replace a whole set rather than merging into it - a spec changing the goods
 * item says everything it wants that goods item to carry. Merging would let a document
 * this journey no longer cites survive because nobody remembered to remove it.
 */
export const supplementaryDeclarationMovement = (
    overrides?: Partial<SupplementaryDeclarationMovementData>
): SupplementaryDeclarationMovementData => ({
    ...defaults,
    ...overrides,
});

function assertTssDdaConfigured(): void {
    assertEnvSet(
        { TSS_DDA_EORI, TSS_DDA_COMPANY_NAME },
        'Cannot raise the TSS DDA supplementary declaration',
        'The consignment names this company as the importer, and the Agent represents it to complete the declaration.'
    );
}

export const tssDdaSupplementaryDeclarationMovement = (): SupplementaryDeclarationMovementData => {
    assertTssDdaConfigured();

    return supplementaryDeclarationMovement({
        consignmentOverrides: { ...defaults.consignmentOverrides, importerEORI: TSS_DDA_EORI },
        goodsItemOverrides: { documentReferences: goodsDocumentsWithoutSde() },
    });
};

export const tssDdaTraderApiSupplementaryDeclarationMovement = (): SupplementaryDeclarationMovementData => {
    assertTssDdaConfigured();

    return {
        movementOverrides: {},
        consignmentOverrides: { importerEORI: TSS_DDA_EORI, useImporterSde: false },
        goodsItemOverrides: {},
    };
};

/**
 * Build the answers for an ENS-SFD movement that will generate a Supplementary
 * Declaration for Entry to Temporary Admission goods (RoRo Unaccompanied, At Risk).
 *
 * This variant sets:
 * - RoRo Unaccompanied (not accompanied)
 * - Procedure code 5300 (Entry to Temporary Admission)
 * - Additional risk status NIREM (At Risk classification)
 * - C672 document reference with AC status
 */
export const tempAdmissionSupplementaryDeclarationMovement = (
    overrides?: Partial<SupplementaryDeclarationMovementData>
): SupplementaryDeclarationMovementData => ({
    movementOverrides: {
        typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_UNACCOMPANIED,
        ...overrides?.movementOverrides,
    },
    consignmentOverrides: {
        headerPreviousDocuments: [
            previousDocument({ documentReference: '5GB553202734852-09042025' })
        ],
        holdersOfAuthorisation: [
            holderOfAuthorisation({ typeCode: AUTHORISATION_TYPE_CODE.TEMPORARY_ADMISSION_TEA })
        ],
        ...overrides?.consignmentOverrides,
    },
    goodsItemOverrides: {
        countryOfOrigin: COUNTRY_CODE.GREECE,
        commodityCode: '8471300000',
        goodsDescription: 'Professional equipment - portable computers',
        procedureCode: PROCEDURE_CODES.ENTRY_TO_TA_5300,
        additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.PROFESSIONAL_EQUIPMENT_D12,
        additionalRiskStatus: ADDITIONAL_RISK_STATUS.NIREM,
        supplementaryUnits: '12',
        documentReferences: [
            documentReference({
                documentCode: DOCUMENT_CODE.C672,
                documentStatus: DOCUMENT_STATUS.AC,
                documentReference: '0054037-0054047',
            }),
            documentReference({
                documentCode: DOCUMENT_CODE.C516,
                documentStatus: undefined,
                documentReference: IMPORTER_TEA,
            }),
        ],
        additionalInformations: [
            additionalInformation({ code: ADDITIONAL_INFORMATION_CODE.GEN28, description: 'Duration of intended usage followed by intended date of re-export'}),
            additionalInformation({ code: ADDITIONAL_INFORMATION_CODE.GEN30, description: 'The use to which the Temporary Admission goods will be put'}),
            additionalInformation({ code: ADDITIONAL_INFORMATION_CODE.GEN31, description: 'Name and address of the non-Union owner, plus the type of ownership evidence held'})
        ],
        ...overrides?.goodsItemOverrides,
    },
    ...overrides,
});

/**
 * Build the answers for an ENS-SFD movement that will generate a Supplementary
 * Declaration for Entry to Inward Processing goods (RoRo Unaccompanied, At Risk).
 *
 * This variant sets:
 * - RoRo Unaccompanied (not accompanied)
 * - Entry to Inward Processing procedure (5100)
 * - Additional risk status NIREM (At Risk classification)
 * - Inward Processing authorisation and associated documents
 */
export const inwardProcessingSfdSupplementaryDeclarationMovement = (
    overrides?: Partial<SupplementaryDeclarationMovementData>
): SupplementaryDeclarationMovementData => ({
    movementOverrides: {
        typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_UNACCOMPANIED,
        ...overrides?.movementOverrides,
    },
    consignmentOverrides: {
        isBuyerSameAsImporter: true,
        isSellerSameAsExporter: true,
        goodsDomesticStatus: CONSIGNMENT_GOODS_DOMESTIC_STATUS.NIIMP,
        headerPreviousDocuments: [
            previousDocument({ documentReference: '5GB553202734852-09042025' })
        ],
        holdersOfAuthorisation: [
            holderOfAuthorisation({ typeCode: AUTHORISATION_TYPE_CODE.INWARD_PROCESSING_IPO
             }),
            holderOfAuthorisation({ typeCode: AUTHORISATION_TYPE_CODE.CUSTOMS_COMPREHENSIVE_GUARANTEE_CGU }),
        ],
        ...overrides?.consignmentOverrides,
    },
    goodsItemOverrides: {
        procedureCode: PROCEDURE_CODES.ENTRY_TO_IP_5100,
        additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.INWARD_PROCESSING_VAT_ONLY_A04,
        additionalRiskStatus: ADDITIONAL_RISK_STATUS.NIREM,
        commodityCode: '7209169000',
        goodsDescription: 'Cold-rolled steel sheets for manufacturing',
        documentReferences: [
            documentReference({
                documentCode: DOCUMENT_CODE.Y922,
                documentStatus: undefined,
                documentReference: 'EXEMPT',
                documentReason: 'EXEMPT',
            }),
            documentReference({
                documentCode: DOCUMENT_CODE.Y824,
                documentStatus: undefined,
                documentReference: 'ORIGIN CERTIFIED',
                documentReason: 'ORIGIN CERTIFIED',
            }),
            documentReference({
                documentCode: DOCUMENT_CODE.C601,
                documentStatus: DOCUMENT_STATUS.AC,
                documentReference: IMPORTER_IPO,
            }),
            documentReference({
                documentCode: DOCUMENT_CODE.Y900,
                documentStatus: undefined,
                documentReference: 'EXEMPT',
                documentReason: 'EXEMPT',
            }),
            documentReference({
                documentCode: DOCUMENT_CODE.C505,
                documentStatus: DOCUMENT_STATUS.AC,
                documentReference: IMPORTER_CGU,
            }),
            documentReference({
                documentCode: DOCUMENT_CODE.C512,
                documentStatus: undefined,
                documentReference: IMPORTER_SDE,
            }),
        ],
        ...overrides?.goodsItemOverrides,
    },
    ...overrides,
});

/**
 * Build the answers for an ENS-SFD movement that will generate a Supplementary
 * Declaration for Excise Goods (RoRo Accompanied, At Risk).
 *
 * This variant sets:
 * - RoRo Accompanied (transport mode)
 * - Free Circulation procedure code (4000)
 * - Additional risk status NIREM (At Risk classification)
 * - Excisable goods commodity code (tobacco)
 * - Excise goods grouping additional procedure code (1EB)
 */
export const exciseGoodsRoRoAccompaniedSupplementaryDeclarationMovement = (
    overrides?: Partial<SupplementaryDeclarationMovementData>
): SupplementaryDeclarationMovementData => ({
    movementOverrides: {
        typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
        ...overrides?.movementOverrides,
    },
    consignmentOverrides: {
        headerPreviousDocuments: [
            previousDocument({ documentReference: '3XI352196303000-12345' })
        ],
        ...overrides?.consignmentOverrides,
    },
    goodsItemOverrides: {
        countryOfOrigin: COUNTRY_CODE.UNITED_KINGDOM,
        commodityCode: '2404199000',
        goodsDescription: 'Smoking tobacco, whether or not containing tobacco substitutes in any proportion',
        procedureCode: PROCEDURE_CODES.FREE_CIRCULATION_4000,
        additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.NO_OTHER_ADDITIONAL_CODE_000,
        additionalRiskStatus: ADDITIONAL_RISK_STATUS.NIREM,
        supplementaryUnits: '100',
        documentReferences: ensSfdGoodsDocuments(),
        ...overrides?.goodsItemOverrides,
    },
    ...overrides,
});

/**
 * Build the answers for an ENS-SFD movement that will generate a Supplementary
 * Declaration for Goods with SCDP Authorization (RoRo Accompanied, At Risk).
 *
 * This variant sets:
 * - RoRo Accompanied (transport mode)
 * - Free Circulation procedure code (4000)
 * - Additional risk status NIREM (At Risk classification)
 * - SCDP/SDE (Simplified Declaration Procedure) authorization holder
 * - Standard commodity code (non-excise goods)
 * - No special additional procedure code (000)
 */
export const scdpRoRoAccompaniedSupplementaryDeclarationMovement = (
    overrides?: Partial<SupplementaryDeclarationMovementData>
): SupplementaryDeclarationMovementData => ({
    movementOverrides: {
        typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
        ...overrides?.movementOverrides,
    },
    consignmentOverrides: {
        headerPreviousDocuments: [
            previousDocument({ documentReference: '3XI352196303000-12345' })
        ],
        holdersOfAuthorisation: [
            holderOfAuthorisation({ typeCode: AUTHORISATION_TYPE_CODE.SIMPLIFIED_DECLARATION_PROCEDURE_SDE })
        ],
        ...overrides?.consignmentOverrides,
    },
    goodsItemOverrides: {
        countryOfOrigin: COUNTRY_CODE.UNITED_KINGDOM,
        commodityCode: '4000000000',
        goodsDescription: 'General goods for free circulation',
        procedureCode: PROCEDURE_CODES.FREE_CIRCULATION_4000,
        additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.NO_OTHER_ADDITIONAL_CODE_000,
        additionalRiskStatus: ADDITIONAL_RISK_STATUS.NIREM,
        supplementaryUnits: '1',
        documentReferences: ensSfdGoodsDocuments(),
        ...overrides?.goodsItemOverrides,
    },
    ...overrides,
});
