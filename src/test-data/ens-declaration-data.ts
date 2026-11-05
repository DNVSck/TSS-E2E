import { TestInfo } from '@playwright/test';
import { BASE_URL } from '../../config/environment';
import { PROCEDURE_CODES } from '../constant/procedure-codes-constant';
import { ADDITIONAL_PROCEDURE_CODES } from '../constant/additional-procedure-codes-constant';
import { ConsignmentData, ensOnlyConsignment } from './consignment-data';
import { MovementData } from './movements-data';
import { MARITIME_NON_ILP_PORT } from '../constant/maritime-non-ilp-port-constant';
import { EnsDeclarationOptions } from '../flows/common-flows/create-draft-ens-declaration-flow';
import { previousDocument355, previousDocumentDCR, ensHeaderPreviousDocument } from './previous-document-data';
import { document1UKI, documentC676, ensSfdGoodsDocuments } from './document-reference-data';
import { holderEXW, holderUKIM } from './holder-of-authorisation-data';
import { TYPE_OF_MOVEMENT_OPTION_CODE } from '../constant/type-of-movement-code-constant';
import { informationECONR } from './additional-information-data';
import { generateRandomTransportDocumentNumber } from '../helper/data-generate-helper';


export const ensSfdDeclaration = (
    testInfo: TestInfo,
    consignmentOverrides: Partial<ConsignmentData>
): EnsDeclarationOptions => ({
    testInfo,
    url: BASE_URL,
    movementOverrides: {
        typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
    },
    consignmentOverrides: {
        headerPreviousDocuments: [
            ensHeaderPreviousDocument()
        ],
        ...consignmentOverrides,
    },
    goodsItemOverrides: {
        documentReferences: ensSfdGoodsDocuments(),
    },
});

export const exciseWarehouseDeclaration = (): Pick<EnsDeclarationOptions, 'consignmentOverrides' | 'goodsItemOverrides'> => ({
    consignmentOverrides: {
        holdersOfAuthorisation: [
            holderEXW(),
        ],
    },
    goodsItemOverrides: {
        procedureCode: PROCEDURE_CODES.FREE_CIRC_WITH_EXCISE_WAREHOUSE_0700,
        additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.EXCISE_MOVEMENT_DUTY_SUSPENSION_F06,
        documentReferences: [
            ...ensSfdGoodsDocuments(),
            documentC676(),
        ],
        additionalInformations: [
            informationECONR(),
        ],
    },
});

/**
 * The ENS-ONLY declaration under test - the journey that generates nothing else.
 *
 *
 * `isEnsOnly` needs a reason, which ensOnlyConsignment supplies - see it for the default.
 */
export const ensOnlyDeclaration = (
    testInfo: TestInfo,
    consignmentOverrides: Partial<ConsignmentData>
): EnsDeclarationOptions => ({
    testInfo,
    url: BASE_URL,
    movementOverrides: {
        typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
    },
    consignmentOverrides: ensOnlyConsignment({
        headerPreviousDocuments: [
            ensHeaderPreviousDocument()
        ],
        ...consignmentOverrides,
    }),
    goodsItemOverrides: {
        documentReferences: ensSfdGoodsDocuments(),
    },
});


export const ensImmiDeclaration = (
    testInfo: TestInfo,
    goodsItemOverrides: Partial<EnsDeclarationOptions['goodsItemOverrides']> = {},
    consignmentOverrides: Partial<ConsignmentData> = {}
): EnsDeclarationOptions => ({
    testInfo,
    url: BASE_URL,
    movementOverrides: {
        typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
    },
    consignmentOverrides: {
        useIMMI: true,
        headerPreviousDocuments: [
            previousDocumentDCR()
        ],
        // Valid, so the only thing wrong with a rejected IMMI is what the lever changed.
        holdersOfAuthorisation: [immiAuthorisation()],
        ...consignmentOverrides,
    },
    goodsItemOverrides: {
        useTGP: false,
        procedureCode: PROCEDURE_CODES.FREE_CIRCULATION_4000,
        additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.SPIMM_STANDARD_GOODS_1SG,
        commodityCode: '630629',
        documentReferences: [
            document1UKI(),
        ],
        previousDocuments: [
            previousDocument355(),
        ],
        supplementaryUnits: '1',
        ...goodsItemOverrides,
    },
});


const immiAuthorisation = (roleId?: string) =>
    holderUKIM(roleId ? { roleId } : {});


export const ensEidrDeclaration = (
    testInfo: TestInfo,
    consignmentOverrides: Partial<ConsignmentData> = {}
): EnsDeclarationOptions => ({
    testInfo,
    url: BASE_URL,
    movementOverrides: {
        typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
    },
    consignmentOverrides: {
        isControlledGoods: false,
        headerPreviousDocuments: [
            ensHeaderPreviousDocument()
        ],
        ...consignmentOverrides,
    },
});

export const byMaritime = <T extends {
    movementOverrides?: Partial<MovementData>;
    consignmentOverrides?: Partial<ConsignmentData>;
}>(declaration: T): T => ({
    ...declaration,
    movementOverrides: {
        ...declaration.movementOverrides,
        typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.MARITIME,
        portOfArrival: MARITIME_NON_ILP_PORT.BELFAST_PORT,
    },
    consignmentOverrides: {
        ...declaration.consignmentOverrides,
        transportDocumentNumber: generateRandomTransportDocumentNumber('MARITIME'),
    },
});
