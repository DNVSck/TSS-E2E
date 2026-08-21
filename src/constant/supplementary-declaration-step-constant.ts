/**
 * The steps of the two supplementary declaration wizards, named the way the service
 * names them in its own URLs.
 *
 * These are a contract, not decoration. A supplementary declaration arrives
 * pre-populated from the frontier declaration that raised it, and each wizard asks
 * ONLY what is still missing - so no declaration is ever asked all of these, and no
 * two need be asked the same ones. The route is therefore the only reliable statement
 * of which screen is showing, and every step below is answered if and only if the
 * wizard is on it.
 *
 * Read off the URL with currentWizardStep(), which drops the "<journey>~" prefix:
 *
 *     .../update/delivery-terms-journey~delivery-terms-unlocode?index&jump
 *                                       ^^^^^^^^^^^^^^^^^^^^^^^
 *
 * Mapped by walking both wizards on SIT, 2026-08-20.
 */
export const SUPPLEMENTARY_DECLARATION_STEP = {
    /** Reached from the overview's "Change" link, ahead of the header wizard proper. */
    METHOD_OF_PAYMENT: 'method-of-payment',

    // ---- consignment header --------------------------------------------------------
    /** RoRo accompanied: a vehicle registration. */
    VEHICLE_DETAILS: 'supplementary-vehicle-details-roro-accompanied',
    /** RoRo unaccompanied: a trailer registration. The twin of the screen above. */
    TRAILER_DETAILS: 'supplementary-vehicle-details-roro-unaccompanied',
    EXPORTER_PROFILE: 'exporter-profile',
    DELIVERY_TERMS: 'delivery-terms',
    /** Answering "yes, I know the UN/LOCODE" - one screen taking the code outright. */
    DELIVERY_UNLOCODE: 'delivery-terms-unlocode',
    /** Answering "no" instead - the country, then the place, over two screens. */
    DELIVERY_COUNTRY: 'delivery-terms-unlocode-country',
    DELIVERY_PLACE: 'delivery-terms-unlocode-place',
    INVOICE_CURRENCY: 'invoice-currency',

    // ---- goods item ----------------------------------------------------------------
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
