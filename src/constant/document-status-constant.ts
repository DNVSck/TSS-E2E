/**
 * "Document status" on the document-reference screens — the two-letter code posted
 * by the `documentStatus` select. Full mirror of the select's options (39 codes;
 * the live select lists EA and JP twice, deduplicated here). The UI shows the bare
 * code with no description, and each code is its own mnemonic on the wire, so it is
 * kept as-is (dot access, e.g. DOCUMENT_STATUS.AC).
 *
 * Generated from the live select; regenerate if the document-status list changes.
 */
export const DOCUMENT_STATUS = {
    AC: 'AC',
    AE: 'AE',
    AF: 'AF',
    AG: 'AG',
    AP: 'AP',
    AS: 'AS',
    AT: 'AT',
    CC: 'CC',
    EA: 'EA',
    EE: 'EE',
    EL: 'EL',
    EP: 'EP',
    ES: 'ES',
    FP: 'FP',
    GE: 'GE',
    GP: 'GP',
    HP: 'HP',
    IA: 'IA',
    IE: 'IE',
    IP: 'IP',
    IS: 'IS',
    JA: 'JA',
    JE: 'JE',
    JP: 'JP',
    JS: 'JS',
    LE: 'LE',
    LP: 'LP',
    SP: 'SP',
    TP: 'TP',
    UA: 'UA',
    UE: 'UE',
    UP: 'UP',
    US: 'US',
    XA: 'XA',
    XB: 'XB',
    XF: 'XF',
    XU: 'XU',
    XW: 'XW',
    XX: 'XX',
} as const;

export type DocumentStatusCode =
    (typeof DOCUMENT_STATUS)[keyof typeof DOCUMENT_STATUS];
