import { expect } from '@playwright/test';
import { ScpPaymentPage } from '../../page-object/scp-payment-page';
import { PaymentsPage } from '../../page-object/payments-page';
import { PaymentCardData, visaCard } from '../../test-data/payment-card-data';
import { ReportLog } from '../../core/report/report-log';
import { BASE_URL } from '../../../config/environment';
import { STANDALONE_DECLARATION_ROUTE } from '../../constant/endpoints-constant';

export class CompletePaymentFlow {
    constructor(
        private readonly scpPaymentPage: ScpPaymentPage,
        private readonly paymentsPage: PaymentsPage,
    ) { }

    async completeTssDdaPayment(options: { lrn: string; card?: PaymentCardData }): Promise<void> {
        await this.executePayment(options.lrn, options.card ?? visaCard());

        await ReportLog.step('Return to consignment overview', async () => {
            await this.paymentsPage.returnTo(
                `${BASE_URL}${STANDALONE_DECLARATION_ROUTE.overviewPath(options.lrn)}`
            );
        });
    }

    async makePendingPayment(options: { lrn: string; card?: PaymentCardData }): Promise<void> {
        const card = options.card ?? visaCard();

        await ReportLog.step('Select pending payment for LRN', async () => {
            await this.paymentsPage.returnTo(BASE_URL);
            await this.paymentsPage.openPendingPayments();
            await this.paymentsPage.searchPendingByLrn(options.lrn);
            await this.selectPendingPayment(options.lrn);
        });

        await this.executePayment(options.lrn, card);
    }

    async makeListedPendingPayment(options: { lrn: string; card?: PaymentCardData }): Promise<void> {
        await ReportLog.step('Select pending payment for LRN', async () => {
            await this.paymentsPage.waitForPendingRow(options.lrn);
            await this.selectPendingPayment(options.lrn);
        });

        await this.executePayment(options.lrn, options.card ?? visaCard());
    }

    private async selectPendingPayment(lrn: string): Promise<void> {
        ReportLog.addAttachment('payments page - pending tab', await this.paymentsPage.screenshotPng(), 'image/png');
        const row = await this.paymentsPage.readAndSelectRow(lrn);
        expect.soft(row.lrn, 'pending payment LRN').toBe(lrn);
        expect.soft(row.duty, 'pending payment duty').toBeTruthy();
        expect.soft(row.vat, 'pending payment VAT').toBeTruthy();
        expect.soft(row.excise, 'pending payment excise').toBeTruthy();
        expect.soft(row.total, 'pending payment total').toBeTruthy();
        expect.soft(row.status, 'pending payment status').toBeTruthy();
        await this.paymentsPage.continueToPayment();
    }

    private async executePayment(lrn: string, card: PaymentCardData): Promise<void> {
        await ReportLog.step('Enter card and billing details', async () => {
            ReportLog.addAttachment('SCP payment page', await this.paymentsPage.screenshotPng(), 'image/png');
            await this.scpPaymentPage.enterCardDetails(card);
            await this.scpPaymentPage.enterBillingDetails(card);
        });

        await ReportLog.step('Verify payment confirmation and submit', async () => {
            const confirmationLrn = await this.scpPaymentPage.readConfirmationLrn();
            expect.soft(confirmationLrn, 'confirmation page LRN').toBe(lrn);
            await this.scpPaymentPage.confirmPayment();
        });

        await ReportLog.step('Complete 3DS authentication', async () => {
            await this.scpPaymentPage.authenticate3ds();
        });

        await ReportLog.step('Verify completed payment record', async () => {
            await this.scpPaymentPage.returnToPendingPayments();
            await this.paymentsPage.openCompletedTab();
            await this.paymentsPage.searchCompletedByLrn(lrn);
            const row = await this.paymentsPage.readPaymentRow();
            expect.soft(row.duty, 'completed payment duty').toBeTruthy();
            expect.soft(row.vat, 'completed payment VAT').toBeTruthy();
            expect.soft(row.excise, 'completed payment excise').toBeTruthy();
            expect.soft(row.total, 'completed payment total').toBeTruthy();
            expect.soft(row.mrn, 'completed payment MRN').toBeTruthy();
        });
    }
}
