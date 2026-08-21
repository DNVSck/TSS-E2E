import { BasePage } from "./base-page";
import { Page, Locator, expect } from '@playwright/test';
import { TFunction } from '../fixtures/locale-fixture';
import { LOCAL_REFERENCE } from '../constant/local-reference-constants';
import { summaryListValue, readFieldWhenVisible, newRecordButton } from '../helper/element-helper';
import { StringUtil } from '../core/util/string-util';

/** URL path segments used to build and await movement routes. */
const GOODS_MOVEMENT_SEGMENT = 'goods-movement';
const OVERVIEW_SEGMENT = 'overview';

/** Waits (ms). */
const NAV_TIMEOUT = 30_000;
/** This heavy overview paints its summary list a beat after load. */
const SUMMARY_READ_TIMEOUT = 20_000;
const CONSIGNMENT_VIEW_TIMEOUT = 30_000;
/**
 * SFD, IMMI and EIDR share this longer wait: each is a linked consignment the
 * backend auto-generates a little after submit — one phenomenon, one knob.
 */
const LINKED_CONSIGNMENT_VIEW_TIMEOUT = 60_000;
/** The submitted GMR appears on the GMR tab shortly after submit. */
const GMR_VIEW_TIMEOUT = 60_000;


export class MovementOverviewPage extends BasePage {

    // Locators. NOTE: summary-list fields (localReferenceNumber, declarationStatus)
    // are matched via translated label text, so they depend on locale/label changes.
    private readonly ensConsignmentsTab: Locator;
    private readonly sfdConsignmentsTab: Locator;
    private readonly immiConsignmentsTab: Locator;
    private readonly eidrConsignmentsTab: Locator;
    private readonly gmrDetailsTab: Locator;
    private readonly newENSConsignmentBtn: Locator;
    private readonly uploadCSVBtn: Locator;
    private readonly associateConsignmentBtn: Locator;

    private readonly createGMRButton: Locator;

    private readonly localReferenceNumber: Locator;
    private readonly declarationStatus: Locator;

    /**
     * The "View" buttons on a consignment card — matched by their detail-route
     * href shape (never the translated "View" label). An ENS consignment's detail
     * lives under ".../{MOVEMENT}/DEC.../overview"; an auto-generated SFD/IMMI
     * consignment's under ".../sfd/{MOVEMENT}/…" resp. ".../immi/{MOVEMENT}/…".
     */
    private readonly ensConsignmentViewLink: Locator;
    private readonly sfdConsignmentViewLink: Locator;
    private readonly immiConsignmentViewLink: Locator;
    private readonly eidrConsignmentViewLink: Locator;
    private readonly gmrViewLink: Locator;


    constructor(page: Page, t: TFunction) {
        super(page, t);

        const localReferenceLabel = this.t!('common.localReferenceNumber');
        const declarationStatusLabel = this.t!('movementHeaderOverview.declarationStatus');
        
        //Tab list
        this.ensConsignmentsTab = page.locator("//a[contains(@href, '/overview/#overview-tab')]");
        this.sfdConsignmentsTab = page.locator("//a[contains(@href, '/overview/sfd-consignments#overview-tab')]");
        this.immiConsignmentsTab = page.locator("//a[contains(@href, '/overview/immi-consignments#overview-tab')]");
        this.eidrConsignmentsTab = page.locator("//a[contains(@href, '/overview/eidr-consignments#overview-tab')]");
        this.gmrDetailsTab = page.locator("//a[contains(@href, '/overview/gmr-details#overview-tab')]");

        // ENS Consignment actions
        this.newENSConsignmentBtn = newRecordButton(page, '?index');
        this.uploadCSVBtn = page.locator("//form[contains(@action,'?index')]//button[@value='upload-csv']");
        this.associateConsignmentBtn = page.locator("//form[contains(@action,'?index')]//button[@value='associate-consignment']");

        //GMR actions
        this.createGMRButton = newRecordButton(page, 'gmr-details');

        // Summary list fields
        this.localReferenceNumber = summaryListValue(page, localReferenceLabel);
        this.declarationStatus = summaryListValue(page, declarationStatusLabel);

        // The ENS consignment is the only View link whose href carries the movement
        // number ("ENS…") directly after "/goods-movement/"; the SFD/IMMI/EIDR ones
        // nest a type segment first ("/goods-movement/sfd/…", "…/immi/…", "…/eidr/…").
        // Matching that positively — rather than blacklisting each type with :not() —
        // keeps this correct when a new consignment type is added. The "/DEC" keeps it
        // off the movement-overview link, which carries no consignment reference.
        this.ensConsignmentViewLink = page.locator(
            "a.govuk-button[href*='/goods-movement/ENS'][href*='/DEC'][href$='/overview']"
        );
        this.sfdConsignmentViewLink = page.locator(
            "a.govuk-button[href*='/goods-movement/sfd/'][href$='/overview']"
        );
        // The IMMI View-link href shape mirrors SFD ("/goods-movement/immi/…"),
        // by analogy — no IMMI consignment was available to inspect, since the IMMI
        // specs are skipped and stop at known bugs before submit.
        this.immiConsignmentViewLink = page.locator(
            "a.govuk-button[href*='/goods-movement/immi/'][href$='/overview']"
        );
        // The EIDR View-link href mirrors SFD/IMMI ("/goods-movement/eidr/…/DEC…/overview").
        this.eidrConsignmentViewLink = page.locator(
            "a.govuk-button[href*='/goods-movement/eidr/'][href$='/overview']"
        );
        // The GMR card's "View" button on the GMR details tab. Its href nests under a
        // "/goods-movement-records/" segment that no consignment View link carries, so
        // matching that scopes it to the GMR record. Matching the lowercase route
        // segment (not the "GMR…" reference) avoids the case-sensitivity of CSS
        // attribute selectors — the reference is uppercase, a bare [href*='gmr'] never
        // matched it. The exact detail URL is still read from the link's own href at
        // click time (see openGmrDetailFromTab).
        this.gmrViewLink = page.locator(
            "a.govuk-button[href*='/goods-movement-records/'][href$='/overview']"
        );
    }


