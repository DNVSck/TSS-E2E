import { BasePage } from "./base-page";
import { RENDER_TIMEOUT } from '../constant/timeout-constant';
import { MOVEMENT_ROUTE, CANCELLATION_ROUTE } from '../constant/endpoints-constant';
import { Page, Locator, expect } from '@playwright/test';
import { TFunction, TranslationKey } from '../fixtures/locale-fixture';
import { LOCAL_REFERENCE } from '../constant/local-reference-constants';
import {
    readFieldWhenVisible, readFieldIfPresent, newRecordButton, clickLinkAndWaitForRoute, textsOf,
} from '../helper/element-helper';
import { StringUtil } from '../core/util/string-util';
import { GOVUK } from './components/govuk-selectors';
import { CancellationScreen } from './components/cancellation-screen';
import { waitForOpenTabPanel } from './components/record-tabs';



const CONSIGNMENT_VIEW_TIMEOUT = 30_000;

const CANCEL_SETTLE_TIMEOUT = 30_000;

const STATUS_POLL_TIMEOUT = 60_000;
/**
 * SFD, IMMI and EIDR share this longer wait: each is a linked consignment the
 * backend auto-generates a little after submit — one phenomenon, one knob.
 */
const LINKED_CONSIGNMENT_VIEW_TIMEOUT = 90_000;

/** The submitted GMR appears on the GMR tab shortly after submit. */
const GMR_VIEW_TIMEOUT = 90_000;

