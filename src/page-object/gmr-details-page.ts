import { BasePage } from "./base-page";
import { RENDER_TIMEOUT } from '../constant/timeout-constant';
import { Page, Locator, expect } from '@playwright/test';
import { TFunction } from '../fixtures/locale-fixture';
import {
    summaryListValue, readFieldWhenVisible, readFieldIfPresent, switchToTabAndClickNew, newRecordButton,
    clickLinkAndEnterWizard,
} from '../helper/element-helper';
import { LOCAL_REFERENCE } from '../constant/local-reference-constants';

/** The GMR detail summary list can be slow to paint under parallel load. */
/** After submit, the GMR ID and Open status are populated asynchronously. */
const GMR_OPEN_POLL_TIMEOUT = 60_000;

/**
 * The GMR details page — the "Check your answers" screen shown after a GMR is
 * created, and the detail page reached via "View" from the movement overview's
 * GMR tab after submit. It carries the GMR "Local reference number" (a "GMR…"
 * reference), the "GMR ID" (the GVMS "GMR…" identifier, populated after submit),
 * and the GMR "Status" as govuk-summary-list rows.
 */
export class GmrDetailsPage extends BasePage {
    private readonly submitGMRButton: Locator;
    private readonly routeIdChangeLink: Locator;
    private readonly cancelGMRButton: Locator;
    private readonly generateBarcodeButton: Locator;

    private readonly externalContactsTab: Locator;
    private readonly newExternalContactButton: Locator;

    // Summary-list fields, matched by their translated label (see t()).
    private readonly localReferenceNumber: Locator;
    private readonly gmrId: Locator;
    private readonly status: Locator;

    constructor(page: Page, t: TFunction) {
        super(page, t);
        this.submitGMRButton = page.locator("button[value='submit']");
        // The only row a GMR offers to change. Matched on the field it edits, not on
        // the word "Change", which is translated.
        this.routeIdChangeLink = page.locator("main a[href*='field=routeId']");
        this.cancelGMRButton = page.locator("button[value='cancel']");
        this.generateBarcodeButton = page.locator("button[value='generate-barcode']");

        this.externalContactsTab = page.locator("//a[contains(@href, '/external-contacts#overview-tab')]");

        this.newExternalContactButton = newRecordButton(page, '/external-contacts');

        this.localReferenceNumber = summaryListValue(page, this.t!('common.localReferenceNumber'));
        this.gmrId = summaryListValue(page, this.t!('gmrDetail.gmrId'));
        this.status = summaryListValue(page, this.t!('common.status'));
    }

    /**
     * "Change" the route on a GMR that is already Open.
     *
     * Its href ends in the "_edit_" placeholder the service resolves for itself, so the
     * link does not name where it lands - hence the wizard-entering click rather than
     * the route-matching one, exactly as a consignment's change links are followed.
     */
    async changeRouteId(): Promise<void> {
        await clickLinkAndEnterWizard(this.page, this.routeIdChangeLink, 'edit');
    }

    async submitGMR(): Promise<void> {
        await this.submitGMRButton.click();
    }

    async cancelGMR(): Promise<void> {
        await this.cancelGMRButton.click();
    }

    async generateBarcode(): Promise<void> {
        await this.generateBarcodeButton.click();
    }

    async clickExternalContactsTab(): Promise<void> {
        await this.externalContactsTab.click();
    }

    /** Open the "New external contact" wizard from the External Contacts tab. */
    async declareNewExternalContact(): Promise<void> {
        await switchToTabAndClickNew(this.page, this.externalContactsTab, this.newExternalContactButton);
    }

    private async getGmrStatus(): Promise<string> {
        return readFieldWhenVisible(this.status, RENDER_TIMEOUT.RECORD_DETAIL);
    }

    private async getGmrLocalReferenceNumber(): Promise<string> {
        return readFieldWhenVisible(this.localReferenceNumber, RENDER_TIMEOUT.RECORD_DETAIL);
    }

    /**
     * What the GMR "Check your answers" page says about itself, before submit.
     *
     * Reads, no verdict: whether "Draft" and a GMR-prefixed reference are the RIGHT
     * answers is a rule about the journey, and AddNewGMRFlow is where the journey is
     * known - see its verifyDraftGmr.
     */
    async readDraftGmr(): Promise<{ localReferenceNumber: string; status: string }> {
        return {
            localReferenceNumber: await this.getGmrLocalReferenceNumber(),
            status: await this.getGmrStatus(),
        };
    }

    /**
     * On the GMR detail page after submit: wait until the GMR is "Open" and its GMR
     * ID has been issued (opens with "GMR"). Both land asynchronously and the page
     * does not auto-refresh, so reload until they appear. Non-throwing: on timeout it
     * returns the last-read values so the caller can soft-assert (and report) them.
     */
    async waitForGmrOpen(): Promise<{ gmrId: string; status: string }> {
        const openLabel = this.t!('status.open');
        let gmrId = '';
        let status = '';

        await expect(async () => {
            status = await readFieldIfPresent(this.status);
            gmrId = await readFieldIfPresent(this.gmrId);
            if (status !== openLabel || !LOCAL_REFERENCE.GMR_PREFIX.test(gmrId)) {
                await this.page.reload();
            }
            expect(status, 'GMR status Open').toBe(openLabel);
            expect(gmrId, 'GMR ID issued').toMatch(LOCAL_REFERENCE.GMR_PREFIX);
        })
            .toPass({ timeout: GMR_OPEN_POLL_TIMEOUT, intervals: [2_000, 3_000, 5_000] })
            .catch(() => { /* soft: return whatever was last read for the caller to report */ });

        return { gmrId, status };
    }
}
