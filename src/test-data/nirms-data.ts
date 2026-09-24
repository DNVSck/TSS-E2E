import { DOCUMENT_CODE } from '../constant/document-code-constant';
import { DOCUMENT_STATUS } from '../constant/document-status-constant';
import { DocumentReferenceData, documentReference } from './document-reference-data';
import { GoodsData } from './goods-data';

/**
 * A commodity that moves under NIRMS, and the document its tariff requires.
 *
 * The two travel together because the screen is built from the tariff: change the
 * commodity and the document on offer changes with it, so a test that stated them
 * apart could name one the screen never puts.
 */
export interface NirmsCommodity {
    commodityCode: string;
    goodsDescription: string;
    documentCode: string;
    supportingDocuments: readonly DocumentReferenceData[];
}

export const NIRMS_COMMODITY = {

    LIVE_CARP: {
        commodityCode: '0301930000',
        goodsDescription: 'Live carp',
        documentCode: DOCUMENT_CODE.N853,
        supportingDocuments: [
            documentReference({
                documentCode: DOCUMENT_CODE.C644,
                documentStatus: DOCUMENT_STATUS.AE,
                documentReference: '0054039',
            }),
        ],
    },
    
    LIVE_TROUT: {
        commodityCode: '0301998510',
        goodsDescription: 'Live trout',
        documentCode: DOCUMENT_CODE.C673,
        supportingDocuments: [
            documentReference({
                documentCode: DOCUMENT_CODE.C644,
                documentStatus: DOCUMENT_STATUS.AE,
                documentReference: '0054039',
            }),
             documentReference({
                documentCode: DOCUMENT_CODE.C640,
                documentStatus: DOCUMENT_STATUS.AE,
                documentReference: 'GBCHD12345',
            }),
            documentReference({
                documentCode: DOCUMENT_CODE.Y942,
                documentStatus: undefined,
                documentReason: 'Reg 2016/1141 exempt',
                documentReference: undefined,
            }),
        ],
    },

    FRESH_CARROTS: {
        commodityCode: '0706100010',
        goodsDescription: 'Fresh carrots',
        documentCode: DOCUMENT_CODE.C085,
        supportingDocuments: [
            documentReference({
                documentCode: DOCUMENT_CODE.C644,
                documentStatus: DOCUMENT_STATUS.AE,
                documentReference: '0054039',
            }),
        ],
    },
} as const satisfies Record<string, NirmsCommodity>;

export const nirmsGoodsItem = (commodity: NirmsCommodity): Partial<GoodsData> => ({
    useNirms: true,
    commodityCode: commodity.commodityCode,
    goodsDescription: commodity.goodsDescription,
    nirmsDocumentCodes: [commodity.documentCode],
});

export interface NirmsDocumentCitation {
    code: string;
    reference: string;
}

const chedNirmsReference = (year: number): string => `GBCHD${year}.NIRMS`;

const NIRMS_DOCUMENT_REFERENCE: Record<string, (year: number) => string> = {
    [DOCUMENT_CODE.N853]: chedNirmsReference,
    [DOCUMENT_CODE.C085]: chedNirmsReference,
    [DOCUMENT_CODE.C673]: () => 'GBIUUNIRMS',
};

export function nirmsDocumentCitations(codes: string[], year: number): NirmsDocumentCitation[] {
    return codes.map(code => {
        const build = NIRMS_DOCUMENT_REFERENCE[code];

        // Refused rather than skipped. A code with no row here has no expectation, and
        // returning nothing for it would leave the journey verifying NOTHING and passing.
        if (!build) {
            throw new Error(
                `No NIRMS document reference is recorded for "${code}", so what the generated `
                + `declaration should cite is unknown. Read it off the goods item and add a row `
                + `to NIRMS_DOCUMENT_REFERENCE.`
            );
        }

        return { code, reference: build(year) };
    });
}
