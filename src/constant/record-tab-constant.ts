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
}

export const CONSIGNMENT_TABS: readonly RecordTab[] = [
    { name: 'linked-goods-records', create: 'new-record', readableRecordLinks: true },
    { name: 'previous-documents', create: 'new-record' },
    { name: 'guarantee-type', create: '' },
    { name: 'holder-of-authorisation', create: 'new-record' },
    { name: 'documents', create: '' },
];

export const GOODS_ITEM_TABS: readonly RecordTab[] = [
    { name: 'document-references', create: 'new-document-reference' },
    { name: 'attachments', create: '' },
    { name: 'additional-procedure-codes', create: 'new-additional-procedure-code' },
    { name: 'national-additional-codes', create: 'new-national-additional-code' },
    { name: 'taric-additional-codes', create: 'new-taric-additional-code' },
    { name: 'previous-documents', create: 'new-goods-item-previous-document' },
    { name: 'additional-information', create: 'new-additional-information' },
    {
        name: 'additional-fiscal-references-identification',
        create: 'new-additional-fiscal-references-identification',
    },
    { name: 'tax-base', create: 'new-tax-base' },
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
export const IMMI_EIDR_GOODS_ITEM_TABS: readonly RecordTab[] = GOODS_ITEM_TABS.filter(tab =>
    tab.name !== 'additional-fiscal-references-identification' && tab.name !== 'tax-base'
);

export const IMMI_EIDR_DECLARATION_TABS = {
    consignment: CONSIGNMENT_TABS,
    goodsItem: IMMI_EIDR_GOODS_ITEM_TABS,
};