const CONSIGNMENT_WIZARD_OPEN_TIMEOUT = 30_000;


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
    private readonly cancelDeclarationLink: Locator;
    private readonly cancellationScreen: CancellationScreen;
    private readonly cancelledMovementLink: Locator;
    private readonly cancellationScope: Locator;

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
        this.gmrDetailsTab = page.locator(
            `//a[contains(@href, '/overview/${MOVEMENT_ROUTE.GMR_DETAILS_TAB_SEGMENT}#overview-tab')]`
        );

        // ENS Consignment actions
        this.newENSConsignmentBtn = newRecordButton(page, '?index');
        this.uploadCSVBtn = page.locator("//form[contains(@action,'?index')]//button[@value='upload-csv']");
        this.associateConsignmentBtn = page.locator("//form[contains(@action,'?index')]//button[@value='associate-consignment']");

        this.cancelDeclarationLink = page.locator(
            `main a[href$='/${CANCELLATION_ROUTE.CANCEL_SEGMENT}']`
        );

        this.cancellationScreen = new CancellationScreen(page);

        this.cancelledMovementLink = page.locator(
            `main a[href*='/${MOVEMENT_ROUTE.GOODS_MOVEMENT_SEGMENT}/'][href$='/${MOVEMENT_ROUTE.OVERVIEW_SEGMENT}']`
        );
        this.cancellationScope = page.locator('main .govuk-notification-banner__heading, main p.govuk-body');

        //GMR actions
        this.createGMRButton = newRecordButton(page, MOVEMENT_ROUTE.GMR_DETAILS_TAB_SEGMENT);

        // Summary list fields
        this.localReferenceNumber = this.summaryList.valueOf(localReferenceLabel);
        this.declarationStatus = this.summaryList.valueOf(declarationStatusLabel);

        // The ENS consignment is the only View link whose href carries the movement
        // number ("ENS…") directly after "/goods-movement/"; the SFD/IMMI/EIDR ones
        // nest a type segment first ("/goods-movement/sfd/…", "…/immi/…", "…/eidr/…").
        // Matching that positively — rather than blacklisting each type with :not() —
        // keeps this correct when a new consignment type is added. The "/DEC" keeps it
        // off the movement-overview link, which carries no consignment reference.
        this.ensConsignmentViewLink = page.locator(
            `a${GOVUK.BUTTON.ROOT}[href*='/goods-movement/ENS'][href*='/DEC'][href$='/overview']`
        );
        this.sfdConsignmentViewLink = page.locator(
            `a${GOVUK.BUTTON.ROOT}[href*='/goods-movement/sfd/'][href$='/overview']`
        );
        // The IMMI View-link href shape mirrors SFD ("/goods-movement/immi/…"),
        // by analogy — no IMMI consignment was available to inspect, since the IMMI
        // specs are skipped and stop at known bugs before submit.
        this.immiConsignmentViewLink = page.locator(
            `a${GOVUK.BUTTON.ROOT}[href*='/goods-movement/immi/'][href$='/overview']`
        );
        // The EIDR View-link href mirrors SFD/IMMI ("/goods-movement/eidr/…/DEC…/overview").
        this.eidrConsignmentViewLink = page.locator(
            `a${GOVUK.BUTTON.ROOT}[href*='/goods-movement/eidr/'][href$='/overview']`
        );
        // The GMR card's "View" button on the GMR details tab. Its href nests under a
        // "/goods-movement-records/" segment that no consignment View link carries, so
        // matching that scopes it to the GMR record. Matching the lowercase route
        // segment (not the "GMR…" reference) avoids the case-sensitivity of CSS
        // attribute selectors — the reference is uppercase, a bare [href*='gmr'] never
        // matched it. The exact detail URL is still read from the link's own href at
        // click time (see openGmrDetailFromTab).
        this.gmrViewLink = page.locator(
            `a${GOVUK.BUTTON.ROOT}[href*='/goods-movement-records/'][href$='/overview']`
        );
    }


    async clickNewENSConsignment(): Promise<void> {
        await this.newENSConsignmentBtn.click();
        await this.waitForConsignmentWizard();
    }

    private async waitForConsignmentWizard(): Promise<void> {
        const from = new URL(this.page.url()).pathname;

        try {
            await this.page.waitForURL(
                url => url.pathname.includes(MOVEMENT_ROUTE.NEW_CONSIGNMENT_SEGMENT),
                { waitUntil: 'domcontentloaded', timeout: CONSIGNMENT_WIZARD_OPEN_TIMEOUT }
            );
        } catch {
            const now = new URL(this.page.url()).pathname;

            throw new Error(
                `"New consignment" did not open the consignment wizard within `
                + `${CONSIGNMENT_WIZARD_OPEN_TIMEOUT / 1000}s - expected a URL containing `
                + `"${MOVEMENT_ROUTE.NEW_CONSIGNMENT_SEGMENT}", the page is on "${now}". `
                + (now === from
                    ? 'It never left the overview, so the button took the click and the app '
                    + 'ignored it - nothing was created.'
                    : `It left "${from}" for somewhere else, so the button leads somewhere `
                    + 'this no longer recognises.')
            );
        }
    }

    async clickUploadCSV(): Promise<void> {
        await this.uploadCSVBtn.click();
    }

    async clickAssociateConsignment(): Promise<void> {
        await this.associateConsignmentBtn.click();
    }

    async listEnsConsignmentReferences(): Promise<string[]> {
        if (!await this.waitForRecordCard(this.ensConsignmentsTab, this.ensConsignmentViewLink, CONSIGNMENT_VIEW_TIMEOUT)) {
            return [];
        }

        const hrefs = await this.ensConsignmentViewLink.evaluateAll(
            links => links.map(link => link.getAttribute('href') ?? '')
        );

        return hrefs.flatMap(href =>
            href.split('/').filter(segment => LOCAL_REFERENCE.DEC_PREFIX.test(segment))
        );
    }

    async openEnsConsignmentDetailFor(consignmentReference: string): Promise<boolean> {
        await this.returnToMovementOverview();
        return this.openRecordFromTab(
            this.ensConsignmentsTab,
            this.ensConsignmentViewLink.and(this.page.locator(`[href*='/${consignmentReference}/']`))
        );
    }

    async openCancelDeclaration(): Promise<void> {
        await this.cancelDeclarationLink.click();
        await this.cancellationScreen.waitForReason(CANCEL_SETTLE_TIMEOUT);
    }

    async confirmCancellation(reason: string): Promise<string[]> {
        return this.cancellationScreen.confirm(reason, CANCEL_SETTLE_TIMEOUT);
    }

    async returnToCancelledMovement(): Promise<void> {
        await clickLinkAndWaitForRoute(this.page, this.cancelledMovementLink);
    }

    async readCancellationScope(): Promise<string[]> {
        return textsOf(this.cancellationScope);
    }

    async getMovementLocalReferenceNumber(): Promise<string> {
        return readFieldWhenVisible(this.localReferenceNumber, RENDER_TIMEOUT.SUMMARY_LIST);
    }

    async getMovementDeclarationStatus(): Promise<string> {
        return readFieldWhenVisible(this.declarationStatus, RENDER_TIMEOUT.SUMMARY_LIST);
    }

    async waitForDeclarationStatus(
        expectedStatusKey: TranslationKey,
        timeout = STATUS_POLL_TIMEOUT
    ): Promise<string> {
        const expected = this.t!(expectedStatusKey);
        let status = '';

        await expect(async () => {
            status = await readFieldIfPresent(this.declarationStatus);
            if (status === expected) {
                return;
            }

            await this.page.reload();
            expect(status, 'Movement declaration status').toBe(expected);
        })
            .toPass({ timeout, intervals: [2_000, 3_000, 5_000] })
            .catch(() => { /* the caller asserts; this only decides how long to wait */ });

        return status;
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
        return `/${MOVEMENT_ROUTE.GOODS_MOVEMENT_SEGMENT}/${movement}/${MOVEMENT_ROUTE.OVERVIEW_SEGMENT}`;
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
        await this.page.waitForURL(this.movementOverviewPattern(String.raw`ENS\d+`));
    }

    /**
     * Land on the movement overview from anywhere, by URL - unless the browser is
     * already on it or on one of its tab sub-routes, which the tab click below can
     * reach without a navigation. Going anyway raced the app: landing on /overview
     * from a tab makes it navigate straight back down to that tab, and that second
     * navigation cancels this one (seen on sit 2026-09-14).
     *
     * The guard reads the URL once, so the app can still start that navigation in
     * the gap before goto commits. An interrupted goto is therefore only an error
     * when the browser did not end up under the overview anyway.
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
        const url = this.movementOverviewUrl();
        const overviewPath = url.pathname;

        if (this.isUnderMovementOverview(overviewPath)) {
            return;
        }

        try {
            await this.page.goto(url.toString(), { waitUntil: 'commit' });
        } catch (error_) {
            if (!this.isUnderMovementOverview(overviewPath)) {
                throw error_;
            }
        }
    }

    private isUnderMovementOverview(overviewPath: string): boolean {
        const { pathname } = new URL(this.page.url());

        return pathname === overviewPath || pathname.startsWith(`${overviewPath}/`);
    }

    /**
     * Walk the breadcrumb back up to the movement overview - unless we are already on
     * it, in which case there is nothing to click and nothing to wait for.
     *
     * A breadcrumb lists a page's ANCESTORS, never the page itself, so on the movement
     * overview the link this looks for does not exist. Submitting a GMR lands right
     * there, and this spent the whole click budget on a link that was never going to be
     * on the page (measured on sit 2026-09-02, at 60s). The guard reads the URL rather
     * than the breadcrumb, for the same reason PortalPage.returnToHomeIfAway does: a
     * link that happens to be absent is not proof of where you are.
     */
    async returnToMovementOverview(): Promise<void> {
        const movement = this.currentMovementNumber();

        if (this.movementOverviewPattern(movement).test(this.page.url())) {
            return;
        }

        // A GMR record has no way back up, so the URL IS the route rather than a way
        // round one - see goToMovementOverview, which recorded the same thing on
        // belongs in that corner of the page yet, so this is not a gap waiting to close.
        if (MOVEMENT_ROUTE.GMR_RECORD_PATH.test(this.page.url())) {
            await this.goToMovementOverview();
            return;
        }

        await this.page
            .locator(`a${GOVUK.BREADCRUMBS.LINK}[href$="${this.movementOverviewPath(movement)}"]`)
            .click();
        await this.page.waitForURL(this.movementOverviewPattern(movement));
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
        // Only if it is not already showing. A govuk-tab that is SELECTED renders
        // without the href this locator matches, so clicking it on the tab it already
        // opened waits out the budget - which is exactly the state submitting a GMR
        // leaves the page in. The card being visible is the honest test of "already
        // open"; waitForRecordCard below still re-clicks after any reload it does.
        if (await viewLink.count() === 0) {
            await tab.click();
        }
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
                url => StringUtil.stripTrailingSlashes(url.pathname) === route
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
        await this.createGMRButton.waitFor({ state: 'visible' });
        await this.createGMRButton.click();
    }

    async readCreateGmrOffered(): Promise<boolean> {
        const overview = this.movementOverviewUrl();
        const tab = new URL(overview.toString());
        tab.pathname = `${tab.pathname}/${MOVEMENT_ROUTE.GMR_DETAILS_TAB_SEGMENT}`;

        await this.page.goto(tab.toString(), { waitUntil: 'domcontentloaded' });
        await waitForOpenTabPanel(this.page, RENDER_TIMEOUT.TAB_PANEL);
        const offered = await this.createGMRButton.isVisible();
        await this.page.goto(overview.toString(), { waitUntil: 'domcontentloaded' });

        return offered;
    }

    private movementOverviewUrl(): URL {
        const url = new URL(this.page.url());

        const mountPoint = url.pathname.slice(
            0, url.pathname.indexOf(`/${MOVEMENT_ROUTE.GOODS_MOVEMENT_SEGMENT}/`)
        );

        url.pathname = `${mountPoint}${this.movementOverviewPath(this.currentMovementNumber())}`;
        url.search = '';
        url.hash = '';

        return url;
    }


    gmrOverviewUrl(): string {
        const url = new URL(this.page.url());
        const record = MOVEMENT_ROUTE.GMR_RECORD_PATH.exec(url.pathname);

        if (!record) {
            throw new Error(`Not on a GMR record: ${this.page.url()}`);
        }

        const recordPath = url.pathname.slice(0, record.index + record[0].length);


        url.pathname = `${recordPath}/${MOVEMENT_ROUTE.OVERVIEW_SEGMENT}`;
        url.search = '';
        url.hash = '';
        return url.toString();
    }


    async openGmrDetailFromTab(): Promise<boolean> {

        if (MOVEMENT_ROUTE.GMR_RECORD_PATH.test(this.page.url())) {
            return true;
        }

        return this.openRecordFromTab(this.gmrDetailsTab, this.gmrViewLink, GMR_VIEW_TIMEOUT);
    }


    async reopenGmrDetailFromTab(): Promise<boolean> {
        await this.goToMovementOverview();
        return this.openRecordFromTab(this.gmrDetailsTab, this.gmrViewLink, GMR_VIEW_TIMEOUT);
    }

}