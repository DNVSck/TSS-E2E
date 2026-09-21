export const ROLE_IN_MOVEMENT = {
    CARRIER: 'carrier',
    HAULIER: 'haulier',
    CARRIER_AND_HAULIER: 'carrier-and-haulier',
    NEITHER: 'neither',
} as const;

export type RoleInMovementKey = keyof typeof ROLE_IN_MOVEMENT;
export type RoleInMovementValue =
    (typeof ROLE_IN_MOVEMENT)[keyof typeof ROLE_IN_MOVEMENT];
