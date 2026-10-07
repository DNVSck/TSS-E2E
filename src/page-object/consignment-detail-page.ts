import { Page, Locator, expect } from '@playwright/test';
import { RENDER_TIMEOUT } from '../constant/timeout-constant';
import { ConsignmentSummaryPage } from './consignment-summary-page';
import { RecordTabs } from './components/record-tabs';
import { TFunction, TranslationKey } from '../fixtures/locale-fixture';
import {
    readFieldWhenVisible, readFieldIfPresent, readErrorSummary,
} from '../helper/element-helper';
import {
    isTraderInputRequiredStatus, isDeclarationStatus, declarationStatusPattern,
} from '../helper/declaration-status-helper';

/** The MRN is populated asynchronously after the consignment is authorised. */
const MRN_POLL_TIMEOUT = 120_000;

/**
 * How long a RESUBMISSION is given to change the status.
 *
 * Longer than a first submission's, measured 2026-08-19 on a standalone SFD: the
 * correction cleared every CDS error from the page - so the service had taken it -
 * while the status still read "Trader Input Required" when the 60-second poll gave up.
 * A declaration being re-judged is a second trip through CDS, and it is slower than the
 * first.
 */
export const RESUBMIT_STATUS_POLL_TIMEOUT = 150_000;

const STATUS_POLL_TIMEOUT = 150_000;

/**
 * The MRN reduced to its alphanumeric characters. The service injects zero-width
 * spaces (U+200B) into the rendered MRN as line-break hints, so the raw text is
 * e.g. "26X<zwsp>I…" and never compares equal on its own. The same reduction also
 * flattens the "-" placeholder an unauthorised consignment shows to ''.
 */
const alphanumericOnly = (raw: string): string => raw.replaceAll(/[^A-Za-z0-9]/g, '');

/**
 * A consignment's detail page, reached via the "View" button on a consignment
 * card. It carries the authoritative "Movement reference number" (MRN) and the
 * consignment "Status" as summary-list rows.
 */
export class ConsignmentDetailPage extends ConsignmentSummaryPage {
    private readonly localReferenceNumber: Locator;
    private readonly movementReferenceNumber: Locator;
    private readonly status: Locator;

    /**
     * The tabbed record lists below the summary. Composed rather than inherited: the
     * tabs belong to this kind of screen, not to every page in the suite.
     */
    readonly tabs: RecordTabs;

    constructor(page: Page, t: TFunction) {
        super(page, t);

        this.tabs = new RecordTabs(page);

        this.localReferenceNumber = this.summaryList.valueOf(this.t!('common.localReferenceNumber'));
        this.movementReferenceNumber = this.summaryList.valueOf(this.t!('consignmentDetail.movementReferenceNumber'));
        this.status = this.summaryList.valueOf(this.t!('common.status'));
    }

    async getConsignmentLocalReferenceNumber(): Promise<string> {
        return readFieldWhenVisible(this.localReferenceNumber, RENDER_TIMEOUT.RECORD_DETAIL);
    }

    /**
     * Read the MRN, reduced to its alphanumeric characters (see alphanumericOnly).
     * Returns '' if the row is not present yet (never throws), so a poll can decide
     * whether to wait.
     */
    async readMovementReferenceNumber(): Promise<string> {
        return alphanumericOnly(await readFieldIfPresent(this.movementReferenceNumber));
    }

