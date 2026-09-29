import { Page, Locator } from '@playwright/test';
import { BasePage } from '../base-page';
import { CONSIGNMENT_ACTION } from '../../constant/consignment-action-constant';
import { hrefsOf } from '../../helper/element-helper';
import { GOVUK } from './govuk-selectors';

/**
 * How the tabbed record lists are built, in one place.
 *
 * Exported because two kinds of caller need the same shape and must not drift: this
 * component, which READS the records, and the overview pages, which ACT on one (open it
 * for editing, delete it). They had three copies between them - measured 2026-08-19 -
 * and a copy is how a DOM change fixes one screen and breaks another.
 */

/** The panel of the tab that is OPEN - the only one in the DOM at all. */
export const OPEN_TAB_PANEL = GOVUK.TABS.PANEL;

export async function waitForOpenTabPanel(page: Page, timeout: number): Promise<void> {
    await page.locator(OPEN_TAB_PANEL).filter({ visible: true }).waitFor({ state: 'visible', timeout });
}

const RECORD_SHAPES = [
    GOVUK.TASK_LIST.ITEM,
    `${GOVUK.TABLE.BODY} ${GOVUK.TABLE.ROW}`,
];

/** One rendered record, wherever it appears. */
export const TAB_RECORD = RECORD_SHAPES.join(', ');

export const OPEN_TAB_RECORD = RECORD_SHAPES
    .map(shape => `${OPEN_TAB_PANEL} ${shape}`)
    .join(', ');

/**
 * A record's own link, which is its edit route. Whether a record is rendered as a link
 * or as plain text is the same permission question the buttons answer.
 */
export const RECORD_LINK = `a${GOVUK.TASK_LIST.LINK}, ${GOVUK.TABLE.CELL} a${GOVUK.LINK}`;

/** The warning button a record carries to remove itself. */
export const RECORD_DELETE_BUTTON =
    `button[name="action"][value^="${CONSIGNMENT_ACTION.DELETE_PREFIX}"]`;

/**
 * The tabbed record lists a declaration overview carries - "Linked goods records",
 * "Holder of authorisation", "Document references" and the rest.
 *
 * A component rather than something every page inherits, the same way RepresentationBanner is:
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

        this.tabLinks = page.locator(`${GOVUK.TABS.LIST_ITEM} a`);
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
        return hrefsOf(this.tabLinks);
    }

    async readOpenTabName(): Promise<string> {
        const id = await this.openPanel.first().getAttribute('id').catch(() => null);
        const panelKey = id?.split('.').pop() ?? '';
        return panelKey.split('/')[0];
    }

    /** The records the open tab lists, and which of them can be opened. */
    async readRecords(): Promise<{ count: number; links: string[] }> {
        return { count: await this.records.count(), links: await hrefsOf(this.recordLinks) };
    }
}
