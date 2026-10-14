/**
 * The panel a tab renders, by the last segment of its panel id - never its label,
 * which is translated. Named because a page object addresses the same panels to click
 * their create button, so the sweep and the click cannot drift apart.
 */
export const RECORD_TAB = {
    LINKED_GOODS_RECORDS: 'linked-goods-records',
    PREVIOUS_DOCUMENTS: 'previous-documents',
    GUARANTEE_TYPE: 'guarantee-type',
    HOLDER_OF_AUTHORISATION: 'holder-of-authorisation',
    DOCUMENTS: 'documents',
    DOCUMENT_REFERENCES: 'document-references',
    ADDITIONAL_PROCEDURE_CODES: 'additional-procedure-codes',
    NATIONAL_ADDITIONAL_CODES: 'national-additional-codes',
    TARIC_ADDITIONAL_CODES: 'taric-additional-codes',
    ADDITIONAL_INFORMATION: 'additional-information',
    ADDITIONAL_FISCAL_REFERENCES_IDENTIFICATION: 'additional-fiscal-references-identification',
    TAX_BASE: 'tax-base',
    CONSIGNMENT_LIST: 'consignment-list',
    SFD_CONSIGNMENTS: 'sfd-consignments',
    IMMI_CONSIGNMENTS: 'immi-consignments',
    EXTERNAL_CONTACTS: 'external-contacts',
    EIDR_CONSIGNMENTS: 'eidr-consignments',
    GMR_DETAILS: 'gmr-details',
} as const;

/**
 * The action a tab's create button posts, by the `value` it carries.
 *
 * The same token is also the route the wizard opens on
 * (".../new-document-reference/document-code"), which is what lets a click be confirmed
 * by where it landed instead of assumed.
 */
export const NEW_RECORD_ACTION = {
    RECORD: 'new-record',
    DOCUMENT_REFERENCE: 'new-document-reference',
    ADDITIONAL_PROCEDURE_CODE: 'new-additional-procedure-code',
    NATIONAL_ADDITIONAL_CODE: 'new-national-additional-code',
    TARIC_ADDITIONAL_CODE: 'new-taric-additional-code',
    GOODS_ITEM_PREVIOUS_DOCUMENT: 'new-goods-item-previous-document',
    ADDITIONAL_INFORMATION: 'new-additional-information',
    ADDITIONAL_FISCAL_REFERENCES_IDENTIFICATION: 'new-additional-fiscal-references-identification',
    TAX_BASE: 'new-tax-base',
    /** The tab offers no create action to anyone. */
    NONE: '',
} as const;

/**
 * The record tabs a declaration overview carries, and the action each one uses to
 * create a record - measured 2026-08-14 on an ENS consignment at Trader Input
 * Required, as a company holding Full.
 *
 * Written down as data because an authority test cannot ask "is a create button
 * offered here" without knowing where one is offered at all: three tabs never carry
 * one for ANYONE (Guarantee type, Documents, Attachments), so a sweep that demanded
 * one everywhere would fail on a correct service, and one that demanded none would
 * pass on a service that had stopped rendering them. This table is the difference,
 * and it doubles as the regression net - a tab disappearing, or its action being
 * renamed, fails the sweep.
 *
 * The `name` is the panel id's last segment (`pages/consignment/ens/overview.<name>`),
 * NOT the tab's label: labels are translated and these specs run in Welsh too.
 */
export interface RecordTab {
    /** Panel name, e.g. "holder-of-authorisation". */
    name: string;
    /** The action that adds a record here, or '' where the tab offers none to anyone. */
    create: string;
    /**
     * Whether a company with only Read still gets a link on the records listed here.
     *
     * True for exactly one tab: the goods items of a consignment stay openable, because
     * reading a declaration means reading its goods too. Everywhere else a record's link
     * IS its edit route, so Read renders the record as plain text.
     */
    readableRecordLinks?: true;
    /**
     * Whether this tab offers an "edit" BUTTON per record instead of a link on the row.
     *
     * True for exactly one tab: a GMR's external contacts, measured 2026-09-02. Every
     * other table in the service makes the record's own text the edit route, so
     * "records that can be opened" counts links there and would read a correct
     * external-contacts table as offering nothing at all.
     */
    recordsEditedByButton?: true;
    primaryRecordUndeletable?: true;
}

