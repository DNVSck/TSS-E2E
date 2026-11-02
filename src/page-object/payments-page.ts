import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from './base-page';
import { TFunction } from '../fixtures/locale-fixture';
import { PAYMENT_ROUTE } from '../constant/endpoints-constant';
import { PAYMENT_INTENT } from '../constant/consignment-action-constant';

const TABLE_LOAD_TIMEOUT = 30_000;

export interface PendingPaymentSelectionRow {
    lrn: string;
    duty: string;
    vat: string;
    excise: string;
    total: string;
    status: string;
}

export interface CompletedPaymentRow {
    duty: string;
    vat: string;
    excise: string;
    total: string;
    mrn: string;
}

export class PaymentsPage extends BasePage {
    private readonly paymentsOverviewLink: Locator;
    private readonly completedTabLink: Locator;
    private readonly lrnInput: Locator;
    private readonly searchButton: Locator;
    private readonly continueToPaymentButton: Locator;
    private readonly dutyCell: Locator;
    private readonly vatCell: Locator;
    private readonly exciseCell: Locator;
    private readonly totalCell: Locator;
    private readonly mrnCell: Locator;

    constructor(page: Page, t: TFunction) {
        super(page);
        this.paymentsOverviewLink = page.locator(`a[href$="${PAYMENT_ROUTE.PENDING}"]`);
        this.completedTabLink = page.locator(`a[href$="${PAYMENT_ROUTE.COMPLETED}"]`);
        this.lrnInput = page.locator('input#lrn');
        this.searchButton = page.getByRole('button', { name: t('common.search') });
        this.continueToPaymentButton = page.locator(`button[name="intent"][value="${PAYMENT_INTENT.PAY}"]`);
        this.dutyCell = page.locator(`span[aria-label^="${t('completedPayments.duty')}:"]`);
        this.vatCell = page.locator(`span[aria-label^="${t('completedPayments.vat')}:"]`);
        this.exciseCell = page.locator(`span[aria-label^="${t('completedPayments.excise')}:"]`);
        this.totalCell = page.locator(`span[aria-label^="${t('completedPayments.total')}:"]`);
        this.mrnCell = page.locator(`span[aria-label^="${t('completedPayments.mrn')}:"]`);
    }

    async openPendingPayments(): Promise<void> {
        await this.paymentsOverviewLink.click();
        await this.page.waitForURL(`**${PAYMENT_ROUTE.PENDING}`, { timeout: TABLE_LOAD_TIMEOUT });
        await expect(this.lrnInput).toBeVisible({ timeout: TABLE_LOAD_TIMEOUT });
    }

    async searchPendingByLrn(lrn: string): Promise<void> {
        await this.lrnInput.fill(lrn);
        await this.searchButton.click();
        await this.waitForPendingRow(lrn);
    }

    async waitForPendingRow(lrn: string): Promise<void> {
        await expect(this.page.locator('table tbody tr')).toHaveCount(1, { timeout: TABLE_LOAD_TIMEOUT });
        await expect(this.rowFor(lrn)).toBeVisible({ timeout: TABLE_LOAD_TIMEOUT });
    }

    async readAndSelectRow(lrn: string): Promise<PendingPaymentSelectionRow> {
        const row = this.rowFor(lrn);
        const cells = row.locator('td');
        const lrnText = await row.locator(`span[aria-label$="${lrn}"]`).innerText();
        const duty = await cells.nth(1).innerText();
        const vat = await cells.nth(2).innerText();
        const excise = await cells.nth(3).innerText();
        const total = await cells.nth(4).innerText();
        const status = await cells.nth(5).innerText();
        await cells.nth(0).locator('input[type="checkbox"]').click();
        return {
            lrn: lrnText.trim(),
            duty: duty.trim(),
            vat: vat.trim(),
            excise: excise.trim(),
            total: total.trim(),
            status: status.trim(),
        };
    }

    async continueToPayment(): Promise<void> {
        await this.continueToPaymentButton.click();
        await this.page.waitForURL(
            url => !url.pathname.includes(PAYMENT_ROUTE.PENDING),
            { timeout: TABLE_LOAD_TIMEOUT }
        );
    }

    async openCompletedTab(): Promise<void> {
        await this.completedTabLink.click();
        await this.page.waitForURL(`**${PAYMENT_ROUTE.COMPLETED}`, { timeout: TABLE_LOAD_TIMEOUT });
        await expect(this.lrnInput).toBeVisible({ timeout: TABLE_LOAD_TIMEOUT });
    }

    async searchCompletedByLrn(lrn: string): Promise<void> {
        await this.lrnInput.fill(lrn);
        await this.searchButton.click();
        await expect(this.dutyCell).toHaveCount(1, { timeout: TABLE_LOAD_TIMEOUT });
    }

    async readPaymentRow(): Promise<CompletedPaymentRow> {
        const duty = await this.dutyCell.innerText({ timeout: TABLE_LOAD_TIMEOUT });
        const vat = await this.vatCell.innerText();
        const excise = await this.exciseCell.innerText();
        const total = await this.totalCell.innerText();
        const mrn = await this.mrnCell.innerText();
        return { duty, vat, excise, total, mrn };
    }

    private rowFor(lrn: string): Locator {
        return this.page.locator(`tr:has(span[aria-label$="${lrn}"])`);
    }
}
