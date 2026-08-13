/**
 * Building a "Location of Goods (if not in list above)" value from an authorisation.
 *
 * A helper, not a constant and not a generator: nothing here is random or clock-based
 * the way data-generate-helper is - these DERIVE a value from an authorisation number
 * the environment already holds, the same shape as procedure-code-helper.
 */

/**
 * The country and qualifier that open the value. Everything after it identifies the
 * premises, and comes from the trader's own authorisation number.
 */
const LOCATION_OF_GOODS_OF_OTHER_PREFIX = 'GBBY';

/**
 * Inward Processing premises: the prefix plus "IP", then the IPO authorisation
 * EXACTLY as issued - its "XI" is kept.
 *
 *     inwardProcessingLocationOfGoods(IMPORTER_IPO)
 *     // GBBYIPXIIPO89645889502320231019133850
 *
 * Confirmed with Trung 2026-08-12. It reads as an inconsistency beside the builder
 * below, which drops the same "XI" - so do not "tidy" the two into one rule. They are
 * different rules, and the resemblance between GBBYIP + XIIPO… and GBBY + IPO… is
 * exactly the trap: both produce something that starts "GBBYIP".
 */
export function inwardProcessingLocationOfGoods(ipoAuthorisation: string): string {
    return `${LOCATION_OF_GOODS_OF_OTHER_PREFIX}IP${ipoAuthorisation}`;
}

/**
 * Customs warehouse (CWP) and UKIMS premises: the prefix, then the authorisation with
 * the "XI" country it carries removed - the location has already stated its country,
 * so repeating it would be wrong.
 *
 *     locationOfGoodsOfOther(IMPORTER_CWP)   // GBBYCWP89645889502320231019133850
 *     locationOfGoodsOfOther(IMPORTER_UKIMS) // GBBYUKIM89645889502320240124160138
 *
 * One builder for both, because the authorisation type is already inside the number
 * ("XICWP…", "XIUKIM…") - there is nothing per-type left for a caller to supply.
 */
export function locationOfGoodsOfOther(authorisationNumber: string): string {
    return `${LOCATION_OF_GOODS_OF_OTHER_PREFIX}${authorisationNumber.replace(/^XI/, '')}`;
}
