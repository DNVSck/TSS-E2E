import { Page, Locator, expect } from '@playwright/test';
import { ConsignmentSummaryPage } from './consignment-summary-page';
import { RecordTabs } from './components/record-tabs';
import { TFunction, TranslationKey } from '../fixtures/locale-fixture';
import { summaryListValue, readFieldWhenVisible, readFieldIfPresent } from '../helper/element-helper';
import { isTraderInputRequiredConsignmentStatus } from '../helper/consignment-status-helper';

/** This heavy detail page can be slow to paint under parallel load. */
const DETAIL_READ_TIMEOUT = 15_000;
/** The MRN is populated asynchronously after the consignment is authorised. */
const MRN_POLL_TIMEOUT = 60_000;

const STATUS_POLL_TIMEOUT = 60_000;

/**
 * How long a RESUBMISSION is given to change the status.
 *
 * Longer than a first submission's, measured 2026-08-19 on a standalone SFD: the
 * correction cleared every CDS error from the page - so the service had taken it - while
 * the status still read "Trader Input Required" when the 60-second poll gave up. A
 * declaration being re-judged is a second trip through CDS, and it is slower than the
 * first.
 */
export const RESUBMIT_STATUS_POLL_TIMEOUT = 150_000;

/**
 * The MRN reduced to its alphanumeric characters. The service injects zero-width
 * spaces (U+200B) into the rendered MRN as line-break hints, so the raw text is
 * e.g. "26X<zwsp>I…" and never compares equal on its own. The same reduction also
 * flattens the "-" placeholder an unauthorised consignment shows to ''.
 */
export const alphanumericOnly = (raw: string): string => raw.replaceAll(/[^A-Za-z0-9]/g, '');

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

        this.localReferenceNumber = summaryListValue(page, this.t!('common.localReferenceNumber'));
        this.movementReferenceNumber = summaryListValue(page, this.t!('consignmentDetail.movementReferenceNumber'));
        this.status = summaryListValue(page, this.t!('common.status'));
    }

    async getConsignmentLocalReferenceNumber(): Promise<string> {
        return readFieldWhenVisible(this.localReferenceNumber, DETAIL_READ_TIMEOUT);
    }

    /**
     * Read the MRN, reduced to its alphanumeric characters (see alphanumericOnly).
     * Returns '' if the row is not present yet (never throws), so a poll can decide
     * whether to wait.
     */
    private async readMovementReferenceNumber(): Promise<string> {
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
            if (traderInputIsSettled && isTraderInputRequiredConsignmentStatus(status, this.t!)) {
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
        return readFieldWhenVisible(this.status, DETAIL_READ_TIMEOUT);
    }


    async waitForStatus(
        expectedStatusKey: TranslationKey,
        timeout = STATUS_POLL_TIMEOUT
    ): Promise<string> {
        const expected = this.t!(expectedStatusKey);
        let status = '';

        await expect(async () => {
            status = await readFieldIfPresent(this.status);
            if (status === expected) {
                return;
            }
            await this.page.reload();
            expect(status, 'Consignment status').toBe(expected);
        })
            .toPass({ timeout, intervals: [2_000, 3_000, 5_000] })
            .catch(() => { /* the caller asserts; this only decides how long to wait */ });

        return status;
    }

    /**
     * The MRN row exactly as it is displayed, waiting for the summary list first.
     *
     * Raw rather than reduced, because the raw text is what a report should carry: an
     * EIDR renders "-" here, and whether that means "no MRN" is the caller's judgement -
     * see alphanumericOnly, exported for exactly that.
     */
    async readDisplayedMovementReferenceNumber(): Promise<string> {
        await readFieldWhenVisible(this.status, DETAIL_READ_TIMEOUT);
        return readFieldIfPresent(this.movementReferenceNumber);
    }
}
