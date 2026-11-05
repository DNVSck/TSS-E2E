import { PREVIOUS_DOCUMENT_CATEGORY } from '../constant/previous-document-category-constant';
import { PREVIOUS_DOCUMENT_TYPE } from '../constant/previous-document-type-constant';

/**
 * One "previous document" record — the shape behind the consignment's
 * "Header previous documents" tab and the goods item's "Previous documents" tab,
 * which ask for the same four fields. A tab holds a list of these, so callers
 * pass an array; the wizard is replayed once per element.
 */
export interface PreviousDocumentData {
    /** "Document category" — X / Y / Z. See PREVIOUS_DOCUMENT_CATEGORY. */
    documentCategory: string;
    /** "Document type" — an opaque customs document-type code. See PREVIOUS_DOCUMENT_TYPE. */
    documentType: string;
    /** "Document reference" — the previous document's identification number. */
    documentReference: string;
    /** "Goods item identifier" (Optional field). */
    goodsItemIdentifier?: string;
}

type PreviousDocumentOverrides = Partial<Omit<PreviousDocumentData, 'documentType'>>;

const citedPreviousDocument = (fixed: PreviousDocumentData) =>
    (overrides?: PreviousDocumentOverrides): PreviousDocumentData => ({ goodsItemIdentifier: '', ...fixed, ...overrides });

export const previousDocument337 = citedPreviousDocument({
    documentCategory: PREVIOUS_DOCUMENT_CATEGORY.Z,
    documentType: PREVIOUS_DOCUMENT_TYPE.TEMPORARY_STORAGE_DECLARATION_337,
    documentReference: '22GBTSD123456789U3-1',
});

export const previousDocument355 = citedPreviousDocument({
    documentCategory: PREVIOUS_DOCUMENT_CATEGORY.Z,
    documentType: PREVIOUS_DOCUMENT_TYPE.ENTRY_SUMMARY_DECLARATION_355,
    documentReference: '24GB34F7Y1O2CX8PT4',
});

export const previousDocumentDCR = citedPreviousDocument({
    documentCategory: PREVIOUS_DOCUMENT_CATEGORY.Z,
    documentType: PREVIOUS_DOCUMENT_TYPE.DCR,
    documentReference: '4GBXI553202734852-20240501',
});

export const previousDocumentDCS = citedPreviousDocument({
    documentCategory: PREVIOUS_DOCUMENT_CATEGORY.Z,
    documentType: PREVIOUS_DOCUMENT_TYPE.DCS,
    documentReference: 'DEF',
});

export const previousDocumentMRN = citedPreviousDocument({
    documentCategory: PREVIOUS_DOCUMENT_CATEGORY.Z,
    documentType: PREVIOUS_DOCUMENT_TYPE.MRN,
    documentReference: '21GBCDS123456789B1',
});

export const ensHeaderPreviousDocument = (): PreviousDocumentData => previousDocumentDCR({
    documentReference: '3XI352196303000-12345',
});
