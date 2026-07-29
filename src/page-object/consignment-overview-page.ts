import { BasePage } from "./base-page";
import { Page, Locator, expect } from '@playwright/test';
import { TFunction } from '../fixtures/locale-fixture';
import {
    clickLinkAndWaitForRoute, switchToTabAndClickNew, summaryListValue,
    readFieldWhenVisible, readFieldIfPresent,
} from '../helper/element-helper';
import { LOCAL_REFERENCE } from '../constant/local-reference-constants';

/** The overview summary list paints a beat after the draft is created. */
const SUMMARY_READ_TIMEOUT = 20_000;
/** After submit, the status flips to "Awaiting arrival" asynchronously. */
const SUBMIT_STATUS_POLL_TIMEOUT = 60_000;

export class ConsignmentOverviewPage extends BasePage {

    // Locators. NOTE: tab links use href-based xpath (not text), reasonably stable.
    private readonly goodsRecordTab: Locator;
    private readonly headerPreviousDocumentTab: Locator;
    private readonly guaranteeTypeTab: Locator;
    private readonly holderOfAuthorisationTab: Locator;
    private readonly documentTab: Locator;
    private readonly newGoodsRecordBtn: Locator;
    private readonly newPreviousDocumentBtn: Locator;
    private readonly newHolderOfAuthorisationBtn: Locator;
    private readonly confirmAndSubmitButton: Locator;
    private readonly consignmentBreadcrumbLink: Locator;

    // Draft summary-list fields, matched by their translated label (see t()). The
    // label is exact-matched (:text-is) so "Status" is not also satisfied by the
    // "Goods domestic status" row on the same list.
    private readonly localReferenceNumber: Locator;
    private readonly status: Locator;

    constructor(page: Page, t: TFunction) {
        super(page, t);

        this.localReferenceNumber = summaryListValue(page, this.t!('common.localReferenceNumber'));
        this.status = summaryListValue(page, this.t!('common.status'));

        // ENS consignments reference starts "DEC"; standalone consignments use a
        // "GLR" reference - match either so the breadcrumb works for both.
        this.consignmentBreadcrumbLink = page.locator("//nav[contains(@class,'breadcrumb')]//a[starts-with(normalize-space(.),'DEC') or starts-with(normalize-space(.),'GLR')]");
        this.goodsRecordTab = page.locator("//a[contains(@href, '/overview/#overview-tab')]");
        this.headerPreviousDocumentTab = page.locator("//a[contains(@href, '/overview/previous-documents#overview-tab')]");
        this.guaranteeTypeTab = page.locator("//a[contains(@href, '/guarantee-type#overview-tab')]");
        this.holderOfAuthorisationTab = page.locator("//a[contains(@href, '/overview/holder-of-authorisation#overview-tab')]");

        // The goods-records list is the overview root, whose form action carries the
        // "?index" marker (named tabs post to "/<tab-name>"). Scoped by form action (a
        // URL, locale-independent) not the label — same convention as movement-overview.
        this.newGoodsRecordBtn = page.locator("form[action*='?index'] button[value='new-record']");
        // Scoped to the "Header previous documents" tab panel so it is not confused
        // with the other tabs' own "new-record" buttons.
        this.newPreviousDocumentBtn = page.locator("//form[contains(@action,'previous-documents')]//button[@value='new-record']");
        this.newHolderOfAuthorisationBtn = page.locator("//form[contains(@action,'holder-of-authorisation')]//button[@value='new-record']");
        this.documentTab = page.locator("//a[contains(@href, '/documents#overview-tab')]");
        this.confirmAndSubmitButton = page.locator("button[value='submit-consignment']");
    }


    /** Open the "New previous document" wizard from the Header previous documents tab. */
    async openNewHeaderPreviousDocument(): Promise<void> {
        await switchToTabAndClickNew(this.page,this.headerPreviousDocumentTab, this.newPreviousDocumentBtn);
    }

