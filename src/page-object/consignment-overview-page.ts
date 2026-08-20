import { ConsignmentSummaryPage } from "./consignment-summary-page";
import { Page, Locator, expect } from '@playwright/test';
import { TFunction, TranslationKey } from '../fixtures/locale-fixture';
import {
    clickLinkAndWaitForRoute, clickLinkAndWaitForNavigation, switchToTabAndClickNew, summaryListValue,
    readFieldWhenVisible, readFieldIfPresent, newRecordButton,
} from '../helper/element-helper';
import { isTraderInputRequiredConsignmentStatus } from '../helper/consignment-status-helper';
import { CONSIGNMENT_ACTION } from '../constant/consignment-action-constant';
import { StringUtil } from '../core/util/string-util';
import {
    OPEN_TAB_RECORD, RECORD_LINK, RECORD_DELETE_BUTTON,
} from './components/record-tabs';

/** The overview summary list paints a beat after the draft is created. */
const SUMMARY_READ_TIMEOUT = 20_000;

/** Deleting a record re-renders the tab in place; no navigation to wait on. */
const RECORD_DELETE_TIMEOUT = 20_000;

/** After submit, the status flips to "Awaiting arrival" asynchronously. */
const SUBMIT_STATUS_POLL_TIMEOUT = 60_000;

export class ConsignmentOverviewPage extends ConsignmentSummaryPage {

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
    private readonly openTabRecords: Locator;

    // Draft summary-list fields, matched by their translated label (see t()). The
    // label is exact-matched (:text-is) so "Status" is not also satisfied by the
    // "Goods domestic status" row on the same list.
    private readonly localReferenceNumber: Locator;
    private readonly status: Locator;
    private readonly declarationType: Locator;

    constructor(page: Page, t: TFunction) {
        super(page, t);

        this.declarationType = summaryListValue(page, this.t!('common.declarationType'));

        // The FFD standalone overview spells the row out as "... (LRN)" where every
        // other overview stops at "Local reference number", so match either rather
        // than making the caller say which journey it is on.
        this.localReferenceNumber = summaryListValue(page, this.t!('common.localReferenceNumber'))
            .or(summaryListValue(page, this.t!('common.localReferenceNumberWithLrn')));
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
        this.newGoodsRecordBtn = newRecordButton(page, '?index');
        // Scoped to the "Header previous documents" tab panel so it is not confused
        // with the other tabs' own "new-record" buttons.
        this.newPreviousDocumentBtn = newRecordButton(page, 'previous-documents');
        this.newHolderOfAuthorisationBtn = newRecordButton(page, 'holder-of-authorisation');
        this.openTabRecords = page.locator(OPEN_TAB_RECORD);
        this.documentTab = page.locator("//a[contains(@href, '/documents#overview-tab')]");
        this.confirmAndSubmitButton = page.locator(`button[value='${CONSIGNMENT_ACTION.SUBMIT}']`);
    }


    /** Open the "New previous document" wizard from the Header previous documents tab. */
    async openNewHeaderPreviousDocument(): Promise<void> {
        await switchToTabAndClickNew(this.page, this.headerPreviousDocumentTab, this.newPreviousDocumentBtn);
    }

    /** Open the "New holder of authorisation" wizard from the Holder of authorisation tab. */
    async openNewHolderOfAuthorisation(): Promise<void> {
        await switchToTabAndClickNew(this.page, this.holderOfAuthorisationTab, this.newHolderOfAuthorisationBtn);
    }

