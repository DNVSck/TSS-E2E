import { PaymentCardUtil } from '../core/util/payment-card-util';
import { StringUtil } from '../core/util/string-util';

/**
 * The card brands the payment journey can be paid with.
 *
 * The brand is not just a label: a gateway reads it off the card number's opening
 * digits, so the number and the brand have to agree. Keep them together - see
 * PAYMENT_CARD_NUMBER.
 */
export const PAYMENT_CARD_BRAND = {
    VISA: 'Visa',
    MASTERCARD: 'Mastercard',
} as const;

export type PaymentCardBrand = (typeof PAYMENT_CARD_BRAND)[keyof typeof PAYMENT_CARD_BRAND];

/**
 * The gateway's test card numbers.
 *
 * Fixed values, unlike everything else on the card: a gateway recognises these exact
 * numbers as test cards and would refuse a generated one. They are the same on every
 * environment, which is why they live here rather than in `.env`.
 *
 * The opening digits are what tell a gateway which brand it is holding, so the number
 * and the brand beside it have to agree: 4 is Visa, 51-55 is Mastercard. Worth knowing
 * because the two are easy to paste over each other, and a "Mastercard" test carrying a
 * Visa number passes while proving nothing about Mastercard.
 */
export const PAYMENT_CARD_NUMBER = {
    [PAYMENT_CARD_BRAND.VISA]: '4000008260000000',
    [PAYMENT_CARD_BRAND.MASTERCARD]: '5105105105105100',
} as const;

/**
 * One card, as a payment form asks for it.
 *
 * Everything except the number is generated per call. That is deliberate: the number
 * has to be a number the gateway knows, and nothing else does - so pinning the rest
 * would only invite two tests to submit identical details and blame each other when the
 * gateway deduplicates.
 */
export interface PaymentCardData {
    brand: PaymentCardBrand;
    cardNumber: string;
    /** "MM" - always a future date, see generateCardExpiry. */
    expiryMonth: string;
    /** "YY" - the last two digits, as the form prints it. */
    expiryYear: string;
    /** Three digits. */
    securityCode: string;
    /** Upper case, letters and spaces only - see generateCardholderName. */
    cardholderName: string;
    townCity: string;
}

/**
 * Build the details for one payment card.
 *
 * The expiry is TWO fields rather than one "MM/YY" string, because the screen has not
 * been built yet and neither shape can be assumed. A form with a single field joins
 * them: `${expiryMonth}/${expiryYear}`.
 */
export const paymentCard = (
    overrides?: Partial<PaymentCardData>
): PaymentCardData => {
    const brand = overrides?.brand ?? PAYMENT_CARD_BRAND.VISA;
    const expiry = PaymentCardUtil.randomExpiry();

    return {
        brand,
        cardNumber: PAYMENT_CARD_NUMBER[brand],
        expiryMonth: expiry.month,
        expiryYear: expiry.year,
        securityCode: PaymentCardUtil.randomSecurityCode(),
        cardholderName: PaymentCardUtil.randomCardholderName(),
        // No rule of this service shapes a town, so it comes straight from core.
        townCity: StringUtil.randomCity(),
        ...overrides,
    };
};

/** Pay by Visa. */
export const visaCard = (overrides?: Partial<PaymentCardData>): PaymentCardData =>
    paymentCard({ brand: PAYMENT_CARD_BRAND.VISA, ...overrides });

/** Pay by Mastercard. */
export const mastercardCard = (overrides?: Partial<PaymentCardData>): PaymentCardData =>
    paymentCard({ brand: PAYMENT_CARD_BRAND.MASTERCARD, ...overrides });
