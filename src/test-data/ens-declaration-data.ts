import { TestInfo } from '@playwright/test';
import { BASE_URL, IMPORTER_EXW, IMPORTER_UKIMS } from '../../config/environment';
import { AUTHORISATION_TYPE_CODE } from '../constant/authorisation-type-code-constant';
import { PROCEDURE_CODES } from '../constant/procedure-codes-constant';
import { ADDITIONAL_PROCEDURE_CODES } from '../constant/additional-procedure-codes-constant';
import { PREVIOUS_DOCUMENT_TYPE } from '../constant/previous-document-type-constant';
import { ConsignmentData, ensOnlyConsignment } from './consignment-data';
import { MovementData } from './movements-data';
import { EnsDeclarationOptions } from '../flows/common-flows/create-draft-ens-declaration-flow';
import { previousDocument } from './previous-document-data';
import { documentReference, ensSfdGoodsDocuments } from './document-reference-data';
import { holderOfAuthorisation } from './holder-of-authorisation-data';
import { DOCUMENT_CODE } from '../constant/document-code-constant';
import { DOCUMENT_STATUS } from '../constant/document-status-constant';
import { TYPE_OF_MOVEMENT_OPTION_CODE } from '../constant/type-of-movement-code-constant';
import { additionalInformation } from './additional-information-data';
import { ADDITIONAL_INFORMATION_CODE } from '../constant/additional-information-constant';
import { PORT_OF_ARRIVAL } from '../constant/port-of-arrival-constant';
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
            previousDocument({ documentReference: '3XI352196303000-12345' })
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
            holderOfAuthorisation({ typeCode: AUTHORISATION_TYPE_CODE.EXCISE_WAREHOUSE_EXW }),
        ],
    },
    goodsItemOverrides: {
        procedureCode: PROCEDURE_CODES.FREE_CIRC_WITH_EXCISE_WAREHOUSE_0700,
        additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.EXCISE_MOVEMENT_DUTY_SUSPENSION_F06,
        documentReferences: [
            ...ensSfdGoodsDocuments(),
            documentReference({ documentCode: DOCUMENT_CODE.C676, documentStatus: undefined, documentReference: IMPORTER_EXW }),
        ],
        additionalInformations: [
            additionalInformation({ code: ADDITIONAL_INFORMATION_CODE.ECONR, description: 'Reg No. 1234567890' }),
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
            previousDocument({ documentReference: '3XI352196303000-12345' })
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
            previousDocument({ documentReference: '4GBXI553202734852-20240501' })
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
            documentReference({
                documentCode: DOCUMENT_CODE['1UKI'],
                documentStatus: DOCUMENT_STATUS.AC,
                documentReference: IMPORTER_UKIMS,
            }),
        ],
        previousDocuments: [
            previousDocument({
                documentType: PREVIOUS_DOCUMENT_TYPE.ENTRY_SUMMARY_DECLARATION_355,
                documentReference: '24GB34F7Y1O2CX8PT4',
            }),
        ],
        supplementaryUnits: '1',
        ...goodsItemOverrides,
    },
});


const immiAuthorisation = (roleId?: string) =>
    holderOfAuthorisation({
        typeCode: AUTHORISATION_TYPE_CODE.UK_INTERNAL_MARKET_SCHEME_UKIM,
        ...(roleId ? { roleId } : {}),
    });


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
            previousDocument({ documentReference: '3XI352196303000-12345' })
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
        portOfArrival: PORT_OF_ARRIVAL.BELFAST_PORT,
    },
    consignmentOverrides: {
        ...declaration.consignmentOverrides,
        transportDocumentNumber: generateRandomTransportDocumentNumber('MARITIME'),
    },
});