    async clickNewENSConsignment(): Promise<void> {
        await this.newENSConsignmentBtn.click();
    }

    async clickUploadCSV(): Promise<void> {
        await this.uploadCSVBtn.click();
    }

    async clickAssociateConsignment(): Promise<void> {
        await this.associateConsignmentBtn.click();
    }

    async getMovementLocalReferenceNumber(): Promise<string> {
        return readFieldWhenVisible(this.localReferenceNumber, SUMMARY_READ_TIMEOUT);
    }

    async getMovementDeclarationStatus(): Promise<string> {
        return readFieldWhenVisible(this.declarationStatus, SUMMARY_READ_TIMEOUT);
    }

    /**
     * Both checks are soft so one run reports every mismatch, rather than hiding
     * the status behind a reference-number failure. Soft costs no strictness - the
     * test still fails; it only defers the stop so the rest of the body runs.
     *
     * Returns both read values so callers can surface them (in the report, logs, ...)
     * without a second read of the page - which is the other reason neither check is
     * hard: a hard failure would throw before the return, and neither value would
     * ever reach the report.
     */
    async assertDraftMovementOverview(): Promise<{ localReferenceNumber: string; declarationStatus: string }> {
        const localReferenceNumber = await this.getMovementLocalReferenceNumber();
        const declarationStatus = await this.getMovementDeclarationStatus();
        const expectedStatus = this.t!('status.draft');

        // Asserting the string, not a boolean: a failure then reports the actual
        // reference number instead of a bare "expected truthy, received false".
        expect.soft(localReferenceNumber, 'Local reference number')
            .toMatch(LOCAL_REFERENCE.ENS_PREFIX);

        expect.soft(declarationStatus, 'Declaration status').toBe(expectedStatus);

        return { localReferenceNumber, declarationStatus };
    }

    /**
     * Open the ENS consignment's detail page, continuing the user journey from the
     * current consignment detail: breadcrumb back to the movement overview, open
     * the ENS consignments tab, then click the ENS consignment's "View". Returns
     * false if no ENS consignment is listed.
     */
    async openEnsConsignmentDetail(): Promise<boolean> {
        await this.returnToMovementOverview();
        return this.openRecordFromTab(this.ensConsignmentsTab, this.ensConsignmentViewLink);
    }

    /**
     * Open the auto-generated SFD consignment's detail page, continuing the user
     * journey from an ENS consignment detail: breadcrumb back to the movement
     * overview, open the SFD consignments tab, then click the SFD consignment's
     * "View". The SFD consignment is auto-generated a little after submit, so it
     * tolerates a longer wait. Returns false if none appears.
     */
    async openSfdConsignmentDetail(): Promise<boolean> {
        await this.returnToMovementOverview();
        return this.openRecordFromTab(
            this.sfdConsignmentsTab,
            this.sfdConsignmentViewLink,
            LINKED_CONSIGNMENT_VIEW_TIMEOUT
        );
    }

