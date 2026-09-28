/**
 * Everything the company profile can offer to act on, keyed by the row it belongs to
 * and valued with the distinctive part of that row's link.
 *
 * ONE list on purpose, even though the service builds these two different ways. Most
 * rows open an edit form and name the field in a query parameter
 * (".../edit/_edit_?field=companyName"); the rest start a journey of their own
 * (".../ukims/cancel"). Either way the value below appears somewhere in the href, so
 * one lookup covers both and nobody writing a test has to know which kind a row is.
 *
 * The values stop short of the action itself, because the action is the current
 * STATE, not the row. GMR automation links to ".../gmr-automation/revoke" while the
 * permission is granted and ".../gmr-automation/authorize" while it is not, so
 * anything keyed on the verb would go red on a different environment, or the day
 * somebody revokes the permission by hand, while the rights under test had not
 * changed at all.
 *
 * A couple of keys cover more than one row for the same reason: UKIMS covers its
 * authorisation and its third-party access, GMR_AUTOMATION the permission and
 * auto-update. Splitting them would mean depending on those state-dependent verbs
 * again, which is the trade this list refuses to make.
 *
 * The three EORI rows are deliberately absent. They do not edit anything - they open
 * a "request a change" journey handled off-service - so there is no edit right to
 * assert. Leaving them out costs nothing on the side that matters: a non-holder is
 * checked against the raw hrefs, so an EORI link appearing for them still fails.
 *
 * Matched on the href rather than the visible label because labels are translated,
 * and anything keyed on them would fail the Welsh project.
 */
export const COMPANY_PROFILE_ACTION = {
    // Business details
    BUSINESS_NAME: 'companyName',
    VAT_REGISTRATION_NUMBER: 'vatRegistrationNumber',
    BUSINESS_EMAIL: 'companyEmail',
    BUSINESS_PHONE: 'companyPhone',
    ADDRESS: 'addressLine1',

    // Authorisations
    CSE_AUTHORISATION_NUMBER: 'cseAuthorisationNumber',
    SIMPLIFIED_DECLARATIONS_PROCESS_NUMBER: 'scdpSdpNumber',
    ENTRY_IN_DECLARANTS_RECORDS_NUMBER: 'scdpEidrNumber',

    // Duty deferment and guarantees
    XI_DDA_FOR_CUSTOMS: 'hasDda',
    XI_DEFERMENT_ACCOUNT_NUMBER: 'xiDefermentAccountNumber',
    GUARANTEE_REFERENCE_EXEMPTION: 'guaranteeReferenceExemption',
    XI_GUARANTEE_REFERENCE_NUMBER: 'xiGuaranteeReferenceNumber',
    XI_DPO_AUTHORISATION_NUMBER: 'xiDpoAuthorisationNumber',
    PREFERRED_METHOD_OF_PAYMENT: 'methodOfPayment',

    // Rows the service handles with a journey of its own
    UKIMS: 'ukims',
    NIRMS: 'nirms',
    TRADER_GOODS_PROFILE: 'tgp',
    GMR_AUTOMATION: 'gmr-automation',
} as const;

export type CompanyProfileActionKey = keyof typeof COMPANY_PROFILE_ACTION;

export const COMPANY_ADDRESS_FIELD = {
    LINE_1: COMPANY_PROFILE_ACTION.ADDRESS,
    CITY: 'city',
    POST_CODE: 'postCode',
    COUNTRY: 'countryCode',
} as const;

/**
 * Every row above, for the permission spec, which requires the lot.
 *
 * This makes the catalogue the single source of truth: adding a row here starts
 * requiring it, with no second list to remember. The cost is that the spec now also
 * asserts every row RENDERS - so a company without UKIMS, NIRMS or a trader goods
 * profile would fail it on data rather than on rights. If that happens, drop the key
 * from the catalogue rather than weakening the assertion; a row nobody can see is not
 * a row anybody is entitled to.
 */
export const ALL_COMPANY_PROFILE_ACTIONS =
    Object.keys(COMPANY_PROFILE_ACTION) as CompanyProfileActionKey[];
