/**
 * "Document category" on the previous-document screens — the single-letter code
 * (X / Y / Z) posted by the radio group. Opaque on the wire, so it is driven by
 * the code, never the translated label.
 */
export const PREVIOUS_DOCUMENT_CATEGORY = {
    X: 'X',
    Y: 'Y',
    Z: 'Z',
} as const;

export type PreviousDocumentCategoryCode =
    (typeof PREVIOUS_DOCUMENT_CATEGORY)[keyof typeof PREVIOUS_DOCUMENT_CATEGORY];
