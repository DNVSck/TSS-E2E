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
    CANCEL: 'cancel-with-confirmation',
    UPLOAD_GOODS_CSV: 'upload-csv',
    /**
     * Removing a record is named differently on every tab ("delete:<id>",
     * "delete-document-reference:0"), so only the opening is common - which is all a
     * check needs, since it asks whether a delete is offered at all, not which one.
     */
    DELETE_PREFIX: 'delete',
    /**
     * The opening of the action that OPENS a record for change ("edit:0"), for the
     * tables that offer a button where every other tab offers a link on the row.
     */
    EDIT_PREFIX: 'edit',
} as const;
