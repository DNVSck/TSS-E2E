import { GoodsData } from './goods-data';
import { documentReference } from './document-reference-data';
import { previousDocument } from './previous-document-data';
import { DOCUMENT_CODE } from '../constant/document-code-constant';
import { DOCUMENT_STATUS } from '../constant/document-status-constant';
import { PREVIOUS_DOCUMENT_TYPE } from '../constant/previous-document-type-constant';
import { ADDITIONAL_PROCEDURE_CODES } from '../constant/additional-procedure-codes-constant';

/**
 * The goods item an IMMI standalone consignment declares: the document set the
 * journey requires (a UKIMS authorisation, a C672 and an N705) plus the ENS previous
 * document it moves under.
 *
 * A Partial<GoodsData>, not a whole one - the flow layers it over the shared `goods()`
 * defaults, so this states only what IMMI standalone adds. It lives here rather than
 * in the spec because the document set is a fact about the journey: every IMMI
 * standalone test needs the same one, and a spec should state only what makes it
 * different (see the additionalProcedureCode override).
 */
export const immiStandaloneGoodsItem = (
    overrides?: Partial<GoodsData>
): Partial<GoodsData> => ({
    additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.SPIMM_STANDARD_GOODS_1SG,

    documentReferences: [
        documentReference({
            documentCode: DOCUMENT_CODE['1UKI'],
            documentStatus: DOCUMENT_STATUS.AC,
            documentReference: 'XIUKIM15045448908220240124160138',
        }),
        documentReference({
            documentCode: DOCUMENT_CODE.C672,
            documentStatus: DOCUMENT_STATUS.AC,
            documentReference: 'XI896458895023',
        }),
        documentReference({
            documentCode: DOCUMENT_CODE.N705,
            documentStatus: DOCUMENT_STATUS.AE,
            documentReference: '0054047',
        }),
    ],

    previousDocuments: [
        previousDocument({
            documentType: PREVIOUS_DOCUMENT_TYPE.ENTRY_SUMMARY_DECLARATION_355,
            documentReference: '24GB34F7Y1O2CX8PT4',
        }),
    ],

    ...overrides,
});
