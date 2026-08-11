import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base-page';
import { TFunction } from '../fixtures/locale-fixture';
import { summaryListValue, readFieldWhenVisible, readFieldIfPresent } from '../helper/element-helper';
import { isTraderInputRequiredConsignmentStatus } from '../helper/consignment-status-helper';

/** This heavy detail page can be slow to paint under parallel load. */
const DETAIL_READ_TIMEOUT = 15_000;
/** The MRN is populated asynchronously after the consignment is authorised. */
const MRN_POLL_TIMEOUT = 60_000;

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
export class ConsignmentDetailPage extends BasePage {
    private readonly localReferenceNumber: Locator;
    private readonly movementReferenceNumber: Locator;
    private readonly status: Locator;

    constructor(page: Page, t: TFunction) {
        super(page, t);

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
     * An MRN is only ever assigned to an authorised consignment, so a status the
     * service will not move on from is also the answer to this question: there is no
     * MRN coming. Reading the status costs one locator per attempt and saves the whole
     * remaining timeout on the runs that need the report soonest - the failing ones.
     */
    async waitForMovementReferenceNumber(): Promise<string> {
        let mrn = '';
        await expect(async () => {
            mrn = await this.readMovementReferenceNumber();
            if (mrn) {
                return;
            }

            const status = await readFieldIfPresent(this.status);
            if (isTraderInputRequiredConsignmentStatus(status, this.t!)) {
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
        await readFieldWhenVisible(this.status, DETAIL_READ_TIMEOUT);
        const raw = await readFieldIfPresent(this.movementReferenceNumber);
        expect.soft(alphanumericOnly(raw), 'EIDR MRN (should be absent)').toBe('');
        return raw;
    }
}
