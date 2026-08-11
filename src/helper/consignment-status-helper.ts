import { TFunction } from '../fixtures/locale-fixture';

/**
 * Whether a consignment status is one the service will not move on from by itself.
 *
 * "Trader Input Required" means the submission was rejected back to the trader: it
 * never becomes "Authorised", "Awaiting arrival" or "Arrived", and no MRN is ever
 * assigned. Every poll that reloads waiting for one of those should therefore stop
 * the moment it sees this, instead of spending its full timeout on a page whose
 * answer has already arrived.
 *
 * Named here rather than compared inline so both polls - the standalone status poll
 * and the MRN poll the ENS journeys use for their auto-generated SFD/IMMI/EIDR
 * consignments - agree on what "settled" means, and so a second terminal status has
 * one place to be added.
 */
export function isTraderInputRequiredConsignmentStatus(status: string, t: TFunction): boolean {
    return status === t('status.traderInputRequired');
}

/**
 * The error a happy-path journey fails with when its consignment is handed back to
 * the trader. Built here so both callers word it the same way.
 *
 * Thrown rather than soft-asserted: everything after an unauthorised consignment
 * depends on an authorisation that is not coming, so continuing only fills the report
 * with consequences of this one fact and buries it. Report the status BEFORE throwing
 * - Allure keeps parameters set on a failing test, but only the ones set before it
 * stopped.
 */
export function traderInputRequiredError(label: string, status: string): Error {
    return new Error(
        `${label} came back as "${status}". The service rejected this submission back ` +
        `to the trader, so it is never authorised and never assigned an MRN. Stopping ` +
        `here: the consignment overview carries the validation errors that say why.`
    );
}
