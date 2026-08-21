import { faker } from '@faker-js/faker';
import { DateTimeUtil } from './date-time-util';
import { StringUtil } from './string-util';

/**
 * Details a payment card carries, generated.
 *
 * Core, not a TSS helper: none of the rules below are this service's. "A card must not
 * be expired", "a Visa or Mastercard security code is three digits", "a card form takes
 * letters and spaces" are facts about payment cards, true in any project that ever fills
 * a card form. What IS this service's - which test card numbers its gateway recognises -
 * stays in test data, beside the journey that spends them.
 *
 * Card NUMBERS are deliberately absent. A gateway only accepts the exact test numbers it
 * publishes, so generating one produces a card that every gateway refuses.
 */
export class PaymentCardUtil {

    /** The window a generated expiry falls in, in years from today. */
    private static readonly EXPIRY_YEARS_AHEAD = { min: 1, max: 4 };

    /** Digits in the security code printed on a Visa or Mastercard. */
    private static readonly SECURITY_CODE_DIGITS = 3;

    /**
     * An expiry date, as the two fields a card form asks for: "MM" and "YY".
     *
     * Always in the FUTURE, which is the whole reason this is generated rather than
     * picked at random: a gateway refuses an expired card, so a truly random month and
     * year would fail roughly half the time and read as a defect in whatever journey
     * was using it.
     *
     * The window starts a full year out, so the current month is never in range either
     * - a card expiring this month is accepted by some gateways and refused by others,
     * and a test should not sit on that line.
     */
    static randomExpiry(): { month: string; year: string } {
        const now = new Date();
        const earliest = new Date(now.getFullYear() + this.EXPIRY_YEARS_AHEAD.min, now.getMonth(), 1);
        const latest = new Date(now.getFullYear() + this.EXPIRY_YEARS_AHEAD.max, now.getMonth(), 1);

        const expiry = DateTimeUtil.generateRandomDate(earliest, latest);

        return {
            month: DateTimeUtil.formatDate(expiry, 'MM'),
            // Two digits, as a card prints it - "YY" is not a token formatDate knows,
            // and asking it for "YYYY" then slicing would be the same arithmetic with a
            // detour.
            year: String(expiry.getFullYear() % 100).padStart(2, '0'),
        };
    }

    /**
     * The security code from the back of the card - three digits.
     *
     * Three, not four: American Express prints four. Widen this the day a suite needs
     * an Amex.
     *
     * Deliberately NOT StringUtil.randomNumeric, which is the obvious-looking reuse and
     * is wrong here: it passes `allowLeadingZeros: false`, and a security code may
     * perfectly well be "047". Losing every code that opens with a zero would quietly
     * narrow what is ever sent to a gateway.
     */
    static randomSecurityCode(): string {
        return faker.string.numeric({ length: this.SECURITY_CODE_DIGITS });
    }

    /**
     * A cardholder name as it would be embossed - letters and single spaces, upper case.
     *
     * The name itself comes from StringUtil; what this adds is the rule. Generated names
     * carry apostrophes, hyphens and titles ("O'Brien", "Anne-Marie", "Dr."), and card
     * forms commonly reject them - which would fail a journey for a reason that has
     * nothing to do with what it is testing.
     *
     * StringUtil.removeSpecialChars is close but keeps digits, and a name with a digit
     * in it is no more welcome on a card form than an apostrophe.
     */
    static randomCardholderName(): string {
        return StringUtil.randomFullName()
            .toUpperCase()
            .replace(/[^A-Z ]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }
}
