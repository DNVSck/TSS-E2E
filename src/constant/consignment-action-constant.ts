/**
 * The actions a consignment overview posts, by the `value` its button carries.
 *
 * Opaque form values, not labels - the labels are translated, these are not. Named
 * here rather than written at each call site because two very different consumers
 * need the same strings and must not drift: the page object that CLICKS the button,
 * and the authority specs that assert on which actions an account is offered.
 *
 * These are the actions of the consignment AS A WHOLE. The actions that add a record
 * live in record-tab-constant instead, one per tab - not because they are a different
 * kind of string, but because there is no useful flat list of them: which create action
 * exists is a fact about a particular tab, and three tabs have none at all. A vocabulary
 * here, a map there.
 */
export const CONSIGNMENT_ACTION = {
    SUBMIT: 'submit-consignment',
    CANCEL: 'cancel-consignment',
    /**
     * What "Cancel" is called on a declaration the service has already AUTHORISED - a
     * standalone EIDR, measured 2026-08-14. Withdrawing something already accepted asks
     * for confirmation, so it posts its own value; the plain CANCEL above belongs to a
     * consignment still waiting to be submitted or corrected.
     */
    CANCEL_WITH_CONFIRMATION: 'cancel-with-confirmation',
    /**
     * Removing a record is named differently on every tab ("delete:<id>",
     * "delete-document-reference:0"), so only the opening is common - which is all a
     * check needs, since it asks whether a delete is offered at all, not which one.
     */
    DELETE_PREFIX: 'delete',
} as const;
