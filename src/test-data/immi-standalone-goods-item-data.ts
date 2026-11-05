import { GoodsData } from './goods-data';
import { documentC601, documentC669, documentC670, documentN730 } from './document-reference-data';
import { previousDocument355 } from './previous-document-data';
import {
    information00100, information10200, informationABDOU, informationGEN45,
} from './additional-information-data';
import { DOCUMENT_STATUS } from '../constant/document-status-constant';
import { ADDITIONAL_PROCEDURE_CODES } from '../constant/additional-procedure-codes-constant';
import { PROCEDURE_CODES } from '../constant/procedure-codes-constant';

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
        documentN730({ documentStatus: DOCUMENT_STATUS.AC, documentReference: '0054039' }),
        documentC601({ documentReference: importerIpo }),
        documentC669(),
        documentC670(),
    ],
    additionalInformations: [
        information10200({ description: `IP${importerIpo}` }),
        informationGEN45(),
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
            information00100(),
            informationABDOU(),
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
        documentN730(),
    ],

    previousDocuments: [
        previousDocument355(),
    ],

    ...overrides,
});
