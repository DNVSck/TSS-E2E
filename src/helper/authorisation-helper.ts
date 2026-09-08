/**
 * The type prefix an authorisation number opens with: two letters of country, then
 * three of authorisation type - "XIDPO", "GBDPO".
 *
 * Matched rather than typed out so a GB-issued authorisation reads the same as an
 * XI-issued one; the country is not part of what makes this a deferment account.
 */
const DEFERMENT_AUTHORISATION_PREFIX = /^[A-Z]{2}DPO/;

/**
 * The deferment account number inside a Deferment of Payment authorisation.
 *
 *     XIDPO1229035  ->  1229035
 *     ^^^^^ the authorisation's country and type
 *
 * A supplementary declaration has to state BOTH forms, and CDS refuses it with only
 * one. The goods item cites the authorisation as the C506 document, and the account
 * number out of it as the [1207] document; supply the C506 alone and the declaration
 * comes back "CDS12070: Relation error: The value supplied in Data Element 1 mandates
 * the completion of Data Element 2 - affects: Goods Item 1". Measured on SIT,
 * 2026-08-21.
 *
 * Derived rather than held as a second environment variable, because the two are not
 * independent facts: one IS the other with its prefix removed, and storing them apart
 * invites an account number that belongs to no authorisation. The same reasoning as
 * locationOfGoodsOfOther, which drops the "XI" off an authorisation for its own screen.
 */
export function defermentAccountNumber(defermentAuthorisation: string): string {
    return defermentAuthorisation.replace(DEFERMENT_AUTHORISATION_PREFIX, '');
}

/** The country an authorisation opens with - "XI", "GB". */
const AUTHORISATION_COUNTRY = /^[A-Z]{2}/;

/**
 * An Inward Processing authorisation as the [10200] additional information states it:
 * the number without its country.
 *
 *     XIIPO89645889502320231019133850  ->  IPO89645889502320231019133850
 *
 * The same authorisation the goods item cites as the C601 document, which keeps its
 * country - so the two forms sit side by side on one declaration and only one of them
 * is stripped. Derived rather than held as a second environment variable, for the
 * reason on defermentAccountNumber: one IS the other with its prefix removed, and
 * storing them apart invites a number that belongs to no authorisation.
 */
export function inwardProcessingAuthorisationNumber(ipoAuthorisation: string): string {
    return ipoAuthorisation.replace(AUTHORISATION_COUNTRY, '');
}
