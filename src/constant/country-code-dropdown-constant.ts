export const COUNTRY_CODE = {
    UNITED_KINGDOM: 'GB',
    VIET_NAM: 'VN',
    UNITED_STATE_AMERICA: 'US',
    NORTHERN_IRELAND: 'XI'
} as const;

export type CountryCodeKey = keyof typeof COUNTRY_CODE;
export type CountryCode =
    (typeof COUNTRY_CODE)[keyof typeof COUNTRY_CODE];
