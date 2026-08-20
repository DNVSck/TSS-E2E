/**
 * The three levels the permission rules are written in.
 *
 * A vocabulary, not a set of magic strings: the tables in `src/test-data` are written in
 * these words, the assertions dispatch on them, and the report prints them - so all three
 * have to mean the same thing. That is also why they live here rather than beside either
 * of those, which would have made one of them depend on the other for its words.
 */
export const ACCESS_LEVEL = {
    /** The service shows its refusal page instead of the record. */
    NONE: 'None',
    /** The record is there to read, and nothing on it can be acted on. */
    READ: 'Read',
    /** The record is there, with fields to change and actions to take. */
    FULL: 'Full',
} as const;

export type AccessLevel = (typeof ACCESS_LEVEL)[keyof typeof ACCESS_LEVEL];
