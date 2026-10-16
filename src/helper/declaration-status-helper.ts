import { expect } from '@playwright/test';
import { TFunction, TranslationKey } from '../fixtures/locale-fixture';
import { METHOD_OF_PAYMENT, MethodOfPaymentCode } from '../constant/method-of-payment-constant';
import { DECLARATION_STATUS } from '../constant/trader-api/declaration-status-constant';
import {
    InternalMarketMovementService, InternalMarketMovementSummary,
} from '../api-service/trader-api/internal-market-movement-service';

/**
 * What status a declaration is expected to settle on, and when it has stopped moving.
 *
 * One file for every kind of declaration this suite makes, because the questions are the
 * same questions whatever raised the record: where should this end up, and is it there
 * yet. They were two files - one for consignments, one for supplementary declarations -
 * until the supplementary declaration's own status poll had to import the consignment
 * one to ask whether the service had handed the submission back. That import was the
 * boundary failing; a rule that both sides need is not a rule about either.
 *
 * What differs between them is the INPUT, not the concept: a frontier declaration's
 * status follows the movement, a supplementary declaration's follows how the duty is
 * paid. Each function below says which.
 */

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
 * The statuses a submitted supplementary declaration may settle on - ANY of which
 * means the submission worked.
 *
 * Two things make this a set rather than a single value.
 *
 * The first is that an SD's status follows the METHOD OF PAYMENT, not the movement,
 * which is what separates it from every frontier declaration in this suite. A frontier
 * declaration's status says where the goods are; an SD has no goods left to follow, so
 * its status says what is owed.
 *
 * Only what has actually been measured is listed. A method with no entry throws rather
 * than falling back to a plausible one: the point of this table is to state an
 * expectation, and an invented expectation either passes for the wrong reason or fails
 * and blames the service for the test's guess.
 */
const STATUSES_BY_METHOD_OF_PAYMENT: Partial<Record<MethodOfPaymentCode, TranslationKey[]>> = {
    /**
     * The trader's own deferment account: the duty is worked out and charged to it.
     * "Tax calculation" is where it belongs and "Pending payment" no longer occurs on
     * this route, so one answer is listed rather than two - a second accepted status
     * would pass a declaration that landed on the wrong one.
     */
    [METHOD_OF_PAYMENT.TRADERS_OWN_DDA]: ['status.taxCalculation'],

    /**
     * "Card Payment Through TSS (TSS DDA)": the duty is worked out and then waits to be
     * paid. Measured on SIT 2026-08-20 and again 2026-09-18 - Draft, Processing, then
     * PaymentPending, about two minutes end to end. Nothing has ever measured
     * "Tax calculation" on this route, and it is where the OTHER route belongs, so
     * listing it here would let either route pass on the other one's answer.
     */
    [METHOD_OF_PAYMENT.CARD_PAYMENT_THROUGH_TSS]: ['status.paymentPending'],
};

export function submittedSupplementaryStatusKeys(methodOfPayment: MethodOfPaymentCode): TranslationKey[] {
    const statusKeys = STATUSES_BY_METHOD_OF_PAYMENT[methodOfPayment];

    if (!statusKeys) {
        throw new Error(
            `No status has been measured for a supplementary declaration paid by `
            + `"${methodOfPayment}", so this test has nothing to assert. Run one through `
            + `by hand, see where it settles, and add it to STATUSES_BY_METHOD_OF_PAYMENT `
            + `in declaration-status-helper.ts - or pass expectedStatusKeys to say what `
            + `this particular test expects.`
        );
    }

    return statusKeys;
}

/**
 * Whether a status is one the service will not move on from by itself.
 *
 * "Trader Input Required" means the submission was rejected back to the trader: it
 * never becomes "Authorised", "Awaiting arrival", "Arrived" or "PaymentPending", and no
 * MRN is ever assigned. Every poll that reloads waiting for one of those should
 * therefore stop the moment it sees this, instead of spending its full timeout on a
 * page whose answer has already arrived.
 *
 * Named here rather than compared inline so every poll agrees on what "settled" means -
 * the consignment detail page, the consignment overview, the MRN poll the ENS journeys
 * use, and the supplementary declaration's own - and so a second terminal status has
 * one place to be added.
 */
