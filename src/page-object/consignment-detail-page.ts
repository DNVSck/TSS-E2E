import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base-page';
import { TFunction } from '../fixtures/locale-fixture';
import { summaryListValue } from '../core/util/element-helper';

/** This heavy detail page can be slow to paint under parallel load. */
const DETAIL_READ_TIMEOUT = 15_000;
/** The MRN is populated asynchronously after the consignment is authorised. */
const MRN_POLL_TIMEOUT = 60_000;

/**
 * A consignment's detail page, reached via the "View" button on a consignment
 * card. It carries the authoritative "Movement reference number" (MRN) and the
 * consignment "Status" as summary-list rows.
 */
export class ConsignmentDetailPage extends BasePage {
    private readonly movementReferenceNumber: Locator;
    private readonly status: Locator;

    constructor(page: Page, t: TFunction) {
        super(page, t);

        this.movementReferenceNumber = summaryListValue(page, this.t!('consignmentDetail.movementReferenceNumber'));
        this.status = summaryListValue(page, this.t!('common.status'));
    }

    /**
     * Read the MRN, reduced to its alphanumeric characters — the service injects
     * zero-width spaces (U+200B) into the rendered MRN as line-break hints, so the
     * raw text is e.g. "26X<zwsp>I…". Returns '' if the row is not present yet
     * (never throws), so a poll can decide whether to wait.
     */
    private async readMovementReferenceNumber(): Promise<string> {
        if (await this.movementReferenceNumber.count() === 0) {
            return '';
        }
        const raw = await this.movementReferenceNumber.innerText();
        return raw.replaceAll(/[^A-Za-z0-9]/g, '');
    }

    /**
     * Wait for the MRN to be populated. The value lands asynchronously and the
     * page does not auto-refresh, so reload until it appears. Non-throwing: on
     * timeout it returns the last-read value ('' if none), so the caller can
     * soft-assert the (possibly missing) MRN rather than the test aborting here.
     */
    async waitForMovementReferenceNumber(): Promise<string> {
        let mrn = '';
        await expect(async () => {
            mrn = await this.readMovementReferenceNumber();
            if (!mrn) {
                await this.page.reload();
            }
            expect(mrn, 'MRN populated').not.toBe('');
        })
            .toPass({ timeout: MRN_POLL_TIMEOUT, intervals: [2_000, 3_000, 5_000] })
            .catch(() => { /* soft: return whatever was last read for the caller to report */ });

        return mrn;
    }

    async getStatus(): Promise<string> {
        await this.status.first().waitFor({ state: 'visible', timeout: DETAIL_READ_TIMEOUT });
        return (await this.status.innerText()).trim();
    }

    /** Soft-assert the consignment status is "Awaiting arrival"; returns the actual status. */
    async assertStatusAwaitingArrival(): Promise<string> {
        const status = await this.getStatus();
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
        await this.status.first().waitFor({ state: 'visible', timeout: DETAIL_READ_TIMEOUT });
        const raw = await this.movementReferenceNumber.count()
            ? (await this.movementReferenceNumber.innerText()).trim()
            : '';
        expect.soft(raw.replaceAll(/[^A-Za-z0-9]/g, ''), 'EIDR MRN (should be absent)').toBe('');
        return raw;
    }
}