    async reopenSfdConsignmentDetail(): Promise<boolean> {
        return this.reopenGeneratedConsignment(
            this.sfdConsignmentsTab, this.sfdConsignmentViewLink
        );
    }

    /** The IMMI counterpart of {@link reopenSfdConsignmentDetail}. */
    async reopenImmiConsignmentDetail(): Promise<boolean> {
        return this.reopenGeneratedConsignment(
            this.immiConsignmentsTab, this.immiConsignmentViewLink
        );
    }

    /**
     * Reach the movement overview by URL, then open one of its generated consignments.
     *
     * The counterpart of the open*ConsignmentDetail methods, which walk back up the
     * breadcrumb - the user's own path, and the right one mid-journey. This is for a
     * caller with no path to walk: see goToMovementOverview.
     *
     * Shared rather than written per kind: the only difference between them is which
     * tab to click, and two copies would be two places to fix when the route changes.
     */
    private async reopenGeneratedConsignment(tab: Locator, viewLink: Locator): Promise<boolean> {
        await this.goToMovementOverview();
        return this.openRecordFromTab(tab, viewLink, LINKED_CONSIGNMENT_VIEW_TIMEOUT);
    }

    /**
     * Open the auto-generated IMMI consignment's detail page — the IMMI journey's
     * analogue of {@link openSfdConsignmentDetail}. Returns false if none appears.
     */
    async openImmiConsignmentDetail(): Promise<boolean> {
        await this.returnToMovementOverview();
        return this.openRecordFromTab(
            this.immiConsignmentsTab,
            this.immiConsignmentViewLink,
            LINKED_CONSIGNMENT_VIEW_TIMEOUT
        );
    }

    /**
     * Open the auto-generated EIDR consignment's detail page — the EIDR journey's
     * analogue of {@link openSfdConsignmentDetail}. Returns false if none appears.
     */
    async openEidrConsignmentDetail(): Promise<boolean> {
        await this.returnToMovementOverview();
        return this.openRecordFromTab(
            this.eidrConsignmentsTab,
            this.eidrConsignmentViewLink,
            LINKED_CONSIGNMENT_VIEW_TIMEOUT
        );
    }

    /**
     * The movement overview's own path.
     *
     * One definition, because three callers needed it and each had written it out:
     * two as a RegExp to recognise the page, one as a path to navigate to. A route
     * change had to be found in all three, or it broke the one that was missed.
     */
    private movementOverviewPath(movement: string): string {
        return `/${GOODS_MOVEMENT_SEGMENT}/${movement}/${OVERVIEW_SEGMENT}`;
    }

    /**
     * Recognises that path once the browser has landed on it.
     *
     * The trailing group allows a query or a fragment and nothing else, so a deeper
     * route (".../overview/sfd-consignments") is not mistaken for the overview itself.
     */
    private movementOverviewPattern(movement: string): RegExp {
        return new RegExp(`${this.movementOverviewPath(movement)}(?:[?#]|$)`);
    }

    /** The current movement's number ("ENS…"), parsed from the URL. */
    private currentMovementNumber(): string {
        const match = /ENS\d+/.exec(this.page.url());
        if (!match) {
            throw new Error(`No movement number (ENS…) found in URL: ${this.page.url()}`);
        }
        return match[0];
    }

    /** Any movement's overview - this runs before the number is known. */
    async waitForSubmittedMovementOverview(): Promise<void> {
        await this.page.waitForURL(
            this.movementOverviewPattern(String.raw`ENS\d+`),
            { timeout: NAV_TIMEOUT }
        );
    }

    /**
     * Land on the movement overview from anywhere, by URL.
     *
     * The exception to this page object's rule of following the user's own path, and it
     * earns it: a GMR record page has NO route back up to the movement. Checked on
     * 2026-08-20 - no breadcrumb to /<movement>/overview anywhere on it, and its own
     * "SFD Consignments" tab renders an EMPTY list, so the consignment cannot be
     * reached from there either. A journey that has just submitted a GMR is stranded,
     * and returnToMovementOverview (which clicks a breadcrumb) has nothing to click.
     *
     * The movement number comes from the URL the browser is already on, so this cannot
     * navigate to some other movement than the one under test.
     */
    private async goToMovementOverview(): Promise<void> {
        const movement = this.currentMovementNumber();
        const url = new URL(this.page.url());
        // Everything before "/goods-movement/" - the portal's own mount point, taken
        // from the live URL rather than assumed, so a re-mounted service still works.
        const mountPoint = url.pathname.slice(0, url.pathname.indexOf(`/${GOODS_MOVEMENT_SEGMENT}/`));

        url.pathname = `${mountPoint}${this.movementOverviewPath(movement)}`;
        url.search = '';
        url.hash = '';

        await this.page.goto(url.toString());
    }

