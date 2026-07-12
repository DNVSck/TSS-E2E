import { DOCUMENT_CODE } from '../constant/document-code-constant';
import { DOCUMENT_STATUS } from '../constant/document-status-constant';

/**
 * One "document reference" record — the shape behind the goods item's
 * "Document references" tab. A tab holds a list of these, so callers pass an
 * array; the wizard is replayed once per element.
 *
 * Only the document code is mandatory. The status screen appears only for some
 * document codes; the reference, part reference, reason and file screens still
 * appear in the wizard but are left blank / skipped when the test data omits them.
 */
export interface DocumentReferenceData {
    /** "Document code" — an opaque customs document-type code (e.g. 1421). */
    documentCode: string;
    /** "Document status" — an opaque status code (e.g. AC). Optional: some
     *  document codes skip the status screen entirely. */
    documentStatus?: string;
    /** "Document reference" (Optional field). */
    documentReference?: string;
    /** "Document part reference" (Optional field). */
    documentPartReference?: string;
    /** "Document reason" (Optional field). */
    documentReason?: string;
    /** Path to a file for the "Upload your document file" screen (Optional). */
    documentFilePath?: string;
}

const defaults: DocumentReferenceData = {
    documentCode: DOCUMENT_CODE['1421'],
    documentStatus: DOCUMENT_STATUS.GE,
    documentReference: '20394857',
    documentPartReference: '',
    documentReason: '',
    documentFilePath: '',
};

export const documentReference = (overrides?: Partial<DocumentReferenceData>): DocumentReferenceData => ({
    ...defaults,
    ...overrides,
});
