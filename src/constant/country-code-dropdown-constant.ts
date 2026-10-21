export const COUNTRY_CODE = {
    UNITED_KINGDOM: 'GB',
    VIET_NAM: 'VN',
    UNITED_STATE_AMERICA: 'US',
    NORTHERN_IRELAND: 'XI',
    GREECE: 'GR',
    IRELAND: 'IE',
} as const;

/**
 * How each country reads on the overview and detail pages. The declaration screens
 * take the code (a `select` option value), but the summary lists print the name, so
 * an assertion against a code would never match what is on the page.
 */
export const COUNTRY_NAME: Record<string, string> = {
    [COUNTRY_CODE.UNITED_KINGDOM]: 'United Kingdom',
    [COUNTRY_CODE.VIET_NAM]: 'Vietnam',
    [COUNTRY_CODE.UNITED_STATE_AMERICA]: 'United States',
    [COUNTRY_CODE.NORTHERN_IRELAND]: 'Northern Ireland',
    [COUNTRY_CODE.GREECE]: 'Greece',
    [COUNTRY_CODE.IRELAND]: 'Ireland',
};

export type CountryCodeKey = keyof typeof COUNTRY_CODE;
export type CountryCode =
    (typeof COUNTRY_CODE)[keyof typeof COUNTRY_CODE];
