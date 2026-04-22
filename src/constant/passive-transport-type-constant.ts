export const PASSIVE_TRANSPORT_TYPE = {
    TRUCK: 'truck',
    TRUCK_REFRIGERATED: 'truck-refrigerated',
    TRUCK_TANKER: 'truck-tanker',
    LORRY_ARTICULATED: 'lorry-articulated',
    VAN: 'van',
    VAN_REFRIGERATED: 'van-refrigerated',
    TRAILER: 'trailer',
    BUS: 'bus',
    CAR: 'car',
    MOTORCYCLE: 'motorcycle',
    VEHICLE_AGRICULTURAL: 'vehicle-agricultural',
    VEHICLE_OTHER: 'vehicle-other'
} as const;

export type PassiveTransportTypeKey = keyof typeof PASSIVE_TRANSPORT_TYPE;
export type PassiveTransportTypeCode =
    (typeof PASSIVE_TRANSPORT_TYPE)[keyof typeof PASSIVE_TRANSPORT_TYPE];
