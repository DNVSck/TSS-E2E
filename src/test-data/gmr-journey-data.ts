import { EnsDeclarationOptions } from '../flows/common-flows/create-draft-ens-declaration-flow';
import { TYPE_OF_MOVEMENT_OPTION_CODE } from '../constant/type-of-movement-code-constant';
import { PROCEDURE_CODES } from '../constant/procedure-codes-constant';
import { ADDITIONAL_PROCEDURE_CODES } from '../constant/additional-procedure-codes-constant';
import { document1UKI, ensSfdGoodsDocuments } from './document-reference-data';
import { holderUKIM } from './holder-of-authorisation-data';
import { previousDocumentDCR } from './previous-document-data';
import {
    haulierAsCarrier, VEHICLE_REGISTRATION_NUMBER, TRAILER_REGISTRATION_NUMBER,
} from './movements-data';

export type GmrDeclarationOverrides = Pick<
    EnsDeclarationOptions, 'movementOverrides' | 'consignmentOverrides' | 'goodsItemOverrides'
>;

export interface GmrMovement {
    name: string;
    code: string;
    isTrailerUnaccompanied: boolean;
    registrationNumber: string;
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
        registrationNumber: VEHICLE_REGISTRATION_NUMBER,
    },
    UNACCOMPANIED: {
        name: 'Unaccompanied',
        code: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_UNACCOMPANIED,
        isTrailerUnaccompanied: true,
        registrationNumber: TRAILER_REGISTRATION_NUMBER,
    },
} as const;

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
                previousDocumentDCR(),
            ],
            holdersOfAuthorisation: [
                holderUKIM(),
            ],
        },
        goodsItemOverrides: {
            useTGP: false,
            procedureCode: PROCEDURE_CODES.FREE_CIRCULATION_4000,
            additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.SPIMM_STANDARD_GOODS_1SG,
            commodityCode: IMMI_COMMODITY_CODE,
            documentReferences: [
                document1UKI(),
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

export const withHaulierAsCarrier = (journey: GmrJourney): GmrJourney => ({
    ...journey,
    declaration: () => haulierAsCarrier(journey.declaration()),
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