const CONSIGNMENT_TABS: readonly RecordTab[] = [
    { name: RECORD_TAB.LINKED_GOODS_RECORDS, create: NEW_RECORD_ACTION.RECORD, readableRecordLinks: true },
    { name: RECORD_TAB.PREVIOUS_DOCUMENTS, create: NEW_RECORD_ACTION.RECORD },
    { name: RECORD_TAB.GUARANTEE_TYPE, create: NEW_RECORD_ACTION.NONE },
    { name: RECORD_TAB.HOLDER_OF_AUTHORISATION, create: NEW_RECORD_ACTION.RECORD },
    { name: RECORD_TAB.DOCUMENTS, create: NEW_RECORD_ACTION.NONE },
];

const GOODS_ITEM_TABS: readonly RecordTab[] = [
    { name: RECORD_TAB.DOCUMENT_REFERENCES, create: NEW_RECORD_ACTION.DOCUMENT_REFERENCE },
    {
        name: RECORD_TAB.ADDITIONAL_PROCEDURE_CODES,
        create: NEW_RECORD_ACTION.ADDITIONAL_PROCEDURE_CODE,
        primaryRecordUndeletable: true,
    },
    { name: RECORD_TAB.NATIONAL_ADDITIONAL_CODES, create: NEW_RECORD_ACTION.NATIONAL_ADDITIONAL_CODE },
    { name: RECORD_TAB.TARIC_ADDITIONAL_CODES, create: NEW_RECORD_ACTION.TARIC_ADDITIONAL_CODE },
    { name: RECORD_TAB.PREVIOUS_DOCUMENTS, create: NEW_RECORD_ACTION.GOODS_ITEM_PREVIOUS_DOCUMENT },
    { name: RECORD_TAB.ADDITIONAL_INFORMATION, create: NEW_RECORD_ACTION.ADDITIONAL_INFORMATION },
    {
        name: RECORD_TAB.ADDITIONAL_FISCAL_REFERENCES_IDENTIFICATION,
        create: NEW_RECORD_ACTION.ADDITIONAL_FISCAL_REFERENCES_IDENTIFICATION,
    },
    { name: RECORD_TAB.TAX_BASE, create: NEW_RECORD_ACTION.TAX_BASE },
];

/**
 * The tabs of a whole declaration, both levels at once - what an authority check sweeps.
 *
 * ONE set, not one per declaration type. Measured 2026-08-14: an ENS consignment and the
 * SFD generated from it carry the same tabs under the same names with the same create
 * actions - they are one screen rendered for two types
 * (`pages/consignment/{ens,sfd}/overview.<name>`), which is also why the standalone
 * journeys reach them with these same locators. Naming them apart would have been
 * guessing at a difference nothing has shown.
 *
 * If a type ever does differ, it earns its own table THEN, from a measurement.
 */
export const DECLARATION_TABS = {
    consignment: CONSIGNMENT_TABS,
    goodsItem: GOODS_ITEM_TABS,
};

/**
 * A generated IMMI or EIDR carries seven of those nine goods-item tabs - measured
 * 2026-08-14 on both, each reporting the same two missing.
 *
 * So the nine-tab set is not the default it looked like: it belongs to ENS and SFD, and
 * the two extra tabs are the fiscal ones. Which of the four types a tab set belongs to
 * is exactly the kind of thing the note above says must be MEASURED rather than named in
 * advance - the first guess here was that all four agreed, and two of them did not.
 *
 * Consignment tabs are unchanged on both, which is why only the goods item is named.
 */
