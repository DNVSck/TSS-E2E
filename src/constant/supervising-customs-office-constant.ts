/**
 * The customs office that supervises a warehoused declaration.
 *
 * The service derives it and populates the row itself - no screen asks for it - so a
 * test never enters one of these; it only checks that the value the service chose is
 * the one the journey should produce.
 *
 * An opaque code, which is what earns it a constant: "GBBEL004" says nothing on its
 * own, and the name is the only thing telling a reader which office is meant.
 */
export const SUPERVISING_CUSTOMS_OFFICE = {
    /** GBBEL004 - Belfast, the office supervising NI warehoused movements. */
    GBBEL004: 'GBBEL004',
} as const;

export type SupervisingCustomsOffice =
    (typeof SUPERVISING_CUSTOMS_OFFICE)[keyof typeof SUPERVISING_CUSTOMS_OFFICE];
