
export const CONSIGNMENT_GOODS_DOMESTIC_STATUS = {
    /** NIDOM (UK domestic status goods) */
    NIDOM: 'D',
    /** NIIMP (Non-UK domestic status goods) */
    NIIMP: 'I',
} as const;

export type ConsignmentGoodsDomesticStatusCode =
    (typeof CONSIGNMENT_GOODS_DOMESTIC_STATUS)[keyof typeof CONSIGNMENT_GOODS_DOMESTIC_STATUS];
