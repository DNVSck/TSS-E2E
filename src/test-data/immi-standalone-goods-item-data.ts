import { GoodsData } from './goods-data';
import { documentReference } from './document-reference-data';
import { previousDocument } from './previous-document-data';
import { DOCUMENT_CODE } from '../constant/document-code-constant';
import { DOCUMENT_STATUS } from '../constant/document-status-constant';
import { PREVIOUS_DOCUMENT_TYPE } from '../constant/previous-document-type-constant';
import { ADDITIONAL_PROCEDURE_CODES } from '../constant/additional-procedure-codes-constant';

export const immiStandaloneGoodsItem = (
    overrides?: Partial<GoodsData>
): Partial<GoodsData> => ({
    additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.SPIMM_STANDARD_GOODS_1SG,

    // IMMI asks "Do you want to use a Trader Goods Profile?" on every goods item, so
    // the answer is stated here rather than left to the shared default: on this
    // journey it is a screen the test really answers, not an unused flag. A TGP test
    // overrides it to true and names a record from TGP_RECORD.
    useTGP: false,

    documentReferences: [
        documentReference({
            documentCode: DOCUMENT_CODE.N730,
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
