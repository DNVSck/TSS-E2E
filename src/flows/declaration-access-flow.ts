import { expect, TestInfo } from '@playwright/test';
import { ReportLog } from '../core/report/report-log';
import { TFunction, TranslationKey } from '../fixtures/locale-fixture';
import { MovementOverviewPage } from '../page-object/movement-overview-page';
import {
    ConsignmentDetailPage, RESUBMIT_STATUS_POLL_TIMEOUT,
} from '../page-object/consignment-detail-page';
import { PortalPage } from '../page-object/portal-page';
import { DeclarationOverviewPage } from '../page-object/declaration-overview-page';
import { ConsignmentOverviewPage } from '../page-object/consignment-overview-page';
import { ActionButton, ActionLink, BasePage } from '../page-object/base-page';
import { RecordTabs } from '../page-object/components/record-tabs';
import { SupplementaryDeclarationOverviewPage } from '../page-object/supplementary-declaration-overview-page';

/** How long a record's summary list gets to paint before we call it unreachable. */
const RECORD_RENDER_TIMEOUT = 20_000;

/** How long a heading-first page gets to paint its rows before we call it a refusal. */
const REFUSAL_CONFIRM_TIMEOUT = 10_000;

/**
 * The actions a screen will actually let this company take.
 *
 * What every permission check should ask, because the service withholds an action in
 * two different ways - hiding it, or rendering it disabled - and this is the single
 * question both answers agree on. See BasePage.listActionButtons.
 */
export const enabledActions = (access: DeclarationAccess): string[] =>
    access.buttons.filter(button => button.enabled).map(button => button.value);

/** Whether the service answered with a page instead of the record. */
export const wasRefused = (access: DeclarationAccess): boolean =>
    access.refusalHeading !== '';

/** One record tab, named by its panel id rather than its translated label. */
export interface TabAccess {
    name: string;
    access: DeclarationAccess;
}

/**
 * Where a consignment and its goods item live.
 *
 * Taken once, by the company that walked the journey, and handed to every company that
 * did not: a second session has no way to reach these records except by URL.
 */
export interface RecordUrls {
    consignment: string;
    /**
     * Absent on a screen that has no goods items of its own - the movement header, which
     * holds consignments rather than goods.
     */
    goodsItem?: string;
}

/**
 * What a declaration screen offered the company who opened it.
 *
 * Facts, not a verdict: whether the record opened, how much of it rendered, and where
 * every action it offers would lead. Turning those into "Read" or "Full" belongs to
 * AuthorityCheckFlow and the level assertions it calls, because what each level means
 * is a rule about the SERVICE, not about this page - and deciding it here would hide
 * the evidence a failure needs.
 */
export interface DeclarationAccess {
    /** Whether the record could be opened at all. */
    reachable: boolean;
    /** Summary rows rendered. The anchor any "offers nothing" check needs first. */
    rowCount: number;
    /** Where each offered action leads. Empty means the screen is read-only. */
    actionHrefs: string[];
    changeLinks: ActionLink[];
    /** Every action button rendered, and whether it can be used. */
    buttons: ActionButton[];
    /**
     * The records the open tab lists, and which of them can be OPENED.
     *
     * The permission signal in the one place a button never appears: a record's link is
     * its edit route, so a company with Read is handed the same rows as plain text. A
     * count on its own could not tell the two apart.
     */
    records: { count: number; links: string[] };
    /**
     * Where the record was opened. The handle a SECOND company needs to ask the same
     * question of the same record - it never walked the journey that built it, so
     * this URL is the only thing that identifies it across contexts.
     */
    url: string;
    /**
     * The heading the service showed INSTEAD of the record, or '' when the record
     * itself came back.
     *
     * Read rather than compared here: whether it is the refusal wording is a question
     * about the service's copy, so the spec asks it with t(). Kept as the raw text so
     * a run that met some other page reports which one.
     */
    refusalHeading: string;
}

/** What a record the service would not show looks like. */
const noAccess = (url: string): DeclarationAccess => ({
    reachable: false, rowCount: 0, actionHrefs: [], changeLinks: [], buttons: [],
    records: { count: 0, links: [] }, url, refusalHeading: '',
});

/**
 * A screen that lists a record: a summary, its actions, and its tabs.
 *
 * Narrower than BasePage on purpose. The tabs are a component the record screens
 * compose, not something every page in the suite has, so this names the two together
 * rather than pushing tabs down onto pages that have none.
 */
interface RecordPage extends BasePage {
    readonly tabs: RecordTabs;
}

