import { TFunction, TranslationKey } from '../fixtures/locale-fixture';

/**
 * The status a submitted STANDALONE consignment settles on, which the whole family
 * shares: a pre-lodged movement has not arrived yet so it waits for the goods, an
 * arrived one is already there. Confirmed with the business 2026-08-11.
 *
 * A journey that departs from this rule states its own exception and calls this for
 * the rest - see the SFD flow, whose EIDR route is authorised outright and never waits
 * for an arrival at all.
 */
export function standaloneSubmittedStatusKey(isPreLodged: boolean): TranslationKey {
    return isPreLodged ? 'status.awaitingArrival' : 'status.arrived';
}

/**
 * Whether a consignment status is one the service will not move on from by itself.
 *
 * "Trader Input Required" means the submission was rejected back to the trader: it
 * never becomes "Authorised", "Awaiting arrival" or "Arrived", and no MRN is ever
 * assigned. Every poll that reloads waiting for one of those should therefore stop
 * the moment it sees this, instead of spending its full timeout on a page whose
 * answer has already arrived.
 *
 * Used by POLLS only - the standalone status poll and the MRN poll the ENS journeys
 * use for their auto-generated consignments - so that both agree on what "settled"
 * means and a second terminal status has one place to be added.
 *
 * Deciding whether a journey may CARRY ON is not this function's job: its callers
 * assert the status they expected, and a hard assertion says "stop" without needing to
 * name which wrong status it stopped on.
 */
export function isTraderInputRequiredConsignmentStatus(status: string, t: TFunction): boolean {
    return status === t('status.traderInputRequired');
}
