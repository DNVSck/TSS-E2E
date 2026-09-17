export const INITIAL_FORM_DECLARATION = {
    DIRECTION_OF_DECLARATION: {
        GB_TO_NI: 'gb-ni-process'
    },
    TYPE_OF_SUBMISSION: {
        ENS: 'ens-with-or-without-customs',
        STANDALONE: 'standalone-customs'
    },
    TYPE_OF_ENS_SUBMISSION: {
        CONSIGNMENT_FIRST_PROCESS: 'consignment-details-only',
        ENS_CUSTOM_OR_ENS_ONLY: 'ens-and-customs-now-or-ens-only'
    },
    STANDALONE_DECLARATION_TYPE: {
        INTERNAL_MARKET_MOVEMENT_INFORMATION: 'immi',
        SIMPLIFIED_DECLARATION: 'simplified',
        STANDARD_DECLARATION: 'standard'
    }
} as const;