    async returnToMovementOverview(): Promise<void> {
        const movement = this.currentMovementNumber();
        await this.page
            .locator(`a.govuk-breadcrumbs__link[href$="${this.movementOverviewPath(movement)}"]`)
            .click();
        await this.page.waitForURL(
            this.movementOverviewPattern(movement),
            { timeout: NAV_TIMEOUT }
        );
    }

    /**
     * Open a tab and click the (first) record's "View" - a consignment or a GMR, which
     * behave the same way here. The record can be generated asynchronously and the
     * overview does not auto-refresh, so if its card is not yet listed, reload and
     * retry until it appears (or the timeout lapses → false).
     */
    private async openRecordFromTab(
        tab: Locator,
        viewLink: Locator,
        timeout = CONSIGNMENT_VIEW_TIMEOUT
    ): Promise<boolean> {
        await tab.click();
        if (!await this.waitForRecordCard(tab, viewLink, timeout)) {
            return false;
        }
        return this.clickViewLink(viewLink);
    }

    /**
     * Wait for a record's "View" link to be visible on the (already-open) tab. The
     * record (a consignment, or a submitted GMR) is generated asynchronously and the
     * page does not auto-refresh, so if the card is not listed yet, reload and re-open
     * the tab (reload deselects the govuk-tabs) until it appears. Returns false on
     * timeout.
     */
    private async waitForRecordCard(tab: Locator, viewLink: Locator, timeout: number): Promise<boolean> {
        try {
            await expect(async () => {
                if (await viewLink.count() === 0) {
                    await this.page.reload();
                    await tab.click();
                }
                await expect(viewLink.first(), 'consignment View link').toBeVisible({ timeout: 5_000 });
            }).toPass({ timeout, intervals: [2_000, 3_000, 5_000] });
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Click a record card's "View" button and wait until its detail page has loaded.
     *
     * Where it is going comes from the link's OWN href, not from a pattern of what a
     * detail URL looks like. That pattern used to be /(DEC|GLR)\d+\/overview/, which a
     * GMR does not match - so opening a GMR had to restate this whole method rather
     * than call it, and every future record type would have had to do the same.
     *
     * Awaiting the navigation is the point of the method: without it a following read
     * races the click and reads the page being left. A "View" carrying no href is a
     * broken card, so it is reported as not opened rather than clicked hopefully.
     */
    private async clickViewLink(viewLink: Locator): Promise<boolean> {
        const link = viewLink.first();
        const href = await link.getAttribute('href');

        if (!href) {
            return false;
        }

        // Resolved against the current URL so a relative href and an absolute one both
        // reduce to the pathname the browser will actually be on.
        const route = StringUtil.stripTrailingSlashes(new URL(href, this.page.url()).pathname);

        try {
            await link.click();
            await this.page.waitForURL(
                url => StringUtil.stripTrailingSlashes(url.pathname) === route,
                { timeout: NAV_TIMEOUT }
            );
        } catch {
            return false;
        }
        return true;
    }

    /**
     * Open the GMR details tab and click "Create GMR". Assumes we are already on the
     * movement overview — callers coming from a consignment detail must
     * {@link returnToMovementOverview} first. Waits for the create button to paint
     * after the tab click so the click never races the panel render.
     */
    async navigateToGmrTabAndClickOnCreateGMR(): Promise<void> {
        await this.gmrDetailsTab.click();
        await this.createGMRButton.waitFor({ state: 'visible', timeout: NAV_TIMEOUT });
        await this.createGMRButton.click();
    }

    /**
     * Open the submitted GMR's detail page from the movement overview. Submitting a
     * GMR returns here with the GMR tab active. Returns false if no GMR card appears.
     *
     * The same journey as opening a consignment, so it is the same method now: this
     * one used to restate it because clickViewLink only recognised consignment URLs.
     */
    async openGmrDetailFromTab(): Promise<boolean> {
        return this.openRecordFromTab(this.gmrDetailsTab, this.gmrViewLink, GMR_VIEW_TIMEOUT);
    }

}