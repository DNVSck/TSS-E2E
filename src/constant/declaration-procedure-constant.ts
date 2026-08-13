/**
 * "Which type of declaration do you intend to make?" — FFD standalone.
 *
 * The option values read as what they are, so this is NOT the usual opaque-code
 * constant. It exists because the answer picks one of two different tails of the
 * wizard, and the flow branches on it: customs warehousing goes down the app's
 * "h2-journey" (warehouse type and identifier, no exporter or seller), everything
 * else down its "h1-journey" (exporter and seller, no warehouse). A typo in a bare
 * literal would silently take the wrong branch and fail several screens later.
 */
export const DECLARATION_PROCEDURE = {
    FREE_CIRCULATION: 'free-circulation',
    CUSTOMS_WAREHOUSING: 'customs-warehousing',
    INWARD_PROCESSING: 'inward-processing',
    TEMPORARY_ADMISSION: 'temporary-admission',
} as const;

export type DeclarationProcedureCode =
    (typeof DECLARATION_PROCEDURE)[keyof typeof DECLARATION_PROCEDURE];
