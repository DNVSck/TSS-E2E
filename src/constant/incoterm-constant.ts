/**
 * "Delivery terms" INCOTERM — FFD standalone.
 *
 * Three-letter trade codes: standard in customs, opaque to anyone reading the test.
 */
export const INCOTERM = {
    COST_AND_FREIGHT: 'CFR',
    COST_INSURANCE_AND_FREIGHT: 'CIF',
    CARRIAGE_AND_INSURANCE_PAID_TO: 'CIP',
    CARRIAGE_PAID_TO: 'CPT',
    DELIVERED_AT_PLACE: 'DAP',
    DELIVERED_AT_TERMINAL: 'DAT',
    DELIVERED_DUTY_PAID: 'DDP',
    DELIVERED_AT_PLACE_UNLOADED: 'DPU',
    EX_WORKS: 'EXW',
    FREE_ALONGSIDE_SHIP: 'FAS',
    FREE_CARRIER: 'FCA',
    FREE_ON_BOARD: 'FOB',
    OTHER: 'XXX',
} as const;

export type IncotermCode = (typeof INCOTERM)[keyof typeof INCOTERM];
