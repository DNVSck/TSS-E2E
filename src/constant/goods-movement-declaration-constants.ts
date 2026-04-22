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
    }
} as const;

export const TYPE_OF_MOVEMENT_OPTION_CODE = {
  RORO_ACCOMPANIED: '3a',
  RORO_UNACCOMPANIED: '1a',
  AIR: 'air',
  MARITIME: '1',
} as const;

export type TypeOfMovementKey = keyof typeof TYPE_OF_MOVEMENT_OPTION_CODE;