    async openNewGoodsRecord(): Promise<void> {
        await switchToTabAndClickNew(this.page, this.goodsRecordTab, this.newGoodsRecordBtn);
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

    async getDeclarationType(): Promise<string> {
        return readFieldWhenVisible(this.declarationType, SUMMARY_READ_TIMEOUT);
    }

    private async getConsignmentStatus(): Promise<string> {
        return readFieldWhenVisible(this.status, SUMMARY_READ_TIMEOUT);
    }

    /**
     * Read the freshly-created draft consignment's reference and status from the
     * summary list, which paints as soon as the draft is created.
     *
     * Reads only. Whether "DEC..." and "Draft" are the RIGHT answers is a rule about
     * the service, so the flow that asked decides it.
     */
    async readDraftConsignment(): Promise<{ consignmentReference: string; declarationStatus: string }> {
        return {
            consignmentReference: await this.getConsignmentLocalReferenceNumber(),
            declarationStatus: await this.getConsignmentStatus(),
        };
    }

    async clickConfirmAndSubmit(): Promise<void> {
        await this.confirmAndSubmitButton.click();
    }


    /**
     * The route of every GOODS ITEM this consignment lists, in page order.
     *
     * Goods-item-specific on purpose. A consignment's record types are NOT addressed
     * alike: a goods item is the consignment's route plus one segment, while a holder
     * of authorisation is ".../holder-of-authorisation/<index>/edit/start" (measured
     * 2026-08-13). An earlier version claimed one rule covered both; what it really
     * found on the authorisation tab was a hidden goods link.
     *
     * Derived from the route we are ON, never from a reference prefix: the consignment
     * is addressed "DEC..." on an ENS journey and "GLR..." on a standalone one, so a
     * prefix match would find nothing on standalone and call it recordless.
     *
     * CSS cannot express "exactly one segment deeper", hence the scan. That same test
     * excludes the consignment's own link: it leaves "/overview" behind, while a
     * record leaves "/<id>/overview".
     */
    async listGoodsItemRoutes(): Promise<string[]> {
        // Everything BEFORE "/overview", not the pathname with "/overview" trimmed off
        // the end: a tab is served at ".../overview/<tab-name>", so trimming the end
        // would leave the tab in the route and match nothing. Both shapes reduce to the
        // consignment here.
        const pathname = StringUtil.stripTrailingSlashes(new URL(this.page.url()).pathname);
        const consignmentRoute = pathname.slice(0, pathname.indexOf('/overview'));

        // :visible is load-bearing. The GOV.UK tabs component renders EVERY panel into
        // the DOM and hides the inactive ones, so an unfiltered scan returns the other
        // tabs' records too - and the first one back is then a record this tab does not
        // show, which cannot be clicked (measured 2026-08-13).
        const hrefs = await this.page.locator(`a[href*='${consignmentRoute}/']:visible`)
            .evaluateAll(links => links.map(link => link.getAttribute('href') ?? ''));

        return hrefs.filter(href =>
            /^\/[^/]+\/overview$/.test(StringUtil.stripTrailingSlashes(href).slice(consignmentRoute.length))
        );
    }

    /**
     * Open one of the consignment's goods items, by position in that list.
     *
     * By index rather than by anything the item contains, because a permission check
     * does not care WHICH item it looks at - it cares the service answers the same way
     * for every one.
     *
     * Returns false when no item is listed at that position, which an authority test
     * expects rather than treats as a broken run.
     */
    async openGoodsItem(index = 0): Promise<boolean> {
        const goodsItem = (await this.listGoodsItemRoutes())[index];

        if (!goodsItem) {
            return false;
        }

        await clickLinkAndWaitForRoute(this.page, this.page.locator(`a[href='${goodsItem}']`).first());
        return true;
    }

    /** Open the "Holder of authorisation" tab, without adding a record to it. */
    async openHolderOfAuthorisationTab(): Promise<void> {
        await clickLinkAndWaitForRoute(this.page, this.holderOfAuthorisationTab);
    }

    /**
     * Open an existing holder-of-authorisation record for editing.
     *
     * Found by the TYPE CODE it is labelled with ("[EXW] XI896458895023"), not by
     * position. The route does carry an index, and that is the trap: it makes "the first
     * record" look like a stable address when it is only the order the service rendered.
     * Measured 2026-08-19 - one consignment held an EXW and an SDE at once, so a default
     * of 0 would have opened whichever came first.
     *
     * There is no Change link on the record; the record IS the link.
     *
     * "start" is a launcher, not a destination: the service answers it with a redirect
     * to the wizard's first screen ("/edit/type-code"). So the landing cannot be
     * matched against the href, and this waits for a navigation instead - the same
     * reason a summary list's "_edit_" Change link does.
     */
    async openHolderOfAuthorisationRecord(typeCode: string): Promise<void> {
        // The bracketed label the service renders, not a bare substring: "EXW" alone
        // would also match an "EXWH" record, which is a different authorisation.
        const record = this.openTabRecords.filter({ hasText: `[${typeCode}]` });

        await clickLinkAndWaitForNavigation(this.page, record.locator(RECORD_LINK));
    }

    /**
     * Remove a holder-of-authorisation record from the open tab.
     *
     * Found by the TYPE CODE it is labelled with ("[EXW] XI896458895023"), never by
     * position. Two things rule position out: the tab can hold several authorisations at
     * once (measured 2026-08-19, an EXW and an SDE side by side), and the delete button's
     * own `value="delete:<record id>"` carries an id rather than an index - so nothing on
     * the page agrees that "the first record" means anything stable.
     *
     * Waits for that record to be gone rather than for a route: the tab re-renders in
     * place, so the address does not change and there is nothing else to wait on.
     */
    async deleteHolderOfAuthorisationRecord(typeCode: string): Promise<void> {
        // The bracketed label the service renders, not a bare substring: "EXW" alone
        // would also match an "EXWH" record, which is a different authorisation.
        const record = this.openTabRecords.filter({ hasText: `[${typeCode}]` });

        await record.locator(RECORD_DELETE_BUTTON).click();

        await expect(record).toHaveCount(0, { timeout: RECORD_DELETE_TIMEOUT });
    }

    /**
     * Read the freshly-created standalone consignment's reference and status.
     *
     * Reads only - which prefix a journey stamps (IMMI "GLR", SFD "SFD", FFD "FFD") is
     * the flow's expectation, not this page's. That separation is what lets a spec that
     * does not care about the LRN skip the check: welding it here is why the authority
     * test on a controlled SFD went red on defect 1239.
     *
     * BOTH rows are read without throwing, because either can be legitimately absent:
     * the Status row only appears once the consignment has been submitted, and the SFD
     * (controlled goods) overview is missing its LRN row outright (defect 1239).
     *
     * Which is why the wait below is not optional. These pages paint their summary list
     * a beat after load (see readFieldWhenVisible), so reading immediately cannot tell
     * "this row does not exist" from "nothing has painted yet" - it returns '' for both,
     * and the journey that really does have an LRN fails at random. Waiting for the
     * list, rather than for either row, is what makes the tolerance safe.
     *
     * And the wait is deliberately allowed to THROW. Every loaded overview has a summary
     * list, whatever rows it happens to carry, so failing here means the page is not the
     * one we think it is - a lost session, a redirect, a page that never rendered.
     * Swallowing that would report it as an empty LRN, which is exactly what the missing
     * row above looks like: one real defect and one broken run, indistinguishable.
     */
    async readDraftStandaloneConsignment(): Promise<{ consignmentReference: string; declarationStatus: string }> {
        await this.contentRows.first().waitFor({ state: 'visible', timeout: SUMMARY_READ_TIMEOUT });

        return {
            consignmentReference: await readFieldIfPresent(this.localReferenceNumber),
            declarationStatus: await readFieldIfPresent(this.status),
        };
    }


    async waitForSubmittedStatus(expectedStatusKey: TranslationKey): Promise<string> {
        const expected = this.t!(expectedStatusKey);
        let status = '';
        await expect(async () => {
            status = await readFieldIfPresent(this.status);

            // Returning without throwing ends the poll. Both cases below are settled:
            // the expected status arrived, or the consignment came to rest somewhere it
            // will not leave on its own, so no amount of reloading changes the answer.
            //
            // This is the load-bearing use of that second case: without it a rejected
            // consignment costs the full poll timeout before anyone can say so.
            if (status === expected || isTraderInputRequiredConsignmentStatus(status, this.t!)) {
                return;
            }

            await this.page.reload();
            expect(status, 'Consignment status').toBe(expected);
        })
            .toPass({ timeout: SUBMIT_STATUS_POLL_TIMEOUT, intervals: [2_000, 3_000, 5_000] })
            .catch(() => { /* the caller asserts; this only decides how long to wait */ });

        return status;
    }

}