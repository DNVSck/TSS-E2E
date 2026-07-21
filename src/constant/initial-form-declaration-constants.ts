export const INITIAL_FORM_DECLARATION = {
    DIRECTION_OF_DECLARATION: {
        GB_TO_NI: 'Great Britain to Northern Ireland'
    },
    TYPE_OF_SUBMISSION: {
        ENS: 'ENS (with or without customs)',
        STANDALONE: 'Standalone customs'
    },
    TYPE_OF_ENS_SUBMISSION: {
        ENS_CUSTOM_OR_ENS_ONLY: 'Submit an ENS and Customs Declaration now or an ENS only'
    },
    STANDALONE_DECLARATION_TYPE: {
        INTERNAL_MARKET_MOVEMENT_INFORMATION: 'Internal Market Movement Information',
        SIMPLIFIED_DECLARATION: 'Simplified Declaration',
        STANDARD_DECLARATION: 'Standard Declaration'
    }
} as const;
