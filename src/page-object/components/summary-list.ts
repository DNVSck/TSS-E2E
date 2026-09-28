import { Page, Locator } from '@playwright/test';
import { GOVUK } from './govuk-selectors';

const { ROW, KEY, VALUE, ACTIONS } = GOVUK.SUMMARY_LIST;
const ACTION_LINK = `${ACTIONS} a`;

export class SummaryList {
    readonly rows: Locator;
    readonly values: Locator;
    readonly actionLinks: Locator;

    constructor(private readonly page: Page) {
        this.rows = page.locator(ROW);
        this.values = page.locator(VALUE);
        this.actionLinks = page.locator(ACTION_LINK);
    }

    // Locate a GOV.UK summary-list row's value by its label. The label is exact-matched
    // (:text-is) so e.g. "Status" is not also satisfied by a "Goods domestic status" row
    // on the same list. Callers pass the label already resolved through t(), keeping the
    // lookup locale-safe.
    valueOf(label: string): Locator {
        return this.page.locator(`${ROW}:has(dt:text-is("${label}")) ${VALUE}`);
    }

    valueOfRowWith(link: Locator): Locator {
        return this.rows.filter({ has: link }).locator(VALUE);
    }

    keysOfRowsWith(link: Locator): Locator {
        return this.rows.filter({ has: link }).locator(KEY);
    }

    changeLinkFor(field: string): Locator {
        return this.page.locator(`${ACTION_LINK}[href$='field=${field}']`);
    }
}