/**
 * Read the action surface of whatever record page is currently open.
 *
 * Shared by every way of getting there - clicking through the journey, opening a URL
 * in this context, opening it in a second company's context - so that all three describe
 * a record the same way and a rule only has to be written once.
 *
 * Reports NOTHING to the Allure parameter table, deliberately. One party sweeping a
 * declaration reads fourteen surfaces, and a parameter per fact per surface produced
 * hundreds of rows whose names all began with the same record label - truncated in the
 * report to the same unreadable prefix - burying the few parameters that identify the
 * test at all. Every fact returned here is named by the assertions in
 * access-level-helper, which report it where it means something: on the check it failed.
 */
async function readRecordSurface(
    record: RecordPage,
    url: string
): Promise<DeclarationAccess> {
    // Whichever the service answers with - the record, or a page in its place. Racing
    // them is what keeps a refusal from costing the full content timeout.
    try {
        await record.waitForContentOrHeading(RECORD_RENDER_TIMEOUT);
    } catch {
        return { ...noAccess(url), refusalHeading: '' };
    }

    // The race can be won by a heading the RECORD itself carries - these pages paint
    // their heading before their summary list - so no rows yet is not proof of a
    // refusal. Give them a moment before concluding one; a refusal page never grows
    // rows, so this only costs time on the reads that are genuinely refused.
    if (await record.renderedRowCount() === 0) {
        await record.waitForContent(REFUSAL_CONFIRM_TIMEOUT).catch(() => { /* really refused */ });
    }

    const rowCount = await record.renderedRowCount();

    // Still nothing listed: the service answered with a page of its own.
    if (rowCount === 0) {
        const refusalHeading = await record.readPageHeading();
        return { ...noAccess(url), refusalHeading };
    }

    const changeLinks = await record.listActionLinks();
    const actionHrefs = changeLinks.map(link => link.href);
    const buttons = await record.listActionButtons();
    const records = await record.tabs.readRecords();

    return { reachable: true, rowCount, actionHrefs, changeLinks, buttons, records, url, refusalHeading: '' };
}

/**
 * Reads what a declaration lets the signed-in company DO with it.
 *
 * Separate from MovementOverviewFlow, which verifies a journey produced the right
 * declaration. This asks a different question of the same screens - who may touch
 * them - and the authority specs are its only callers.
 */
export class DeclarationAccessFlow {
    constructor(
        private readonly movementOverviewPage: MovementOverviewPage,
        private readonly consignmentDetailPage: ConsignmentDetailPage,
        private readonly portalPage: PortalPage,
        private readonly declarationOverviewPage: DeclarationOverviewPage,
        private readonly consignmentOverviewPage: ConsignmentOverviewPage,
        private readonly supplementaryDeclarationOverviewPage: SupplementaryDeclarationOverviewPage,
        // Held for the same reason the other flows hold it: comparing a status is a
        // comparison against translated text, but deciding what that status MEANS for
        // the journey is this layer's job, not a page's.
        private readonly t: TFunction,
        /**
         * Who is asking, when that is not the company the test runs as.
         *
         * A permission rule is a comparison, so one test asks the same question of the
         * same record twice, and a report that labelled both answers identically would
         * be unreadable. Left empty for the test's own company - the one every step
         * already belongs to - and set by CompanySession for a second one.
         */
        private readonly actor: string = '',
    ) { }

    /** Where the ENS consignment of the movement now open, and its goods item, live. */
    async locateEnsConsignmentRecords(): Promise<RecordUrls> {
        return this.locateRecords('ENS consignment', () =>
            this.movementOverviewPage.openEnsConsignmentDetail());
    }

    /** Where the generated SFD consignment and its goods item live. */
    async locateSfdConsignmentRecords(): Promise<RecordUrls> {
        return this.locateRecords('SFD consignment', () =>
            this.movementOverviewPage.openSfdConsignmentDetail());
    }

    /**
     * Where the movement header lives - the ENS itself, above all its consignments.
     *
     * A level up from everything else these specs ask about, and asked separately
     * because a company shut out of a consignment could still be shown the movement that
     * carries it. Reached by the breadcrumb, so the caller must be inside the movement.
     */
    async locateMovementHeader(): Promise<RecordUrls> {
        return ReportLog.step('Locate the movement header', async () => {
            await this.movementOverviewPage.returnToMovementOverview();
            return { consignment: this.movementOverviewPage.getCurrentUrl() };
        });
    }

    /** Where the generated IMMI consignment and its goods item live. */
    async locateImmiConsignmentRecords(): Promise<RecordUrls> {
        return this.locateRecords('IMMI consignment', () =>
            this.movementOverviewPage.openImmiConsignmentDetail());
    }

    /** Where the generated EIDR consignment and its goods item live. */
    async locateEidrConsignmentRecords(): Promise<RecordUrls> {
        return this.locateRecords('EIDR consignment', () =>
            this.movementOverviewPage.openEidrConsignmentDetail());
    }

