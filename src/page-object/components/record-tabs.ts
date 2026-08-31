import { Page, Locator } from '@playwright/test';
import { BasePage } from '../base-page';
import { CONSIGNMENT_ACTION } from '../../constant/consignment-action-constant';

/**
 * How the tabbed record lists are built, in one place.
 *
 * Exported because two kinds of caller need the same shape and must not drift: this
 * component, which READS the records, and the overview pages, which ACT on one (open it
 * for editing, delete it). They had three copies between them - measured 2026-08-19 -
 * and a copy is how a DOM change fixes one screen and breaks another.
 */

/** The panel of the tab that is OPEN - the only one in the DOM at all. */
export const OPEN_TAB_PANEL = '.govuk-tabs__panel';

/** One rendered record, wherever it appears. */
export const TAB_RECORD = '.govuk-task-list__item';

/** One record inside the open panel - what a page addresses when it acts on a record. */
export const OPEN_TAB_RECORD = `${OPEN_TAB_PANEL} ${TAB_RECORD}`;

/**
 * A record's own link, which is its edit route. Whether a record is rendered as a link
 * or as plain text is the same permission question the buttons answer.
 */
export const RECORD_LINK = 'a.govuk-task-list__link';

/** The warning button a record carries to remove itself. */
export const RECORD_DELETE_BUTTON =
    `button[name="action"][value^="${CONSIGNMENT_ACTION.DELETE_PREFIX}"]`;

/**
 * The tabbed record lists a declaration overview carries - "Linked goods records",
 * "Holder of authorisation", "Document references" and the rest.
 *
 * A component rather than something every page inherits, the same way AgentBanner is:
 * only the consignment and goods-item overviews have these tabs, and putting them on
 * BasePage handed them to the sign-in screen and every wizard step as well.
 *
 * Each tab is its own ROUTE, not a panel the browser hides (measured 2026-08-14): only
 * the open one is in the DOM at all. So a check that every tab withholds its buttons has
 * to VISIT every tab - reading the page once would see one fifth of the answer and call
 * it the whole.
 */
export class RecordTabs extends BasePage {
    private readonly tabLinks: Locator;
    private readonly openPanel: Locator;
    /** The records listed in the open tab. */
    private readonly records: Locator;
    /**
     * The records that can be OPENED. A record's link is its edit route, so whether one
     * is rendered as a link or as plain text is the same permission question the buttons
     * answer - asked in the one place a button never appears.
     */
    private readonly recordLinks: Locator;

    constructor(page: Page) {
        super(page);

        this.tabLinks = page.locator('.govuk-tabs__list-item a');
        this.openPanel = page.locator(OPEN_TAB_PANEL);
        this.records = this.openPanel.locator(TAB_RECORD);
        this.recordLinks = this.openPanel.locator(RECORD_LINK);
    }

    /**
     * Where each tab lives. Empty on a screen that has no tabs.
     *
     * Hrefs rather than clicks, so a caller can visit them in a stable order and name one
     * in a report - and so a tab a company is not shown at all is simply missing from the
     * list, which is itself an answer.
     */
    async listRoutes(): Promise<string[]> {
        const hrefs = await this.tabLinks.evaluateAll(links =>
            links.map(link => link.getAttribute('href') ?? '')
        );
        return hrefs.filter(href => href !== '');
    }

    /**
     * Which tab is open, as its panel id's last segment ("holder-of-authorisation").
     *
     * The id, never the tab's label: labels are translated and these specs run in Welsh,
     * where every name in the expectation table would stop matching.
     *
     * The declaration type is trimmed off the end. The same tab is keyed
     * `overview.linked-goods-records` on an ENS consignment and
     * `overview.linked-goods-records/sfd` on the SFD generated from it (measured
     * 2026-08-14) - one screen, one name, so the expectation table is one table.
     */
    async readOpenTabName(): Promise<string> {
        const id = await this.openPanel.first().getAttribute('id').catch(() => null);
        const panelKey = id?.split('.').pop() ?? '';
        return panelKey.split('/')[0];
    }

    /** The records the open tab lists, and which of them can be opened. */
    async readRecords(): Promise<{ count: number; links: string[] }> {
        const count = await this.records.count();
        const links = await this.recordLinks.evaluateAll(anchors =>
            anchors.map(anchor => anchor.getAttribute('href') ?? '')
        );
        return { count, links };
    }
}
