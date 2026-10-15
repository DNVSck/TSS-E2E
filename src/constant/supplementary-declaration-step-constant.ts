export const SUPPLEMENTARY_DECLARATION_STEP = {
    /** Reached from the overview's "Change" link, ahead of the header wizard proper. */
    METHOD_OF_PAYMENT: 'method-of-payment',

    // ---- consignment header --------------------------------------------------------
    /** RoRo accompanied: a vehicle registration. */
    VEHICLE_DETAILS: 'supplementary-vehicle-details-roro-accompanied',
    /** RoRo unaccompanied: a trailer registration. The twin of the screen above. */
    TRAILER_DETAILS: 'supplementary-vehicle-details-roro-unaccompanied',
    BUYER_PROFILE: 'buyer-profile',
    EXPORTER_PROFILE: 'exporter-profile',
    SELLER_PROFILE: 'seller-profile',
    DELIVERY_TERMS: 'delivery-terms',
    /** Answering "yes, I know the UN/LOCODE" - one screen taking the code outright. */
    DELIVERY_UNLOCODE: 'delivery-terms-unlocode',
    /** Answering "no" instead - the country, then the place, over two screens. */
    DELIVERY_COUNTRY: 'delivery-terms-unlocode-country',
    DELIVERY_PLACE: 'delivery-terms-unlocode-place',
    INVOICE_CURRENCY: 'invoice-currency',

    // ---- goods item ----------------------------------------------------------------
    ADDITIONAL_RISK_STATUS: 'additional-risk-status',
    COUNTRY_OF_ORIGIN: 'country-of-origin',
    /** Code and description arrive filled; the supplementary units may not. */
    COMMODITY_INFORMATION: 'commodity-information',
    /** Gross mass arrives filled; the net mass does not. */
    WEIGHT_INFORMATION: 'weight-information',
    NATURE_OF_GOODS: 'nature-of-goods-details',
    PREFERENCE_AND_VALUATION: 'preference-and-valuation',
    INVOICE_DETAILS: 'invoice-details',
    STATISTICAL_VALUE: 'statistical-value',

    /**
     * Where both wizards end. The button on it reads "Complete and submit" but carries
     * value="finish", so the shared finish button drives it.
     */
    CHECK_YOUR_ANSWERS: 'check-your-answer!',
} as const;

export type SupplementaryDeclarationStep =
    (typeof SUPPLEMENTARY_DECLARATION_STEP)[keyof typeof SUPPLEMENTARY_DECLARATION_STEP];