    /**
     * Where the movement's GMR lives.
     *
     * Only the record itself, with no goods item: a GMR describes the vehicle, not
     * goods, so there is nothing a level down to ask about. Its record TABS are asked
     * though - see GMR_TABS - because a GMR carries four of them.
     */
    async locateGmrRecord(): Promise<RecordUrls> {
        return ReportLog.step('Locate the GMR', async () => {
            const opened = await this.movementOverviewPage.openGmrDetailFromTab();
            expect(opened, 'GMR listed on the movement').toBe(true);

            // The record itself, not the tab the browser happens to be on - see
            // gmrOverviewUrl.
            return { consignment: this.movementOverviewPage.gmrOverviewUrl() };
        });
    }

    async locateSupplementaryDeclarationRecords(): Promise<RecordUrls> {
        return ReportLog.step('Locate the supplementary declaration and its goods record', async () => {
            const consignment = this.supplementaryDeclarationOverviewPage.getCurrentUrl();
            await this.supplementaryDeclarationOverviewPage.openGoodsRecord();

            return { consignment, goodsItem: this.supplementaryDeclarationOverviewPage.getCurrentUrl() };
        });
    }

    /** The same, for a consignment already known by URL - a draft found by searching. */
    async locateRecordsAt(consignmentUrl: string): Promise<RecordUrls> {
        return this.locateRecords('consignment', () =>
            this.consignmentDetailPage.navigateToUrlDirect(consignmentUrl));
    }

    /**
     * The same, for the consignment the browser is ALREADY on - a standalone journey
     * that has just submitted leaves the record itself on screen.
     *
     * Its own method rather than the caller reading a URL off a page object: a spec that
     * orchestrates flows should not have to reach past them into a page to say "here".
     */
    async locateRecordsHere(): Promise<RecordUrls> {
        return this.locateRecordsAt(this.consignmentDetailPage.getCurrentUrl());
    }

    /** Put the browser on a record whose URL is already known. */
    async openRecord(url: string): Promise<void> {
        await this.consignmentDetailPage.navigateToUrlDirect(url);
    }

    locateConsignmentHere(): string {
        return this.consignmentDetailPage.getCurrentUrl();
    }

    /** What the company THIS flow speaks for is looking at - the name is what it adds. */
    async captureCompanyView(): Promise<Buffer> {
        return this.consignmentDetailPage.screenshotOutliningOffered();
    }

    /**
     * Verify CDS took a correction - the check for an SFD or an IMMI.
     *
     * Named for the system that judged it, because that is what decides the evidence.
     * CDS answers by moving the consignment OFF "Trader Input Required", and a rejected
     * SFD or IMMI already carries an MRN, so the status is the only thing that changed.
     *
     * Soft: the correction has already happened, and a run should report what the record
     * settled on rather than stop at it.
     *
     * Submitting returns the browser to whatever screen the journey submits from, so the
     * record is opened by URL first.
     */
    async verifyCorrectionAcceptedByCds(url: string, expectedStatusKey: TranslationKey): Promise<string> {
        return ReportLog.step('Verify the correction was accepted', async () => {
            await this.consignmentDetailPage.navigateToUrlDirect(url);
            const status = await this.consignmentDetailPage
                .waitForStatus(expectedStatusKey, RESUBMIT_STATUS_POLL_TIMEOUT);

            ReportLog.setParameter('Status after resubmit', status);

            // Why, not just what. The status alone says the correction was refused and
            // stops there; the overview carries the CDS codes that name the field, and
            // without them the next reader has to open a trace to learn that a header
            // correction left a goods-item relation unsatisfied.
            const refused = status === this.t('status.traderInputRequired');
            const reasons = refused
                ? await this.consignmentDetailPage.readValidationErrors()
                : [];

            if (reasons.length > 0) {
                ReportLog.setParameter('CDS refused it because', reasons.join(' | '));
            }

            expect.soft(status, reasons.length > 0
                ? `Consignment status after resubmission - CDS still refuses it: ${reasons.join(' | ')}`
                : 'Status after resubmit'
            ).not.toBe(this.t('status.traderInputRequired'));
            return status;
        });
    }


