import { BasePage } from "./base-page";
import { RENDER_TIMEOUT } from '../constant/timeout-constant';
import { Page, Locator, expect } from '@playwright/test';
import { TFunction, TranslationKey } from '../fixtures/locale-fixture';
import {
    summaryListValue, readFieldWhenVisible, readFieldIfPresent, switchToTabAndClickNew, newRecordButton,
    clickLinkAndEnterWizard,
} from '../helper/element-helper';
import { LOCAL_REFERENCE } from '../constant/local-reference-constants';
import { MOVEMENT_ROUTE } from '../constant/endpoints-constant';

/** The GMR detail summary list can be slow to paint under parallel load. */
/** After submit, the GMR ID and Open status are populated asynchronously. */
const GMR_OPEN_POLL_TIMEOUT = 60_000;

const GVMS_UPDATE_POLL_TIMEOUT = 60_000;

const GVMS_FIRST_UPDATE_TIMEOUT = 180_000;

function gvmsUpdateInstant(shown: string): number {
    return Date.parse(shown.trim());
}

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
    private readonly vehicleRegistrationNumber: Locator;
    private readonly trailerRegistrationNumber: Locator;
    private readonly isTrailerUnaccompanied: Locator;
    private readonly inspectionRequired: Locator;
    private readonly reportToLocations: Locator;
    private readonly hmrcGvmsLastUpdate: Locator;

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

        this.localReferenceNumber = summaryListValue(page, t('common.localReferenceNumber'));
        this.gmrId = summaryListValue(page, t('gmrDetail.gmrId'));
        this.status = summaryListValue(page, t('common.status'));

        this.vehicleRegistrationNumber =
            summaryListValue(page, t('gmrDetail.vehicleRegistrationNumber'));
        this.trailerRegistrationNumber =
            summaryListValue(page, t('gmrDetail.trailerRegistrationNumber'));
        this.isTrailerUnaccompanied =
            summaryListValue(page, t('gmrDetail.isTrailerUnaccompanied'));
        this.inspectionRequired =
            summaryListValue(page, t('gmrDetail.inspectionRequired'));
        this.reportToLocations =
            summaryListValue(page, t('gmrDetail.reportToLocations'));
        this.hmrcGvmsLastUpdate =
            summaryListValue(page, t('gmrDetail.hmrcGvmsLastUpdate'));
    }

    /**
     * The transport identity the GMR inherited from its movement. Accompanied movements
     * carry a vehicle registration and unaccompanied ones a trailer registration, so the
     * row that does not apply is absent rather than blank - hence read-if-present on
     * both, and the caller decides which one it expected.
     */
    async readTransportIdentity(): Promise<{
        vehicleRegistrationNumber: string;
        trailerRegistrationNumber: string;
        isTrailerUnaccompanied: string;
    }> {
        return {
            vehicleRegistrationNumber: await readFieldIfPresent(this.vehicleRegistrationNumber),
            trailerRegistrationNumber: await readFieldIfPresent(this.trailerRegistrationNumber),
            isTrailerUnaccompanied: await readFieldIfPresent(this.isTrailerUnaccompanied),
        };
    }

    /**
     * "Inspection required" and, when it is Yes, the locations to report to. The
     * locations row is absent entirely when no inspection is due, which is why this
     * reads rather than waits.
     */
    async readInspection(): Promise<{ required: string; reportToLocations: string }> {
        return {
            required: await readFieldIfPresent(this.inspectionRequired),
            reportToLocations: await readFieldIfPresent(this.reportToLocations),
        };
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
        return this.waitForGmrStatus('status.open');
    }

    /**
     * The same wait for any status GVMS can move a GMR to. The GMR ID is held to the
     * same rule throughout: once issued it stays, so a status that arrives without it
     * is not the answer.
     *
     * Refuses to read anywhere but the GMR record. "Status" is a summary-list row on
     * the movement overview and on every consignment too, so a caller that had
     * navigated away would read a different record's status and be believed.
     */
    async waitForGmrStatus(
        expectedStatusKey: TranslationKey
    ): Promise<{ gmrId: string; status: string }> {
        this.refuseUnlessOnGmrRecord();

        const expected = this.t!(expectedStatusKey);
        let gmrId = '';
        let status = '';

        await expect(async () => {
            status = await readFieldIfPresent(this.status);
            gmrId = await readFieldIfPresent(this.gmrId);
            if (status !== expected || !LOCAL_REFERENCE.GMR_PREFIX.test(gmrId)) {
                await this.page.reload();
            }
            expect(status, `GMR status ${expected}`).toBe(expected);
            expect(gmrId, 'GMR ID issued').toMatch(LOCAL_REFERENCE.GMR_PREFIX);
        })
            .toPass({ timeout: GMR_OPEN_POLL_TIMEOUT, intervals: [2_000, 3_000, 5_000] })
            .catch(() => { /* soft: return whatever was last read for the caller to report */ });

        return { gmrId, status };
    }

    async waitForHmrcGvmsLastUpdate(): Promise<string> {
        this.refuseUnlessOnGmrRecord();

        let shown = '';

        await expect(async () => {
            shown = await readFieldIfPresent(this.hmrcGvmsLastUpdate);

            if (!shown) {
                await this.page.reload();
            }

            expect(shown, 'HMRC GVMS last update has been written').not.toBe('');
        })
            .toPass({ timeout: GVMS_FIRST_UPDATE_TIMEOUT, intervals: [2_000, 3_000, 5_000] })
            .catch(() => { /* soft: the flow reports an absent update */ });

        return shown;
    }

    async waitForHmrcGvmsLastUpdateAfter(
        baseline: string
    ): Promise<{ shown: string; movedOn: boolean }> {
        this.refuseUnlessOnGmrRecord();

        const startedAt = gvmsUpdateInstant(baseline);

        if (Number.isNaN(startedAt)) {
            throw new TypeError(
                `A later HMRC GVMS update can only be recognised against a baseline that `
                + `reads as a time, and the baseline given is "${baseline}".`
            );
        }

        let shown = '';
        let movedOn = false;

        await expect(async () => {
            shown = await readFieldIfPresent(this.hmrcGvmsLastUpdate);
            movedOn = gvmsUpdateInstant(shown) > startedAt;

            if (!movedOn) {
                await this.page.reload();
            }

            expect(movedOn, `HMRC GVMS last update moved on from "${baseline}"`).toBe(true);
        })
            .toPass({ timeout: GVMS_UPDATE_POLL_TIMEOUT, intervals: [2_000, 3_000, 5_000] })
            .catch(() => { /* soft: return whatever was last read for the caller to report */ });

        return { shown, movedOn };
    }

    private refuseUnlessOnGmrRecord(): void {
        if (MOVEMENT_ROUTE.GMR_RECORD_PATH.test(this.page.url())) {
            return;
        }

        throw new Error(
            `A GMR status can only be read on the GMR record, and the page open instead `
            + `is "${this.page.url()}".`
        );
    }
}
