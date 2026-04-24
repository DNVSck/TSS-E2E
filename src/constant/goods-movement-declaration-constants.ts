export const NEW_GOODS_MOVEMENT_DECLARATION = {
    TYPE_OF_MOVEMENT: {
        RORO_ACCOMPANIED: 'RoRo Accompanied [ICS2]',
        RORO_UNACCOMPANIED: 'RoRo Unaccompanied [ICS2]',
        AIR: 'Air [ICS2]',
        MARITIME: 'Maritime (LoLo / bulk)'
    },
    ROLE_IN_THIS_MOVEMENT: {
        CARRIER: 'I am the carrier responsible for this movement',
        ON_BEHALF_OF_CARRIER: 'I am declaring on behalf of the carrier'
    },
    SEPARATE_HAULIER_THIS_MOVEMENT: {
        CARRIER_IS_HAULIER: 'The carrier is also the haulier',
        SEPARATE_HAULIER: 'There is a separate haulier for this movement'
    },
    TYPE_OF_PASSIVE_TRANSPORT: {
        TRUCK: 'truck',
        TRUCK_REFIGERATED: "truck-refrigerated",
        TRUCK_TANKER: "truck-tanker",
        ARTICULATED_LORRY: "lorry-articulated",
        VAN: "van",
        VAN_REFIGERATED: "van-refrigerated",
        TRAILER: "trailer",
        BUS: "bus",
        CAR: "car",
        MOTORCYCLE: "motorcycle",
        AGRICULTURAL_VEHICLE: "agricultural-vehicle",
        OTHER: "vehicle-other"
    },
    TRANSPORT_CHARGES: {
        PAYMENT_IN_CASH: 'Payment in Cash',
        PAYMENT_BY_CREDIT_CARD: 'Payment by Credit Card',
        PAYMENT_BY_CHEQUE: 'Payment by Cheque',
        OTHER: 'Other',
        ELECTRONIC_CREDIT_TRANSFER: 'Electronic Credit Transfer',
        ACCOUNT_HOLDER_WITH_CARRIER: 'Account Holder with Carrier',
        NOT_PRE_PAID: 'Not Pre-Paid'
    }
} as const;

export const TYPE_OF_MOVEMENT_OPTION_CODE = {
    RORO_ACCOMPANIED: '3a',
    RORO_UNACCOMPANIED: '1a',
    AIR: 'air',
    MARITIME: '1',
} as const;

export const TRANSPORT_CHARGES_OPTION_CODE = {
    PAYMENT_IN_CASH: 'A',
    PAYMENT_BY_CREDIT_CARD: 'B',
    PAYMENT_BY_CHEQUE: 'C',
    OTHER: 'D',
    ELECTRONIC_CREDIT_TRANSFER: 'E',
    ACCOUNT_HOLDER_WITH_CARRIER: 'F',
    NOT_PRE_PAID: 'G'
} as const;

export type TypeOfMovementKey = keyof typeof TYPE_OF_MOVEMENT_OPTION_CODE;
export type TransportChargesKey = keyof typeof TRANSPORT_CHARGES_OPTION_CODE;