    /**
     * Wait for the MRN to be populated. The value lands asynchronously and the
     * page does not auto-refresh, so reload until it appears. Non-throwing: on
     * timeout it returns the last-read value ('' if none), so the caller can
     * soft-assert the (possibly missing) MRN rather than the test aborting here.
     *
     * The status is consulted only when no MRN has appeared. A consignment CAN carry
     * both an MRN and "Trader Input Required" (observed on IMMI standalone 2026-08-12),
     * which is why the MRN is checked first and wins: this is not a claim that the two
     * are exclusive. It is the narrower one - once the service has stopped working on a
     * consignment, an MRN that has not arrived is not going to. Reading the status costs
     * one locator per attempt and saves the whole remaining timeout on the runs that
     * need their report soonest, the failing ones.
     */
    /**
     * `traderInputIsSettled` is the caller saying whether a rejection ENDS the wait.
     * True for a journey, which has nothing more to expect once the service hands the
     * declaration back. False for the authority specs, which submit deliberately
     * invalid data - there, "Trader Input Required" is the state being waited FOR, and
     * treating it as the end of the road would return an empty MRN before the service
     * had finished producing one.
     */
    async waitForMovementReferenceNumber(
        options: { traderInputIsSettled?: boolean } = {}
    ): Promise<string> {
        const { traderInputIsSettled = true } = options;
        let mrn = '';
        await expect(async () => {
            mrn = await this.readMovementReferenceNumber();
            if (mrn) {
                return;
            }

            const status = await readFieldIfPresent(this.status);
            if (traderInputIsSettled && isTraderInputRequiredStatus(status, this.t!)) {
                return;
            }

            await this.page.reload();
            expect(mrn, 'MRN populated').not.toBe('');
        })
            .toPass({ timeout: MRN_POLL_TIMEOUT, intervals: [2_000, 3_000, 5_000] })
            .catch(() => { /* soft: return whatever was last read for the caller to report */ });

        return mrn;
    }

    async getConsignmentStatus(): Promise<string> {
        return readFieldWhenVisible(this.status, RENDER_TIMEOUT.RECORD_DETAIL);
    }

    /**
     * Poll the page until the status reads the expected one, and return it.
     *
     * A reload loop rather than a wait on the locator: the status is rendered
     * server-side, so a value that changes because CDS answered only appears on the
     * next request. Nothing here sleeps - each attempt asks the real question and the
     * loop ends the moment the answer changes, so a fast environment pays no more than
     * the first round trip.
     *
     * Returns the last status it read rather than throwing on timeout, because the
     * caller is the one that knows what a wrong status means: the journey flows treat
     * it as fatal, the correction check reports it softly. Throwing here would take
     * that decision away from both, and would lose the reading itself - which is the
     * one piece of evidence a failed run needs.
     */
    async waitForStatus(
        expectedStatusKey: TranslationKey,
        timeout = STATUS_POLL_TIMEOUT
    ): Promise<string> {
        const expected = this.t!(expectedStatusKey);
        let status = '';

        await expect(async () => {
            status = await readFieldIfPresent(this.status);
            if (isDeclarationStatus(status, expected)) {
                return;
            }

            await this.page.reload();
            expect(status, 'Consignment status').toMatch(declarationStatusPattern(expected));
        })
            .toPass({ timeout, intervals: [2_000, 3_000, 5_000] })
            .catch(() => { /* the caller asserts; this only decides how long to wait */ });

        return status;
    }

    /** Soft-assert the consignment status is "Awaiting arrival"; returns the actual status. */
    async assertStatusAwaitingArrival(): Promise<string> {
        const status = await this.getConsignmentStatus();
        expect.soft(status, 'Consignment status').toBe(this.t!('status.awaitingArrival'));
        return status;
    }

    /**
     * Soft-assert the consignment carries NO Movement Reference Number. An EIDR
     * consignment is never authorised with an MRN — it lands "Trader Input
     * Required" and renders the MRN row as "-", unlike ENS/SFD/IMMI. The raw
     * display ("-") is returned for the report; the check strips to alphanumerics
     * (a real MRN has them, the "-" placeholder does not) and expects none.
     */
    async assertNoMovementReferenceNumber(): Promise<string> {
        // Ensure the summary list has painted before reading the MRN row.
        await readFieldWhenVisible(this.status, RENDER_TIMEOUT.RECORD_DETAIL);
        const raw = await readFieldIfPresent(this.movementReferenceNumber);
        expect.soft(alphanumericOnly(raw), 'EIDR MRN (should be absent)').toBe('');
        return raw;
    }

    async readValidationErrors(): Promise<string[]> {
        return readErrorSummary(this.page);
    }
}
