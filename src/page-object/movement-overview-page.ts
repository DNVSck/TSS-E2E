import { BasePage } from "./base-page";
import { Page, Locator, expect } from '@playwright/test';
import { TFunction } from '../fixtures/locale-fixture';
import { LOCAL_REFERENCE } from '../constant/local-reference-constants';
import { summaryListValue } from '../core/util/element-helper';

/** URL path segments used to build and await movement routes. */
const GOODS_MOVEMENT_SEGMENT = 'goods-movement';
const OVERVIEW_SEGMENT = 'overview';

/** Waits (ms). */
const NAV_TIMEOUT = 30_000;
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
        this.newENSConsignmentBtn = page.locator("//form[contains(@action,'?index')]//button[@value='new-record']");
        this.uploadCSVBtn = page.locator("//form[contains(@action,'?index')]//button[@value='upload-csv']");
        this.associateConsignmentBtn = page.locator("//form[contains(@action,'?index')]//button[@value='associate-consignment']");

        //GMR actions
        this.createGMRButton = page.locator("//form[contains(@action,'gmr-details')]//button[@value='new-record']");

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

    async getTextLocalReferenceNumber(): Promise<string> {
        // This overview is heavy and paints its summary list a beat after load; on
        // this slow env a bare innerText can race that paint and time out at the
        // default action timeout. Wait for the field to be visible first.
        await this.localReferenceNumber.first().waitFor({ state: 'visible', timeout: 20_000 });
        return await this.localReferenceNumber.innerText();
    }

    async getTextDeclarationStatus(): Promise<string> {
        await this.declarationStatus.first().waitFor({ state: 'visible', timeout: 20_000 });
        return await this.declarationStatus.innerText();
    }

    /**
     * Both checks are soft so one run reports every mismatch, rather than hiding
     * the status behind a reference-number failure.
     *
     * Returns the validated local reference number so callers can surface it (in
     * the report, logs, ...) without a second read of the page.
     */
    async assertDraftMovementOverview(): Promise<string> {
        const localReferenceNumber = await this.getTextLocalReferenceNumber();
        const declarationStatus = await this.getTextDeclarationStatus();
        const expectedStatus = this.t!('status.draft');

        // Asserting the string, not a boolean: a failure then reports the actual
        // reference number instead of a bare "expected truthy, received false".
        expect.soft(localReferenceNumber, 'Local reference number')
            .toMatch(LOCAL_REFERENCE.ENS_PREFIX);

        expect(declarationStatus, 'Declaration status').toBe(expectedStatus);

        return localReferenceNumber;
    }

    /**
     * Open the ENS consignment's detail page, continuing the user journey from the
     * current consignment detail: breadcrumb back to the movement overview, open
     * the ENS consignments tab, then click the ENS consignment's "View". Returns
     * false if no ENS consignment is listed.
     */
    async openEnsConsignmentDetail(): Promise<boolean> {
        await this.returnToMovementOverview();
        return this.openConsignmentFromTab(this.ensConsignmentsTab, this.ensConsignmentViewLink);
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
        return this.openConsignmentFromTab(
            this.sfdConsignmentsTab,
            this.sfdConsignmentViewLink,
            LINKED_CONSIGNMENT_VIEW_TIMEOUT
        );
    }

    /**
     * Open the auto-generated IMMI consignment's detail page — the IMMI journey's
     * analogue of {@link openSfdConsignmentDetail}. Returns false if none appears.
     */
    async openImmiConsignmentDetail(): Promise<boolean> {
        await this.returnToMovementOverview();
        return this.openConsignmentFromTab(
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
        return this.openConsignmentFromTab(
            this.eidrConsignmentsTab,
            this.eidrConsignmentViewLink,
            LINKED_CONSIGNMENT_VIEW_TIMEOUT
        );
    }

    /** The current movement's number ("ENS…"), parsed from the URL. */
    private currentMovementNumber(): string {
        const match = /ENS\d+/.exec(this.page.url());
        if (!match) {
            throw new Error(`No movement number (ENS…) found in URL: ${this.page.url()}`);
        }
        return match[0];
    }

    /**
     * Click the breadcrumb back to the movement overview and wait for it to load.
     * The movement number is captured from the current (detail) URL first, then
     * used to target the breadcrumb whose href ends exactly ".../{movement}/overview"
     * — a consignment crumb ends ".../{DEC|GLR…}/overview" instead, so this stays
     * unambiguous whatever the consignment type (ENS→DEC, SFD→DEC, IMMI→GLR).
     *
     * Public so a following journey (e.g. creating a GMR) can return here from a
     * consignment detail before opening a movement-level tab.
     */
    async returnToMovementOverview(): Promise<void> {
        const movement = this.currentMovementNumber();
        await this.page
            .locator(`a.govuk-breadcrumbs__link[href$='/${movement}/${OVERVIEW_SEGMENT}']`)
            .click();
        await this.page.waitForURL(
            new RegExp(`/${GOODS_MOVEMENT_SEGMENT}/${movement}/${OVERVIEW_SEGMENT}(?:[?#]|$)`),
            { timeout: NAV_TIMEOUT }
        );
    }

    /**
     * Open a consignments tab and click the (first) consignment's "View". The
     * consignment can be generated asynchronously and the overview does not
     * auto-refresh, so if its card is not yet listed, reload and retry until it
     * appears (or the timeout lapses → false).
     */
    private async openConsignmentFromTab(
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
     * Click a consignment card's "View" button and wait until its detail page has
     * loaded (URL settles on ".../{DEC|GLR…}/overview" — ENS/SFD use a DEC ref,
     * IMMI a GLR one). Awaiting the navigation here is what keeps a following read
     * from racing the click and landing on the wrong page. Returns false if the
     * click does not open a detail page.
     */
    private async clickViewLink(viewLink: Locator): Promise<boolean> {
        try {
            await viewLink.first().click();
            await this.page.waitForURL(/\/(?:DEC|GLR)\d+\/overview/, { timeout: NAV_TIMEOUT });
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
     * GMR returns here with the GMR tab active; click the tab (a reload during the
     * card-wait deselects govuk-tabs, so re-select it), wait for the GMR's "View"
     * link, then open it. The detail route is read from the link's own href — the GMR
     * detail URL shape is not hard-coded. Returns false if no GMR card appears.
     */
    async openGmrDetailFromTab(): Promise<boolean> {
        await this.gmrDetailsTab.click();
        if (!await this.waitForRecordCard(this.gmrDetailsTab, this.gmrViewLink, GMR_VIEW_TIMEOUT)) {
            return false;
        }
        const href = await this.gmrViewLink.first().getAttribute('href');
        await this.gmrViewLink.first().click();
        if (href) {
            const route = href.split('#')[0].replace(/\/+$/, '');
            await this.page.waitForURL(
                url => url.pathname.replace(/\/+$/, '') === route,
                { timeout: NAV_TIMEOUT }
            );
        }
        return true;
    }

}