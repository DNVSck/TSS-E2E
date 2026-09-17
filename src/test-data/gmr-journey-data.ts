import { EnsDeclarationOptions } from '../flows/common-flows/create-draft-ens-declaration-flow';
import { TYPE_OF_MOVEMENT_OPTION_CODE } from '../constant/type-of-movement-code-constant';
import { AUTHORISATION_TYPE_CODE } from '../constant/authorisation-type-code-constant';
import { PROCEDURE_CODES } from '../constant/procedure-codes-constant';
import { ADDITIONAL_PROCEDURE_CODES } from '../constant/additional-procedure-codes-constant';
import { DOCUMENT_CODE } from '../constant/document-code-constant';
import { DOCUMENT_STATUS } from '../constant/document-status-constant';
import { IMPORTER_UKIMS } from '../../config/environment';
import { documentReference, ensSfdGoodsDocuments } from './document-reference-data';
import { holderOfAuthorisation } from './holder-of-authorisation-data';
import { previousDocument } from './previous-document-data';

export type GmrDeclarationOverrides = Pick<
    EnsDeclarationOptions, 'movementOverrides' | 'consignmentOverrides' | 'goodsItemOverrides'
>;

export interface GmrMovement {
    name: string;
    code: string;
    isTrailerUnaccompanied: boolean;
}

export type GmrDeclarationType = 'SFD' | 'IMMI' | 'EIDR';

export interface GmrJourney {
    declarationType: GmrDeclarationType;
    movement: string;
    authorisesThroughIcs2: boolean;
    declaration(): GmrDeclarationOverrides;
}

export const GMR_MOVEMENT = {
    ACCOMPANIED: {
        name: 'Accompanied',
        code: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
        isTrailerUnaccompanied: false,
    },
    UNACCOMPANIED: {
        name: 'Unaccompanied',
        code: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_UNACCOMPANIED,
        isTrailerUnaccompanied: true,
    },
} as const;

const IMMI_PREVIOUS_DOCUMENT_REFERENCE = '4GBXI553202734852-20240501';
const IMMI_COMMODITY_CODE = '630629';

function sfdDeclaration(typeOfMovement: string): GmrDeclarationOverrides {
    return {
        movementOverrides: { typeOfMovement },
        goodsItemOverrides: {
            documentReferences: ensSfdGoodsDocuments(),
        },
    };
}

function immiDeclaration(typeOfMovement: string): GmrDeclarationOverrides {
    return {
        movementOverrides: { typeOfMovement },
        consignmentOverrides: {
            useIMMI: true,
            headerPreviousDocuments: [
                previousDocument({ documentReference: IMMI_PREVIOUS_DOCUMENT_REFERENCE }),
            ],
            holdersOfAuthorisation: [
                holderOfAuthorisation({ typeCode: AUTHORISATION_TYPE_CODE.UK_INTERNAL_MARKET_SCHEME_UKIM }),
            ],
        },
        goodsItemOverrides: {
            useTGP: false,
            procedureCode: PROCEDURE_CODES.FREE_CIRCULATION_4000,
            additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.SPIMM_STANDARD_GOODS_1SG,
            commodityCode: IMMI_COMMODITY_CODE,
            documentReferences: [
                documentReference({
                    documentCode: DOCUMENT_CODE['1UKI'],
                    documentStatus: DOCUMENT_STATUS.AC,
                    documentReference: IMPORTER_UKIMS,
                }),
            ],
        },
    };
}

function eidrDeclaration(typeOfMovement: string): GmrDeclarationOverrides {
    return {
        movementOverrides: { typeOfMovement },
        consignmentOverrides: { isControlledGoods: false },
    };
}

export const sfdGmrJourney = (movement: GmrMovement): GmrJourney => ({
    declarationType: 'SFD',
    movement: movement.name,
    authorisesThroughIcs2: false,
    declaration: () => sfdDeclaration(movement.code),
});

export const immiGmrJourney = (movement: GmrMovement): GmrJourney => ({
    declarationType: 'IMMI',
    movement: movement.name,
    authorisesThroughIcs2: false,
    declaration: () => immiDeclaration(movement.code),
});

export const eidrGmrJourney = (movement: GmrMovement): GmrJourney => ({
    declarationType: 'EIDR',
    movement: movement.name,
    authorisesThroughIcs2: true,
    declaration: () => eidrDeclaration(movement.code),
});
