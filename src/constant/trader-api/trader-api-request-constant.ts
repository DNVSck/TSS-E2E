import { TYPE_OF_MOVEMENT_OPTION_CODE } from '../type-of-movement-code-constant';

export const OP_TYPE = {
    CREATE: 'create',
    UPDATE: 'update',
    SUBMIT: 'submit',
    RECLASSIFY: 'reclassify',
} as const;

export const ACT_AS_PARAM = 'actAs';

export const TRADER_API_YES = 'yes';
export const TRADER_API_NO = 'no';

export const INTERNAL_MARKET = {
    CONFIRMED: 'confirmed',
} as const;

export const IMMI_MODE_OF_TRANSPORT: Readonly<Record<string, string>> = {
    [TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED]: '6',
};

export const CONTAINER_INDICATOR = {
    CONTAINERISED: '1',
    NOT_CONTAINERISED: '0',
} as const;

export const CONTROLLED_GOODS_TYPE = {
    EXCISE_GOODS: 'excise_goods',
} as const;

export const IMMI_DECLARATION_CATEGORY = {
    PRE_LODGED: 'IMD',
} as const;