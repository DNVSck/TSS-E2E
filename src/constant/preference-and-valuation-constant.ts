/**
 * "Enter preference and valuation details" - the supplementary declaration's goods
 * item screen. Both are numeric CDS codes: standard in customs, opaque to anyone
 * reading a test, which is the whole reason they are named here.
 *
 * Only the codes this suite actually declares are listed. The dropdowns carry many
 * more; adding one that no test selects would be a claim about the service that
 * nothing checks.
 */
export const PREFERENCE_CODE = {
    /**
     * "Normal third country tariff duty (including ceilings)" - no preference claimed,
     * so the standard rate applies. The plain case, and the service's own default.
     */
    NORMAL_THIRD_COUNTRY_TARIFF: '100',
} as const;

export const VALUATION_METHOD = {
    /** "Valuation Method 1 - Transaction value": the price actually paid. */
    TRANSACTION_VALUE: '1',
} as const;

export type PreferenceCode = (typeof PREFERENCE_CODE)[keyof typeof PREFERENCE_CODE];
export type ValuationMethodCode = (typeof VALUATION_METHOD)[keyof typeof VALUATION_METHOD];