    /** Open the "New holder of authorisation" wizard from the Holder of authorisation tab. */
    async openNewHolderOfAuthorisation(): Promise<void> {
        await switchToTabAndClickNew(this.page,this.holderOfAuthorisationTab, this.newHolderOfAuthorisationBtn);
    }

    async openNewGoodsRecord(): Promise<void> {
        await switchToTabAndClickNew(this.page,this.goodsRecordTab, this.newGoodsRecordBtn);
    }

    /**
     * Return to the consignment overview via the "DEC…" breadcrumb, and wait until
     * the page has actually landed there. These overview routes are server
     * sub-routes, so the active page is reflected in the URL — waiting on it is a
     * more reliable "we're on the overview" signal than a bare click, which races
     * the next step's read against the paint. Reuses clickLinkAndWaitForRoute, which
     * reads the expected route from the breadcrumb's own href (so it is not hard-coded).
     */
    async goToConsignmentOverview(): Promise<void> {
        await clickLinkAndWaitForRoute(this.page, this.consignmentBreadcrumbLink);
    }

    private async getConsignmentLocalReferenceNumber(): Promise<string> {
        return readFieldWhenVisible(this.localReferenceNumber, SUMMARY_READ_TIMEOUT);
    }

    private async getConsignmentStatus(): Promise<string> {
        return readFieldWhenVisible(this.status, SUMMARY_READ_TIMEOUT);
    }

    /**
     * Soft-assert the freshly-created draft consignment — its reference opens with
     * "DEC" and its status is "Draft" — and return the reference. Both are read from
     * the consignment-overview summary list, which paints as soon as the draft is
     * created. Mirrors {@link MovementOverviewPage.assertDraftMovementOverview}: the
     * page reads and asserts, the flow reports. All checks are soft.
     */
    async assertDraftConsignment(): Promise<string> {
        const consignmentReference = await this.getConsignmentLocalReferenceNumber();
        const declarationStatus = await this.getConsignmentStatus();
        const expectedStatus = this.t!('status.draft');

        expect.soft(consignmentReference, 'Consignment reference').toMatch(LOCAL_REFERENCE.DEC_PREFIX);
        expect.soft(declarationStatus, 'Consignment status').toBe(expectedStatus);

        return consignmentReference;
    }

    async clickConfirmAndSubmit(): Promise<void> {
        await this.confirmAndSubmitButton.click();
    }

    /**
     * Soft-assert the freshly-created standalone consignment's reference and return
     * it. Each journey stamps its own prefix (IMMI "GLR", SFD "SFD", FFD "FFD"), so
     * the caller passes the one it expects - asserting the journey that actually ran,
     * not merely that some standalone reference exists. Mirrors
     * {@link assertDraftConsignment} (the ENS "DEC" variant); the status is not
     * asserted here because the standalone overview shows it only after submit.
     */
    async assertDraftStandaloneConsignment(expectedPrefix: RegExp): Promise<string> {
        const consignmentReference = await this.getConsignmentLocalReferenceNumber();
        expect.soft(consignmentReference, 'Consignment LRN').toMatch(expectedPrefix);
        return consignmentReference;
    }

    /**
     * After submit, wait for the consignment status to become "Awaiting arrival".
     * It lands asynchronously and the page does not auto-refresh, so reload until it
     * appears. Non-throwing: on timeout it returns the last-read status so the caller
     * can soft-assert (and report) it rather than the test aborting here.
     */
    async waitForStatusAwaitingArrival(): Promise<string> {
        const expected = this.t!('status.awaitingArrival');
        let status = '';
        await expect(async () => {
            status = await readFieldIfPresent(this.status);
            if (status !== expected) {
                await this.page.reload();
            }
            expect(status, 'Consignment status').toBe(expected);
        })
            .toPass({ timeout: SUBMIT_STATUS_POLL_TIMEOUT, intervals: [2_000, 3_000, 5_000] })
            .catch(() => { /* soft: return whatever was last read for the caller to report */ });

        expect.soft(status, 'Consignment status').toBe(expected);
        return status;
    }

}