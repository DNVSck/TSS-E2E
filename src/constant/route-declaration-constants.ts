export const ROUTE_DECLARATION = {
    ROUTE: {
        GB_TO_NI: 'GB to NI',
        NI_TO_GB: 'NI to GB',
        GB_TO_NI_VIA_IRELAND: 'GB to NI via Ireland',
        NI_TO_GB_VIA_IRELAND: 'NI to GB via Ireland',
        REST_OF_WORLD_TO_GB: 'Rest of World to GB',
    },
    GOODS_MOVEMENT_PROCESS: {
        SIMPLIFIED_CUSTOMS_DECLARATION_PROCESS:
            'Simplified Customs Declaration Process',
        FULL_FRONTIER: 'Full Frontier',
        ENTRY_SUMMARY_DECLARATION_ONLY: 'Entry Summary Declaration Only'
    },
    PROCESS: {
        STANDARD_PROCESS: 'Standard Process',
        CONSIGNMENT_FIRST_PROCESS: 'Consignment First Process'
    },
    HOW_TO_START: {
        UPLOAD_CSV: 'Upload CSV',
        CREATE_MANUALLY: 'Create Manually',
        CREATE_FROM_TEMPLATE: 'Create from a Template'
    }
} as const;
