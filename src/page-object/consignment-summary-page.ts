import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base-page';
import { TFunction } from '../fixtures/locale-fixture';
import { summaryListValue, readFieldWhenVisible } from '../helper/element-helper';

/** The summary list paints a beat after these pages load. */
const SUMMARY_READ_TIMEOUT = 20_000;

/**
 * What the consignment OVERVIEW and the consignment DETAIL pages have in common: both
 * render one consignment as a GOV.UK summary list, and some of those rows carry the
 * same meaning on either page.
 *
 * It exists so a row read on both is written once. Only rows that genuinely appear on
 * both belong here - a row one page shows and the other does not stays on the page
 * that shows it.
 *
 * The two pages still differ in almost everything else (tabs, buttons, breadcrumbs),
 * which is why this is a thin shared base rather than one merged page object.
 */
export class ConsignmentSummaryPage extends BasePage {
    /**
     * "Supervising customs office" - present only on a WAREHOUSED declaration, and
     * populated by the service rather than by any screen. See
     * requiresWarehouseIdentifier for which procedure codes produce one.
     */
    private readonly supervisingCustomsOffice: Locator;

    constructor(page: Page, t: TFunction) {
        super(page, t);
        this.supervisingCustomsOffice = summaryListValue(page, this.t!('common.supervisingCustomsOffice'));
    }

    /**
     * Soft-assert the office the service derived for a warehoused declaration, and
     * return it for the caller to report.
     *
     * Waits for the row: it is populated server-side, so unlike the rows that may be
     * legitimately absent, "not there" here means the page has not painted or the
     * declaration was not warehoused after all - and both are worth failing on rather
     * than passing an empty string up.
     */
    async assertSupervisingCustomsOffice(expectedOffice: string): Promise<string> {
        const office = await readFieldWhenVisible(this.supervisingCustomsOffice, SUMMARY_READ_TIMEOUT);
        expect.soft(office, 'Supervising customs office').toBe(expectedOffice);
        return office;
    }
}
