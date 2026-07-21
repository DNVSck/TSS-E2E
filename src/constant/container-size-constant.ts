
export const CONTAINER_SIZE = {
    /** Dime coated tank */
    DIME_COATED_TANK: '1',
    /** Epoxy coated tank */
    EPOXY_COATED_TANK: '2',
    /** Pressurised tank */
    PRESSURISED_TANK: '6',
    /** Refrigerated tank */
    REFRIGERATED_TANK: '7',
    /** Stainless steel tank */
    STAINLESS_STEEL_TANK: '9',
    /** Non-working reefer container 40 feet */
    NON_WORKING_REEFER_CONTAINER_40_FEET: '10',
    /** Europallet – 80 x 120 cm */
    EUROPALLET: '12',
    /** Scandinavian pallet – 100 x 120 cm */
    SCANDINAVIAN_PALLET: '13',
    /** Trailer */
    TRAILER: '14',
    /** Non-working reefer container 20 feet */
    NON_WORKING_REEFER_CONTAINER_20_FEET: '15',
    /** Exchangeable pallet */
    EXCHANGEABLE_PALLET: '16',
    /** Semi-trailer */
    SEMI_TRAILER: '17',
    /** Tank container 20 feet */
    TANK_CONTAINER_20_FEET: '18',
    /** Tank container 30 feet */
    TANK_CONTAINER_30_FEET: '19',
    /** Tank container 40 feet */
    TANK_CONTAINER_40_FEET: '20',
    /** Container IC 20 feet, owned by InterContainer */
    CONTAINER_IC_20_FEET: '21',
    /** Container IC 30 feet, owned by InterContainer */
    CONTAINER_IC_30_FEET: '22',
    /** Container IC 40 feet, owned by InterContainer */
    CONTAINER_IC_40_FEET: '23',
    /** Refrigerated tank 20 feet */
    REFRIGERATED_TANK_20_FEET: '24',
} as const;

export type ContainerSizeCode = (typeof CONTAINER_SIZE)[keyof typeof CONTAINER_SIZE];
