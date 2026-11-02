/**
 * "Which type of declaration do you intend to make?" — FFD standalone.
 *
 * The option values read as what they are, so this is NOT the usual opaque-code
 * constant. It exists because the answer picks one of two different tails of the
 * wizard, and the flow branches on it.
 *
 * Keys combine the CDS H-type code with the human-readable label so that test
 * data states both without having to look one up from the other. Screen order
 * in the UI: H2, H4, H1, H3.
 */
export const DECLARATION_PROCEDURE = {
    H1_FREE_CIRCULATION: 'free-circulation',
    H2_CUSTOMS_WAREHOUSING: 'customs-warehousing',
    H3_TEMPORARY_ADMISSION: 'temporary-admission',
    H4_INWARD_PROCESSING: 'inward-processing',
} as const;

export type DeclarationProcedureCode =
    (typeof DECLARATION_PROCEDURE)[keyof typeof DECLARATION_PROCEDURE];
