import { Page, Locator, expect } from '@playwright/test';
import { PaymentCardData } from '../test-data/payment-card-data';
import { TFunction } from '../fixtures/locale-fixture';
import { BasePage } from './base-page';

const SCP_LOAD_TIMEOUT = 60_000;
const THREE_DS_TIMEOUT = 60_000;

export class ScpPaymentPage extends BasePage {
    private readonly cardNumber: Locator;
    private readonly expiryMonth: Locator;
    private readonly expiryYear: Locator;
    private readonly securityCode: Locator;
    private readonly cardContinueButton: Locator;

    private readonly cardholderName: Locator;
    private readonly townCity: Locator;
    private readonly billingContinueButton: Locator;

    private readonly confirmationLrn: Locator;
    private readonly confirmationAmount: Locator;
    private readonly makePaymentButton: Locator;

    private readonly threeDsAuthButton: Locator;

    private readonly paymentSuccessHeading: Locator;
    private readonly returnToPendingPaymentsLink: Locator;

    constructor(page: Page, t: TFunction) {
        super(page, t);
        this.cardNumber = page.locator('#scp_cardPage_cardNumber_input');
        this.expiryMonth = page.locator('#scp_cardPage_expiryDate_input');
        this.expiryYear = page.locator('#scp_cardPage_expiryDate_input2');
        this.securityCode = page.locator('#scp_cardPage_csc_input');
        this.cardContinueButton = page.locator('#scp_cardPage_buttons_continue_button');

        this.cardholderName = page.locator('#scp_tdsv2AdditionalInfoPage_cardholderName_input');
        this.townCity = page.locator('#scp_tdsv2AdditionalInfoPage_city_input');
        this.billingContinueButton = page.locator('#scp_additionalInformationForm input[name="_eventId_continue"]');

        this.confirmationLrn = this.confirmationTableCell(t('scp.tssReferenceHeader'));
        this.confirmationAmount = this.confirmationTableCell(t('scp.amountDueHeader'));
        this.makePaymentButton = page.locator('#scp_confirmationPage_buttons_payment_button');

        this.threeDsAuthButton = page
            .frameLocator('#scp_threeDSecure_iframe')
            .locator('#authenticateSubmit');

        this.paymentSuccessHeading = page.getByRole('heading', { name: t('scp.paymentSuccessful') });
        this.returnToPendingPaymentsLink = page.getByRole('link', { name: t('scp.returnToPendingPayments') });
    }

    async enterCardDetails(card: PaymentCardData): Promise<void> {
        await expect(this.cardNumber).toBeVisible({ timeout: SCP_LOAD_TIMEOUT });
        await this.cardNumber.fill(card.cardNumber);
        await this.expiryMonth.fill(card.expiryMonth);
        await this.expiryYear.fill(card.expiryYear);
        await this.securityCode.fill(card.securityCode);
        await this.cardContinueButton.click();
    }

    async enterBillingDetails(card: PaymentCardData): Promise<void> {
        await expect(this.cardholderName).toBeVisible({ timeout: SCP_LOAD_TIMEOUT });
        await this.cardholderName.fill(card.cardholderName);
        await this.townCity.fill(card.townCity);
        await this.billingContinueButton.click();
    }

    async readConfirmationLrn(): Promise<string> {
        await expect(this.confirmationLrn).toBeVisible({ timeout: SCP_LOAD_TIMEOUT });
        return (await this.confirmationLrn.innerText()).trim();
    }

    async readConfirmationAmount(): Promise<string> {
        return (await this.confirmationAmount.innerText()).trim();
    }

    async confirmPayment(): Promise<void> {
        await expect(this.makePaymentButton).toBeVisible({ timeout: SCP_LOAD_TIMEOUT });
        await this.makePaymentButton.click();
    }

    async authenticate3ds(): Promise<void> {
        await expect(this.threeDsAuthButton).toBeVisible({ timeout: THREE_DS_TIMEOUT });
        await this.threeDsAuthButton.click();
        await expect(this.paymentSuccessHeading).toBeVisible({ timeout: THREE_DS_TIMEOUT });
    }

    async returnToPendingPayments(): Promise<void> {
        await this.returnToPendingPaymentsLink.click();
    }

    private confirmationTableCell(headerText: string): Locator {
        return this.page.locator(
            `xpath=//table[contains(@class,'scp_purchase_details')]//tbody/tr/td` +
            `[count(ancestor::table//thead/tr/th[normalize-space(.)='${headerText}']/preceding-sibling::th)+1]`,
        );
    }
}
