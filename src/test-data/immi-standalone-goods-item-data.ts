import { GoodsData } from './goods-data';
import { documentReference } from './document-reference-data';
import { previousDocument } from './previous-document-data';
import { additionalInformation } from './additional-information-data';
import { DOCUMENT_CODE } from '../constant/document-code-constant';
import { DOCUMENT_STATUS } from '../constant/document-status-constant';
import { PREVIOUS_DOCUMENT_TYPE } from '../constant/previous-document-type-constant';
import { ADDITIONAL_PROCEDURE_CODES } from '../constant/additional-procedure-codes-constant';
import { ADDITIONAL_INFORMATION_CODE } from '../constant/additional-information-constant';
import { PROCEDURE_CODES } from '../constant/procedure-codes-constant';

/**
 * The transport document an IMMI standalone goods item must carry (N730, a road
 * consignment note).
 *
 * Exported because two callers need the SAME record: the journey below declares it,
 * and the authority spec removes it to make CDS refuse the declaration and then
 * declares it again to correct that. Written once, so the correction cannot drift
 * from the thing it is correcting.
 */
export const immiStandaloneTransportDocument = () => documentReference({
    documentCode: DOCUMENT_CODE.N730,
    documentStatus: DOCUMENT_STATUS.AE,
    documentReference: '0054047',
});

export const IMMI_STANDALONE_COMMODITY_CODE = {
    SIX_DIGIT: '630629',
    EIGHT_DIGIT: '63062900',
} as const;

/**
 * Goods item for a 4051-1EN Inward Processing journey (the primary IP coverage).
 * Both the standard and the AbD variants share this base; AbD extends it with
 * the two authorisation-by-declaration codes.
 */
export const immiStandaloneInwardProcessingGoodsItem = (
    importerIpo: string
): Partial<GoodsData> => immiStandaloneGoodsItem({
    procedureCode: PROCEDURE_CODES.FREE_CIRC_AFTER_IP_4051,
    additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.SPIMM_CATEGORY_2_EXCISE_1EN,
    commodityCode: IMMI_STANDALONE_COMMODITY_CODE.EIGHT_DIGIT,
    documentReferences: [
        documentReference({ documentCode: DOCUMENT_CODE.N730, documentStatus: DOCUMENT_STATUS.AC,  documentReference: '0054039' }),
        documentReference({ documentCode: DOCUMENT_CODE.C601, documentStatus: undefined,           documentReference: importerIpo }),
        documentReference({ documentCode: DOCUMENT_CODE.C669, documentStatus: DOCUMENT_STATUS.AC,  documentReference: '0054037' }),
        documentReference({ documentCode: DOCUMENT_CODE.C670, documentStatus: DOCUMENT_STATUS.AC,  documentReference: 'GBIWP12345' }),
    ],
    additionalInformations: [
        additionalInformation({ code: ADDITIONAL_INFORMATION_CODE.INWARD_PROCESSING_AUTHORISATION_10200, description: `IP${importerIpo}` }),
        additionalInformation({ code: ADDITIONAL_INFORMATION_CODE.GEN45, description: '12345' }),
    ],
    additionalProcedureCodes: [
        ADDITIONAL_PROCEDURE_CODES.SPIMM_SPECIAL_PROCEDURE_1SP,
        ADDITIONAL_PROCEDURE_CODES.SPIMM_SPECIAL_PROCEDURE_1NR,
    ],
});

/**
 * AbD variant of the 4051-1EN journey: same base goods item but adds the two
 * authorisation-by-declaration additional information codes (00100 + ABDOU).
 */
export const immiStandaloneInwardProcessingAbdGoodsItem = (
    importerIpo: string
): Partial<GoodsData> => {
    const base = immiStandaloneInwardProcessingGoodsItem(importerIpo);
    return {
        ...base,
        additionalInformations: [
            ...(base.additionalInformations ?? []),
            additionalInformation({ code: ADDITIONAL_INFORMATION_CODE.SIMPLIFIED_AUTHORISATION_00100, description: 'Simplified authorisation' }),
            additionalInformation({ code: ADDITIONAL_INFORMATION_CODE.AUTHORISATION_BY_DECLARATION_ABDOU, description: '' }),
        ],
    };
};

export const immiStandaloneGoodsItem = (
    overrides?: Partial<GoodsData>
): Partial<GoodsData> => ({
    additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.SPIMM_STANDARD_GOODS_1SG,

    // IMMI asks "Do you want to use a Trader Goods Profile?" on every goods item, so
    // the answer is stated here rather than left to the shared default: on this
    // journey it is a screen the test really answers, not an unused flag. A TGP test
    // overrides it to true and names a record from TGP_RECORD.
    useTGP: false,
    commodityCode: IMMI_STANDALONE_COMMODITY_CODE.SIX_DIGIT,
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
