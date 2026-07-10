export const ROLE_IN_MOVEMENT = {
    CARRIER: 'I am the carrier responsible for this movement',
    ON_BEHALF_OF_CARRIER: 'I am declaring on behalf of the carrier',
} as const;

export type RoleInMovementKey = keyof typeof ROLE_IN_MOVEMENT;
export type RoleInMovementValue =
    (typeof ROLE_IN_MOVEMENT)[keyof typeof ROLE_IN_MOVEMENT];