    /**
     * Walk to a consignment and into its first goods item, keeping both addresses.
     *
     * Done once per situation, before anybody is asked anything: every company after
     * the first arrives in a browser that has never seen this declaration, and a URL is
     * the only handle that crosses a session boundary.
     */
    private async locateRecords(
        resource: string,
        openConsignment: () => Promise<unknown>
    ): Promise<RecordUrls> {
        return ReportLog.step(`Locate the ${resource} and its goods item`, async () => {
            await openConsignment();

            // The scan below reads links off the page, so the page has to have painted
            // them. Opening a record settles the route before it settles the content, and
            // an early scan finds no goods item at all - which then reads as "this
            // consignment has none" rather than "look again in a moment".
            await this.consignmentDetailPage.waitForContent(RECORD_RENDER_TIMEOUT);
            const consignment = this.consignmentDetailPage.getCurrentUrl();

            // Thrown, not returned. Every company after this one is handed these two
            // URLs, so a goods item that was not found would quietly become a second copy
            // of the consignment URL - and every check against it would pass, on the
            // wrong record.
            if (!await this.consignmentOverviewPage.openGoodsItem()) {
                throw new Error(`The ${resource} at ${consignment} lists no goods item to open.`);
            }

            return { consignment, goodsItem: this.consignmentOverviewPage.getCurrentUrl() };
        });
    }

    /**
     * Visit every record tab of the record now open, and report what each one offers.
     *
     * The deep half of a permission check, and the half nothing else can stand in for.
     * The buttons that add and delete records do not live on the record's own screen -
     * they live inside the tabs, one route each (measured 2026-08-14: only the open
     * tab is in the DOM at all). So a company withheld everything on the front screen
     * could still be handed "New goods record" one click away, and no assertion made
     * before this one would notice.
     *
     * Ends back where it started, because the caller is usually mid-journey on this
     * record and the sweep would otherwise leave the browser on the last tab.
     */
    async readEveryTabAccess(what: string): Promise<TabAccess[]> {
        return ReportLog.step(`Check every record tab of ${this.labelFor(what)}`, async () => {
            const startedAt = this.consignmentDetailPage.getCurrentUrl();
            const routes = await this.consignmentDetailPage.tabs.listRoutes();
            const tabs: TabAccess[] = [];

            for (const route of routes) {
                await this.consignmentDetailPage.navigateToUrlDirect(new URL(route, startedAt).toString());
                const name = await this.consignmentDetailPage.tabs.readOpenTabName();
                tabs.push({
                    name,
                    access: await readRecordSurface(
                        this.consignmentDetailPage,
                        this.consignmentDetailPage.getCurrentUrl()
                    ),
                });
            }

            await this.consignmentDetailPage.navigateToUrlDirect(startedAt);
            return tabs;
        });
    }

    /**
     * Try to open a record straight by its URL, and report what the service answered.
     *
     * The other half of a "can this company see it" question, and the half that matters
     * most: a record missing from the search list is still leaked if typing its URL
     * serves it. This is what proves the service refuses rather than merely omits.
     */
    async readAccessAt(what: string, url: string): Promise<DeclarationAccess> {
        return ReportLog.step(`Open ${this.labelFor(what)} directly by URL`, async () => {
            await this.consignmentDetailPage.navigateToUrlDirect(url);
            return readRecordSurface(this.consignmentDetailPage, url);
        });
    }

    /**
     * Search the declarations overview for one reference, and report what came back.
     *
     * Reached through the portal's own "View your draft declarations" link rather
     * than by deep-linking the search URL: whether the link is even offered is part
     * of what an account is allowed to see.
     */
    async searchForDeclaration(reference: string): Promise<string[]> {
        const label = this.labelFor(`"${reference}"`);

        return ReportLog.step(`Search the declarations overview for ${label}`, async () => {
            await this.portalPage.openDraftDeclarations();
            const matches = await this.declarationOverviewPage.findDeclarationsByReference(reference);

            ReportLog.setParameter(
                `Search ${label}`,
                matches.length > 0 ? `${matches.length} result(s)` : 'no results'
            );
            return matches;
        });
    }

    /**
     * Find a declaration through the overview search and open it. Returns where it
     * landed, so a caller can come back to the same record later - by URL, and as
     * somebody else.
     */
    async openDeclarationInPortal(
        url: string,
        testInfo: TestInfo,
        reference: string
    ): Promise<string> {
        return ReportLog.step(`Open ${reference} in the portal`, async () => {
            await this.portalPage.navigateToPortal(url, testInfo);

            return this.openDeclarationFromSearch(reference);
        });
    }

    async locateDeclaration(url: string, testInfo: TestInfo, reference: string): Promise<RecordUrls> {
        return this.locateRecordsAt(await this.openDeclarationInPortal(url, testInfo, reference));
    }

    async openDeclarationFromSearch(reference: string): Promise<string> {
        return ReportLog.step(`Open declaration "${reference}" from the search results`, async () => {
            await this.portalPage.openDraftDeclarations();
            await this.declarationOverviewPage.findDeclarationsByReference(reference);
            await this.declarationOverviewPage.openDeclaration(reference);
            return this.consignmentOverviewPage.getCurrentUrl();
        });
    }


    /** Name the record AND who asked, so two companies' answers stay apart in a report. */
    private labelFor(what: string): string {
        return this.actor ? `${what} as ${this.actor}` : what;
    }
}