export function isTraderInputRequiredStatus(status: string, t: TFunction): boolean {
    return status === t('status.traderInputRequired');
}

/**
 * The error a happy-path journey fails with when its declaration is handed back to the
 * trader. Built here so every caller words it the same way.
 *
 * Thrown rather than soft-asserted: everything after an unauthorised declaration depends
 * on an authorisation that is not coming, so continuing only fills the report with
 * consequences of this one fact and buries it. Report the status BEFORE throwing -
 * Allure keeps parameters set on a failing test, but only the ones set before it
 * stopped.
 */
export function traderInputRequiredError(label: string, status: string): Error {
    return new Error(
        `${label} came back as "${status}". The service rejected this submission back ` +
        `to the trader, so it is never authorised and never assigned an MRN. Stopping ` +
        `here: the consignment overview carries the validation errors that say why.`
    );
}


const CDS_VERDICT = /^CDS\d+:/;

export function withoutCdsVerdicts(errors: string[]): string[] {
    return errors.filter(error => !CDS_VERDICT.test(error.trim()));
}

export function verifySubmittedWithoutErrors(errors: string[], what: string): void {
    expect(errors, `${what} should submit without errors - errors the page showed after submitting (expects none)`)
        .toEqual([]);
}

export function verifyRefusedWithErrors(errors: string[], what: string): void {
    expect(errors, `${what} should be refused - errors the page showed after submitting (expects at least one)`)
        .not.toEqual([]);
}

export function isDeclarationStatus(actual: string, expected: string): boolean {
    return actual.trim().toLowerCase() === expected.trim().toLowerCase();
}

const REGEXP_SPECIAL_CHARACTERS = /[.*+?^${}()|[\]\\]/g;

/** The same comparison as a matcher, for the polls that assert on a status. */
export function declarationStatusPattern(expected: string): RegExp {
    const escaped = expected.replaceAll(REGEXP_SPECIAL_CHARACTERS, String.raw`\$&`);
    return new RegExp(String.raw`^\s*${escaped}\s*$`, 'i');
}

const IMMI_SETTLES_TIMEOUT = 180_000;

/**
 * Statuses a declaration never leaves, so a wait that sees one has its answer and should
 * not spend the rest of its timeout asking again. "Trader Input Required" means the
 * submission was handed back to the trader: no MRN is ever assigned to it.
 */
const NEVER_LEFT: string[] = [DECLARATION_STATUS.TRADER_INPUT_REQUIRED];

export interface DeclarationStatusWait<T> {
    what: string;
    expected: string;
    timeout: number;
    unread: T;
    read: () => Promise<T>;
}

export async function waitForDeclarationStatus<T extends { status: string }>(
    wait: DeclarationStatusWait<T>
): Promise<T> {
    const { what, expected, timeout, read } = wait;
    let lastRead = wait.unread;

    await expect.poll(async () => {
        try {
            lastRead = await read();
        } catch {
            lastRead = { ...lastRead, status: '' };
        }

        if (NEVER_LEFT.some(status => isDeclarationStatus(lastRead.status, status)
            && !isDeclarationStatus(expected, status))) {
            throw new Error(
                `${what} settled on "${lastRead.status}", which it never leaves, `
                + `so it will not reach "${expected}". The declaration was handed back to `
                + `the trader - read it in the portal to see which answer it was refused for.`
            );
        }

        return lastRead.status;
    }, {
        timeout,
        intervals: [3_000, 5_000, 10_000],
        message: `${what} never reached "${expected}" - a blank status below `
            + `means the last read was refused, not that the declaration has no status`,
    }).toMatch(declarationStatusPattern(expected));

    return lastRead;
}

export function waitForImmiStatus(
    immiService: InternalMarketMovementService,
    immiNumber: string,
    expected: string
): Promise<InternalMarketMovementSummary> {
    return waitForDeclarationStatus({
        what: `IMMI ${immiNumber}`,
        expected,
        timeout: IMMI_SETTLES_TIMEOUT,
        unread: { reference: immiNumber, status: '', errorMessage: '', movementReferenceNumber: '' },
        read: () => immiService.readByReference(immiNumber),
    });
}
