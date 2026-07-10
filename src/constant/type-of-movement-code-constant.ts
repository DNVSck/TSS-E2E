export const TYPE_OF_MOVEMENT_OPTION_CODE = {
    RORO_ACCOMPANIED: '3a',
    RORO_UNACCOMPANIED: '1a',
    AIR: 'air',
    MARITIME: '1',
} as const;

export type TypeOfMovementKey = keyof typeof TYPE_OF_MOVEMENT_OPTION_CODE;
