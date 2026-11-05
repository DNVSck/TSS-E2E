import { MovementData } from './movements-data';
import { ConsignmentData } from './consignment-data';
import { GoodsData } from './goods-data';
import { exciseWarehouseDeclaration } from './ens-declaration-data';
import { previousDocumentDCR, ensHeaderPreviousDocument } from './previous-document-data';
import { TYPE_OF_MOVEMENT_OPTION_CODE } from '../constant/type-of-movement-code-constant';
import {
    document9120, documentC505, documentC512, documentC516, documentC601, documentC672,
    documentC679, documentN760, documentY824, documentY900, documentY922,
    ensSfdGoodsDocuments, goodsDocumentsWithoutSde,
} from './document-reference-data';
import { holderCGU, holderIPO, holderSDE, holderTEA } from './holder-of-authorisation-data';
import { PROCEDURE_CODES } from '../constant/procedure-codes-constant';
import { ADDITIONAL_PROCEDURE_CODES } from '../constant/additional-procedure-codes-constant';
import { DOCUMENT_STATUS } from '../constant/document-status-constant';
import {
    informationGEN28, informationGEN30, informationGEN31, informationNIIMP, informationOSR42,
} from './additional-information-data';
import { HAULIER_EORI, IMPORTER_VAT, TSS_DDA_COMPANY_NAME, TSS_DDA_EORI, assertEnvSet } from '../../config/environment';
import { COUNTRY_CODE } from '../constant/country-code-dropdown-constant';
import { CONSIGNMENT_GOODS_DOMESTIC_STATUS } from '../constant/consignment-goods-domestic-status-constant';
import { ADDITIONAL_PARTY_ROLE, CONTROLLED_GOODS_TYPE } from '../constant/trader-api/trader-api-request-constant';

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
            ensHeaderPreviousDocument()
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

export const importerWithoutUkimsSupplementaryDeclarationMovement = (): SupplementaryDeclarationMovementData => ({
    movementOverrides: {},
    consignmentOverrides: { importerEORI: HAULIER_EORI, useImporterSde: false },
    goodsItemOverrides: { documentReferences: goodsDocumentsWithoutSde() },
});

const WAIVER_REASON = 'Reason for waiver';

export const onwardSupplyReliefSupplementaryDeclarationMovement = (): SupplementaryDeclarationMovementData => ({
    movementOverrides: {},
    consignmentOverrides: {
        goodsDomesticStatus: CONSIGNMENT_GOODS_DOMESTIC_STATUS.NIIMP,
        destinationCountryCode: COUNTRY_CODE.IRELAND,
    },
    goodsItemOverrides: {
        procedureCode: PROCEDURE_CODES.FREE_CIRC_WITH_ONWARD_SUPPLY_4200,
        additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.NO_OTHER_ADDITIONAL_CODE_000,
        commodityCode: '6203423500',
        goodsDescription: "200 pairs of Men's brown trousers, made of cotton, in various sizes and lengths",
        countryOfOrigin: COUNTRY_CODE.UNITED_STATE_AMERICA,
        supplementaryUnits: '200',
        controlledGoodsType: CONTROLLED_GOODS_TYPE.PLANT_BASED,
        documentReferences: [
            documentC679(),
            documentY922({ documentReason: WAIVER_REASON }),
            documentN760({ documentReference: '056789/202 21.01.2025' }),
            document9120({ documentStatus: DOCUMENT_STATUS.XX, documentReason: WAIVER_REASON }),
        ],
        additionalInformations: [
            informationNIIMP(),
            informationOSR42(),
        ],
        additionalParties: [
            { roleId: `${COUNTRY_CODE.UNITED_KINGDOM}${IMPORTER_VAT}`, roleCode: ADDITIONAL_PARTY_ROLE.IMPORTER_VAT_FR1 },
            { roleId: 'FR123457845', roleCode: ADDITIONAL_PARTY_ROLE.CUSTOMER_VAT_FR2 },
        ],
    },
});

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
            previousDocumentDCR({ documentReference: '5GB553202734852-09042025' })
        ],
        holdersOfAuthorisation: [
            holderTEA()
        ],
        ...overrides?.consignmentOverrides,
    },
    goodsItemOverrides: {
        countryOfOrigin: COUNTRY_CODE.GREECE,
        commodityCode: '8471300000',
        goodsDescription: 'Professional equipment - portable computers',
        procedureCode: PROCEDURE_CODES.ENTRY_TO_TA_5300,
        additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.PROFESSIONAL_EQUIPMENT_D12,
        supplementaryUnits: '12',
        documentReferences: [
            documentC672(),
            documentC516(),
        ],
        additionalInformations: [
            informationGEN28({ description: 'Duration of intended usage followed by intended date of re-export' }),
            informationGEN30(),
            informationGEN31()
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
            previousDocumentDCR({ documentReference: '5GB553202734852-09042025' })
        ],
        holdersOfAuthorisation: [
            holderIPO(),
            holderCGU(),
        ],
        ...overrides?.consignmentOverrides,
    },
    goodsItemOverrides: {
        procedureCode: PROCEDURE_CODES.ENTRY_TO_IP_5100,
        additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.INWARD_PROCESSING_VAT_ONLY_A04,
        commodityCode: '7209169000',
        goodsDescription: 'Cold-rolled steel sheets for manufacturing',
        documentReferences: [
            documentY922({ documentReason: 'EXEMPT' }),
            documentY824(),
            documentC601(),
            documentY900({ documentReason: 'EXEMPT' }),
            documentC505({ documentStatus: DOCUMENT_STATUS.AC }),
            documentC512(),
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
 * - The ENS-SFD excise warehouse declaration (0700-F06) - see exciseWarehouseDeclaration
 */
export const exciseGoodsRoRoAccompaniedSupplementaryDeclarationMovement = (
    overrides?: Partial<SupplementaryDeclarationMovementData>
): SupplementaryDeclarationMovementData => {
    const exciseWarehouse = exciseWarehouseDeclaration();

    return {
        movementOverrides: {
            typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
            ...overrides?.movementOverrides,
        },
        consignmentOverrides: {
            ...exciseWarehouse.consignmentOverrides,
            ...overrides?.consignmentOverrides,
        },
        goodsItemOverrides: {
            ...exciseWarehouse.goodsItemOverrides,
            ...overrides?.goodsItemOverrides,
        },
        ...overrides,
    };
};

/**
 * Build the answers for an ENS-SFD movement that will generate a Supplementary
 * Declaration for Goods with SCDP Authorization (RoRo Accompanied, At Risk).
 *
 * This variant sets:
 * - RoRo Accompanied (transport mode)
 * - Free Circulation procedure code (4000)
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
            ensHeaderPreviousDocument()
        ],
        holdersOfAuthorisation: [
            holderSDE()
        ],
        ...overrides?.consignmentOverrides,
    },
    goodsItemOverrides: {
        countryOfOrigin: COUNTRY_CODE.UNITED_KINGDOM,
        commodityCode: '4000000000',
        goodsDescription: 'General goods for free circulation',
        procedureCode: PROCEDURE_CODES.FREE_CIRCULATION_4000,
        additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.NO_OTHER_ADDITIONAL_CODE_000,
        supplementaryUnits: '1',
        documentReferences: ensSfdGoodsDocuments(),
        ...overrides?.goodsItemOverrides,
    },
    ...overrides,
});
