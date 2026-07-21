/**
 * "Document type" on the previous-document screens — the code posted by the
 * `documentType` select. The UI shows the bare code with no description, but the
 * numeric UN/EDIFACT (1001) codes are opaque, so each is given a descriptive key.
 * The alpha codes are already read as their own mnemonic and kept as-is.
 */
export const PREVIOUS_DOCUMENT_TYPE = {
    CONTAINER_LIST_235: '235',
    DELIVERY_NOTE_270: '270',
    PACKING_LIST_271: '271',
    PROFORMA_INVOICE_325: '325',
    TEMPORARY_STORAGE_DECLARATION_337: '337',
    ENTRY_SUMMARY_DECLARATION_355: '355',
    COMMERCIAL_INVOICE_380: '380',
    HOUSE_WAYBILL_703: '703',
    MASTER_BILL_OF_LADING_704: '704',
    BILL_OF_LADING_705: '705',
    HOUSE_BILL_OF_LADING_714: '714',
    RAIL_CONSIGNMENT_NOTE_720: '720',
    ROAD_LIST_SMGS_722: '722',
    ROAD_CONSIGNMENT_NOTE_730: '730',
    AIR_WAYBILL_740: '740',
    MASTER_AIR_WAYBILL_741: '741',
    DESPATCH_NOTE_POST_PARCELS_750: '750',
    MULTIMODAL_TRANSPORT_DOCUMENT_760: '760',
    CARGO_MANIFEST_785: '785',
    BORDEREAU_787: '787',
    TRANSIT_DECLARATION_MIXED_820: '820',
    EXTERNAL_TRANSIT_T1_821: '821',
    INTERNAL_TRANSIT_T2_822: '822',
    PROOF_OF_UNION_STATUS_T2L_825: '825',
    TIR_CARNET_952: '952',
    ATA_CARNET_955: '955',

    // Alpha mnemonics — the code is its own label on the wire.
    /** Administrative Accompanying Document (excise). */
    AAD: 'AAD',
    /** Reference/date of entry in the declarant's records. */
    CLE: 'CLE',
    /** CPD Carnet (Carnet de Passage en Douane). */
    CPD: 'CPD',
    /** Customs Supervised Exports reference. */
    CSE: 'CSE',
    /** Declaration/Customs reference (DUCR). */
    DCR: 'DCR',
    /** Declaration/Customs sub-reference. */
    DCS: 'DCS',
    IF3: 'IF3',
    /** Master UCR (MUCR). */
    MCR: 'MCR',
    MNS: 'MNS',
    /** Movement Reference Number. */
    MRN: 'MRN',
    /** Simplified Declaration. */
    SDE: 'SDE',
    /** Internal transit — T2F. */
    T2F: 'T2F',
    T2G: 'T2G',
    /** T2M form (sea-fishing products). */
    T2M: 'T2M',
    /** Other / mutually defined. */
    ZZZ: 'ZZZ',
} as const;

export type PreviousDocumentTypeCode =
    (typeof PREVIOUS_DOCUMENT_TYPE)[keyof typeof PREVIOUS_DOCUMENT_TYPE];
