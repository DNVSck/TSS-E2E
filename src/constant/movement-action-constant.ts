import { CANCELLATION_ROUTE } from './endpoints-constant';

/**
 * The actions a movement overview posts, by the `value` its button carries.
 *
 * A movement's own vocabulary, separate from CONSIGNMENT_ACTION: measured 2026-08-14, a
 * movement header offers "new-record", "associate-consignment" and "cancel-declaration",
 * and never the submit or cancel a consignment carries. The two levels are different
 * screens with different powers, so a check that reused one list on the other would be
 * asking for buttons that are not meant to be there.
 */
export const MOVEMENT_ACTION = {
    /** Add a consignment to this movement. */
    NEW_CONSIGNMENT: 'new-record',
    /** Attach a consignment that already exists. */
    ASSOCIATE_CONSIGNMENT: 'associate-consignment',
    /** Cancel the whole declaration, consignments included. */
    CANCEL_DECLARATION: CANCELLATION_ROUTE.CANCEL_SEGMENT,
} as const;
