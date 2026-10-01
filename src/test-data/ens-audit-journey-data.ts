import { TYPE_OF_MOVEMENT_OPTION_CODE } from '../constant/type-of-movement-code-constant';
import { AUTHORISATION_TYPE_CODE } from '../constant/authorisation-type-code-constant';
import { PROCEDURE_CODES } from '../constant/procedure-codes-constant';
import { ADDITIONAL_PROCEDURE_CODES } from '../constant/additional-procedure-codes-constant';
import { DOCUMENT_CODE } from '../constant/document-code-constant';
import { DOCUMENT_STATUS } from '../constant/document-status-constant';
import { IMPORTER_UKIMS } from '../../config/environment';
import { documentReference, ensSfdGoodsDocuments } from './document-reference-data';
import { previousDocument } from './previous-document-data';
import { holderOfAuthorisation } from './holder-of-authorisation-data';
import { MovementData, MOVEMENT_MAX_SCREEN_COVERAGE } from './movements-data';
import { ConsignmentData, CONSIGNMENT_MAX_SCREEN_COVERAGE, ensOnlyConsignment } from './consignment-data';
import { GoodsData } from './goods-data';

export interface EnsAuditJourney {
    /** Names the test, so a run reads as three journeys rather than three numbers. */
    name: string;
    story: string;
    consignmentOverrides: Partial<ConsignmentData>;
    goodsItemOverrides?: Partial<GoodsData>;
}

/**
 * One movement for all three. The audit is after the screens the wizard puts, and the
 * movement header puts the same ones whichever declaration follows it.
 */
export const ENS_AUDIT_MOVEMENT: Partial<MovementData> = {
    ...MOVEMENT_MAX_SCREEN_COVERAGE,
    typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
};

/**
 * The three integrated ENS journeys, which are one wizard reached three ways.
 *
 * A table rather than three specs because what separates them is the data: the turns
 * ENS-only does not take - no importer, no IMMI question, no procedure codes - read
 * here as the absence of the rows the other two carry, which is the thing worth seeing
 * and the thing three separate files hid.
 */
export const ENS_AUDIT_JOURNEYS: EnsAuditJourney[] = [
    {
        name: 'ENS-SFD',
        story: 'ENS-SFD - controlled goods, RoRo Accompanied',
        consignmentOverrides: CONSIGNMENT_MAX_SCREEN_COVERAGE,
        goodsItemOverrides: { documentReferences: ensSfdGoodsDocuments() },
    },
    {
        name: 'ENS-only',
        story: 'ENS-only - RoRo Accompanied',
        consignmentOverrides: ensOnlyConsignment(CONSIGNMENT_MAX_SCREEN_COVERAGE),
    },
    {
        name: 'ENS-IMMI',
        story: 'ENS-IMMI - RoRo Accompanied without TGP (4000-1SG)',
        consignmentOverrides: {
            ...CONSIGNMENT_MAX_SCREEN_COVERAGE,
            useIMMI: true,
            headerPreviousDocuments: [
                previousDocument({ documentReference: '4GBXI553202734852-20240501' }),
            ],
            holdersOfAuthorisation: [
                holderOfAuthorisation({
                    typeCode: AUTHORISATION_TYPE_CODE.UK_INTERNAL_MARKET_SCHEME_UKIM,
                }),
            ],
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
        },
    },
];
