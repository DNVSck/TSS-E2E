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

const defaults: PreviousDocumentData = {
    documentCategory: PREVIOUS_DOCUMENT_CATEGORY.Z,
    documentType: PREVIOUS_DOCUMENT_TYPE.DCR,
    documentReference: '4GBXI553202734852-20240501',
    goodsItemIdentifier: '',
};

export const previousDocument = (overrides?: Partial<PreviousDocumentData>): PreviousDocumentData => ({
    ...defaults,
    ...overrides,
});
