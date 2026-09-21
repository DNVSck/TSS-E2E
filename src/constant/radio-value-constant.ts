/**
 * Radio values that are not specific to one screen.
 *
 * A value that belongs to a single question lives with that question's own codes -
 * REPRESENTATION_TYPE, TYPE_OF_MOVEMENT_OPTION_CODE, ROLE_IN_MOVEMENT and the rest.
 * What is here is shared by several screens, which is what makes a single edit
 * meaningful when the service changes what they post.
 */

/** Every GOV.UK yes/no radio in the service. */
export const BOOLEAN = {
    YES: 'yes',
    NO: 'no',
} as const;

export type BooleanKey = keyof typeof BOOLEAN;
export type BooleanValue = (typeof BOOLEAN)[keyof typeof BOOLEAN];

/**
 * "Is this a pre-lodged or arrived movement?" - the first screen of every standalone
 * wizard, and the fork the rest of the journey follows.
 */
export const PRE_LODGE_OR_ARRIVED = {
    PRE_LODGED: 'pre-lodged',
    ARRIVED: 'arrived',
} as const;

export type PreLodgeOrArrivedKey = keyof typeof PRE_LODGE_OR_ARRIVED;
export type PreLodgeOrArrivedValue =
    (typeof PRE_LODGE_OR_ARRIVED)[keyof typeof PRE_LODGE_OR_ARRIVED];