const IMMI_EIDR_GOODS_ITEM_TABS: readonly RecordTab[] = GOODS_ITEM_TABS.filter(tab =>
    tab.name !== RECORD_TAB.ADDITIONAL_FISCAL_REFERENCES_IDENTIFICATION && tab.name !== RECORD_TAB.TAX_BASE
);

export const SUPPLEMENTARY_DECLARATION_TABS = {
    consignment: [] as readonly RecordTab[],
    goodsItem: [] as readonly RecordTab[],
};

export const IMMI_EIDR_DECLARATION_TABS = {
    consignment: CONSIGNMENT_TABS,
    goodsItem: IMMI_EIDR_GOODS_ITEM_TABS,
};

/**
 * The tabs a GMR record carries - a different set from any declaration, because a GMR
 * is a vehicle movement rather than a customs record: it LISTS the declarations
 * travelling on it, and owns only its external contacts.
 *
 * The three consignment tabs carry a "View" on records a reader may open, hence
 * readableRecordLinks - the same allowance the goods-item list gets, and for the same
 * reason: reading a movement means reading what is on it.
 *
 *
 * `goodsItem` is empty because a GMR has none, and no caller passes one.
 */
export const GMR_TABS = {
    consignment: [
        { name: RECORD_TAB.CONSIGNMENT_LIST, create: NEW_RECORD_ACTION.NONE, readableRecordLinks: true },
        { name: RECORD_TAB.SFD_CONSIGNMENTS, create: NEW_RECORD_ACTION.NONE, readableRecordLinks: true },
        { name: RECORD_TAB.IMMI_CONSIGNMENTS, create: NEW_RECORD_ACTION.NONE, readableRecordLinks: true },
        { name: RECORD_TAB.EXTERNAL_CONTACTS, create: NEW_RECORD_ACTION.RECORD, recordsEditedByButton: true },
    ] as readonly RecordTab[],
    goodsItem: [] as readonly RecordTab[],
};

/**
 * The tabs a MOVEMENT header carries - a third set again, because a movement holds
 * declarations rather than being one. Every tab is a list of records it carries: the
 * consignments of each type, and the GMRs made for it.
 *
 * Swept rather than skipped since 2026-09-02. These were the last screens still asked
 * with surfaceOnly, and the GMR is what changed the argument: its external-contacts
 * tab offers a reader New/Edit/Delete, and nothing on the record itself said so. Four
 * of the five tabs here are their own route and are absent from the DOM until opened,
 * so exactly the same thing can hide behind them - most obviously "Create GMR" being
 * offered to a company that may only read the movement.
 *
 * The first tab is in the DOM already, which is why the surface check was not blind:
 * a movement header reads "New consignment", "Upload CSV" and "Associate consignment"
 * without opening anything. It is the other four that nothing has ever asked.
 *
 * NAMES ARE UNMEASURED, taken from the tab routes. The first run prints what it found
 * - "tabs shown (panel ids, in order)" - and the GMR is the warning here: its first
 * tab is labelled "ENS Consignments" and keyed `consignment-list`.
 */
export const MOVEMENT_TABS = {
    consignment: [
        { name: RECORD_TAB.CONSIGNMENT_LIST, create: NEW_RECORD_ACTION.RECORD, readableRecordLinks: true },
        { name: RECORD_TAB.SFD_CONSIGNMENTS, create: NEW_RECORD_ACTION.NONE, readableRecordLinks: true },
        { name: RECORD_TAB.IMMI_CONSIGNMENTS, create: NEW_RECORD_ACTION.NONE, readableRecordLinks: true },
        { name: RECORD_TAB.EIDR_CONSIGNMENTS, create: NEW_RECORD_ACTION.NONE, readableRecordLinks: true },
        { name: RECORD_TAB.GMR_DETAILS, create: NEW_RECORD_ACTION.RECORD, readableRecordLinks: true },
    ] as readonly RecordTab[],
    /** A movement holds consignments, not goods, so there is no level below this. */
    goodsItem: [] as readonly RecordTab[],
};