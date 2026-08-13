/**
 * "What is the inland mode of transport?" — the FFD standalone journey.
 *
 * The option values are single opaque digits, so the code says nothing on its own;
 * the names below are the labels the screen shows.
 */
export const INLAND_MODE_OF_TRANSPORT = {
    MARITIME_SEA_TRANSPORT: '1',
    RAIL_TRANSPORT: '2',
    ROAD_TRANSPORT: '3',
    AIR_TRANSPORT: '4',
    POSTAL_CONSIGNMENT: '5',
    ROLL_ON_ROLL_OFF: '6',
    FIXED_TRANSPORT_INSTALLATIONS: '7',
    INLAND_WATERWAY_TRANSPORT: '8',
    MODE_UNKNOWN: '9',
} as const;

export type InlandModeOfTransportCode =
    (typeof INLAND_MODE_OF_TRANSPORT)[keyof typeof INLAND_MODE_OF_TRANSPORT];
