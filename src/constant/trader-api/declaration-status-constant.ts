/**
 * What the service itself calls each state, spelled as it puts them on the wire.
 *
 * NOT the translated labels in locales/*.json, which look identical in English and are
 * not the same thing: those follow the browser's locale, while these are what the API
 * answers whatever locale the test runs under. Comparing an API status against a
 * translated one passes in English and silently never matches in Welsh.
 *
 * Shared across declaration types - an SFD, an SD and an IMMI all report these - so it
 * is not owned by any one resource.
 */
export const DECLARATION_STATUS = {
    DRAFT: 'Draft',
    PROCESSING: 'Processing',
    AWAITING_ARRIVAL: 'Awaiting Arrival',
    ARRIVED: 'Arrived',
    TRADER_INPUT_REQUIRED: 'Trader Input Required',
} as const;
