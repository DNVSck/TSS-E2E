import { faker } from '@faker-js/faker';
import { DateTimeUtil } from '../core/util/date-time-util';
import { StringUtil } from '../core/util/string-util';
import { COUNTRY_CODE, CountryCode } from '../constant/country-code-dropdown-constant';
import { AUTHORISATION_TYPE_CODE, AuthorisationTypeCode } from '../constant/authorisation-type-code-constant';
import { TRANSPORT_DOCUMENT_FORMAT, TypeOfMovementKey } from '../constant/type-of-movement-code-constant';
import { WarehouseTypeCode } from '../constant/warehouse-type-constant';

// Generators for values shaped by THIS service's rules - a valid arrival window, a
// transport document number a real trader would enter. They live here rather than in
// core/util because they encode domain knowledge: core stays generic enough to copy
// into another project, and knows nothing about arrivals or transport documents.
//
// Separate from the *-data.ts factories because their callers span layers: the data
// factories use one, a page object uses the other as a default.


const ARRIVAL_LEAD_MS = 3 * 60 * 1000;
const ARRIVAL_LOOKBACK_MS = 30 * 24 * 60 * 60 * 1000;

export function generateValidArrivalDate(): string {
    const arrival = new Date(Date.now() + ARRIVAL_LEAD_MS);
    return DateTimeUtil.formatUtcDateTimeLocal(arrival);
}

/**
 * An arrival date/time in the PAST, for a movement declared as already ARRIVED.
 *
 * The mirror of generateValidArrivalDate above, and it has to be a separate function
 * rather than a sign flag: the two answer opposite questions. A pre-lodged movement has
 * not arrived yet, so its time must be ahead; an arrived one is already here, so a time
 * in the future contradicts the answer given on the wizard's first screen.
 *
 * A month back, far enough that the arrival cannot be mistaken for the run that created
 * it. That is only safe while every caller is an arrived standalone journey, because
 * that screen collects a year: on a screen without one, a month back is read against the
 * current year and lands in the FUTURE whenever the offset crosses 1 January. A caller
 * on a yearless screen must bring this value back under a day.
 */
export function generatePastArrivalDate(): string {
    const arrival = new Date(Date.now() - ARRIVAL_LOOKBACK_MS);
    return DateTimeUtil.formatUtcDateTimeLocal(arrival);
}

/**
 * A transport document number shaped like the reference a real trader would enter,
 * chosen by transport mode (defaults to Road/RoRo - the common case):
 *   Road/RoRo  CMR1234567890   Maritime  B/L987654321   Air  AWB0123456789
 *
 * The service rejects a number it has already seen, so call this per consignment
 * rather than holding on to the result.
 */
export function generateRandomTransportDocumentNumber(
    movement: TypeOfMovementKey = 'RORO_ACCOMPANIED'
): string {
    const { prefix, digits } = TRANSPORT_DOCUMENT_FORMAT[movement];
    const serial = faker.string.numeric({ length: digits });
    return `${prefix}${serial}`;
}

/**
 * ISO 6346 letter values: A is 10 and each following letter takes the next number,
 * SKIPPING every multiple of 11 (so K is 21 and L is 23, U is 32 and V is 34). The
 * gaps are what make the weighted sum below detectable, so they are derived rather
 * than typed out - a hand-written table is 26 chances to make the check digit wrong.
 */
const ISO6346_LETTER_VALUE: Record<string, number> = (() => {
    const values: Record<string, number> = {};
    let value = 10;
    for (const letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
        if (value % 11 === 0) value++;
        values[letter] = value++;
    }
    return values;
})();

/** U freight container, J detachable equipment, Z trailer or chassis. */
const ISO6346_EQUIPMENT_CATEGORIES = ['U', 'J', 'Z'];

/**
 * The ISO 6346 check digit for the first ten characters of a container number.
 *
 * Each character's value is weighted by 2^position (1, 2, 4 ... 512), the weighted
 * sum is taken modulo 11, and a result of 10 becomes 0 - that last rule is the one
 * worth stating, because without it one container in eleven gets a two-digit check
 * and the number silently becomes invalid.
 */
function iso6346CheckDigit(firstTenCharacters: string): number {
    const sum = [...firstTenCharacters].reduce((running, character, position) => {
        const value = ISO6346_LETTER_VALUE[character] ?? Number(character);
        return running + value * 2 ** position;
    }, 0);

    return (sum % 11) % 10;
}

/**
 * A container identification number valid under ISO 6346: three owner-code letters,
 * an equipment category letter, a six-digit serial, and a computed check digit.
 *
 *     MSKU 398834 8
 *     ^^^  ^      ^ check digit, derived from the ten characters before it
 *     |    equipment category
 *     owner code
 *
 * Generated per call rather than held as a fixed default: the check digit makes this
 * a self-validating field, so a typo'd or stale literal is rejected by the form - and
 * a random one that is computed rather than invented is always accepted.
 *
 * The owner code is random rather than a real operator's (MSKU, MSCU, ...). Those are
 * registered with the BIC, and borrowing one would put another company's prefix on
 * every container this suite declares.
 */
export function generateRandomContainerIdentifierNumber(): string {
    const ownerCode = faker.string.alpha({ length: 3, casing: 'upper' });
    const equipmentCategory = faker.helpers.arrayElement(ISO6346_EQUIPMENT_CATEGORIES);
    const serial = faker.string.numeric({ length: 6 });

    const withoutCheckDigit = `${ownerCode}${equipmentCategory}${serial}`;
    return `${withoutCheckDigit}${iso6346CheckDigit(withoutCheckDigit)}`;
}

/** Digits in the authorisation number the national customs authority assigns. */
const WAREHOUSE_AUTHORISATION_DIGITS = 7;

/**
 * A warehouse identifier for the "Warehouse identifier" screen: the warehouse type
 * letter, an authorisation number, and the authorising country.
 *
 *     U 1234567 GB
 *     ^ ^^^^^^^ ^^ authorising country
 *     | authorisation number assigned by the customs authority
 *     warehouse type, repeating the dropdown beside this field
 *
 * WORKING AROUND A DEFECT. The type letter is stated twice - once
 * in the screen's own dropdown and again at the front of this identifier - which is not
 * how the field is meant to work. The service currently rejects an identifier that does
 * not repeat it, so the tests repeat it. Take the prefix out when that is fixed; nothing
 * else here depends on it.
 *
 * The type is a REQUIRED argument rather than a default, because that is what keeps the
 * two fields agreeing: a caller cannot generate an identifier without saying which type
 * it belongs to, so there is no way to end up with one naming a type the dropdown does
 * not hold.
 */
export function generateRandomWarehouseIdentifier(
    warehouseType: WarehouseTypeCode,
    countryCode = 'GB'
): string {
    const authorisationNumber = faker.string.numeric({ length: WAREHOUSE_AUTHORISATION_DIGITS });
    return `${warehouseType}${authorisationNumber}${countryCode}`;
}

/** Digits in the invoice number a supplementary declaration cites. */
const INVOICE_NUMBER_DIGITS = 8;

/**
 * An invoice number for the supplementary declaration's "Enter invoice details" screen.
 *
 * Entering one has a side effect worth knowing about: the service adds an `[N935]`
 * document reference (the invoice) to the goods item by itself. Nothing needs to
 * declare that document separately.
 */
export function generateRandomInvoiceNumber(): string {
    return `INV${faker.string.numeric({ length: INVOICE_NUMBER_DIGITS })}`;
}

const UK_VAT_WEIGHTS = [8, 7, 6, 5, 4, 3, 2];
const UK_VAT_MODULUS = 97;

export function generateRandomUkVatNumber(): string {
    const body = StringUtil.randomNumeric(UK_VAT_WEIGHTS.length, UK_VAT_WEIGHTS.length);
    const weighted = [...body].reduce(
        (sum, digit, position) => sum + Number(digit) * UK_VAT_WEIGHTS[position], 0
    );
    const checkDigits = (UK_VAT_MODULUS - (weighted % UK_VAT_MODULUS)) % UK_VAT_MODULUS;
    return `${body}${String(checkDigits).padStart(2, '0')}`;
}

function plainText(value: string): string {
    return StringUtil.removeSpecialChars(value).replaceAll(/\s+/g, ' ').trim();
}

const BUSINESS_NAME_SUFFIX_DIGITS = 4;

export function generateRandomBusinessName(): string {
    const suffix = StringUtil.randomNumeric(BUSINESS_NAME_SUFFIX_DIGITS, BUSINESS_NAME_SUFFIX_DIGITS);
    return `${plainText(StringUtil.randomCompany())} ${suffix}`;
}

const TEST_EMAIL_DOMAIN = 'example.com';
const EMAIL_SUFFIX_DIGITS = 6;

export function generateRandomBusinessEmail(): string {
    const user = plainText(StringUtil.randomUsername()).replaceAll(' ', '').toLowerCase();
    const suffix = StringUtil.randomNumeric(EMAIL_SUFFIX_DIGITS, EMAIL_SUFFIX_DIGITS);
    return `${user}.${suffix}@${TEST_EMAIL_DOMAIN}`;
}

const UK_MOBILE_PREFIX = '447';
const UK_MOBILE_SUBSCRIBER_DIGITS = 9;

export function generateRandomUkPhoneNumber(): string {
    return `${UK_MOBILE_PREFIX}${StringUtil.randomNumeric(UK_MOBILE_SUBSCRIBER_DIGITS, UK_MOBILE_SUBSCRIBER_DIGITS)}`;
}

export function generateRandomStreetNumber(): string {
    return StringUtil.randomBuildingNumber();
}

export function generateRandomAddressLine(): string {
    return plainText(StringUtil.randomStreetName());
}

export function generateRandomCity(): string {
    return plainText(StringUtil.randomCity());
}

const AUTHORISATION_EORI_DIGITS = 12;
const AUTHORISATION_TIMESTAMP_LENGTH = 14;
const AUTHORISATION_SEPARATOR = {
    GB_ISSUED: 'E',
    XI_ISSUED: 'I',
    NONE: '',
} as const;

function authorisationNumber(
    country: CountryCode,
    typeCode: AuthorisationTypeCode,
    separator: string
): string {
    const eoriDigits = StringUtil.randomNumeric(AUTHORISATION_EORI_DIGITS, AUTHORISATION_EORI_DIGITS);
    const timestamp = new Date().toISOString().replaceAll(/\D/g, '').slice(0, AUTHORISATION_TIMESTAMP_LENGTH);
    return `${country}${typeCode}${eoriDigits}${separator}${timestamp}`;
}

export function generateRandomCseAuthorisationNumber(): string {
    return authorisationNumber(
        COUNTRY_CODE.UNITED_KINGDOM,
        AUTHORISATION_TYPE_CODE.CUSTOMS_SUPERVISED_EXPORTS_CSE,
        AUTHORISATION_SEPARATOR.GB_ISSUED
    );
}

export function generateRandomSdpAuthorisationNumber(): string {
    return authorisationNumber(
        COUNTRY_CODE.NORTHERN_IRELAND,
        AUTHORISATION_TYPE_CODE.SIMPLIFIED_DECLARATION_PROCEDURE_SDE,
        AUTHORISATION_SEPARATOR.XI_ISSUED
    );
}

export function generateRandomEidrAuthorisationNumber(): string {
    return authorisationNumber(
        COUNTRY_CODE.NORTHERN_IRELAND,
        AUTHORISATION_TYPE_CODE.ENTRY_IN_DECLARANTS_RECORDS_EIR,
        AUTHORISATION_SEPARATOR.XI_ISSUED
    );
}

export function generateRandomXiGuaranteeReferenceNumber(): string {
    return authorisationNumber(
        COUNTRY_CODE.NORTHERN_IRELAND,
        AUTHORISATION_TYPE_CODE.CUSTOMS_COMPREHENSIVE_GUARANTEE_CGU,
        AUTHORISATION_SEPARATOR.NONE
    );
}

const DEFERMENT_ACCOUNT_DIGITS = 7;

export function generateRandomDefermentAccountNumber(): string {
    return StringUtil.randomNumeric(DEFERMENT_ACCOUNT_DIGITS, DEFERMENT_ACCOUNT_DIGITS);
}

export function pickRandomExcept<T>(candidates: readonly T[], ...excluded: (T | undefined)[]): T {
    return faker.helpers.arrayElement(candidates.filter(candidate => !excluded.includes(candidate)));
}

export function generateRandomCountryCode(...excluded: CountryCode[]): CountryCode {
    return pickRandomExcept(Object.values(COUNTRY_CODE), ...excluded);
}

const UK_POSTCODE_INWARD_LETTERS = [...'ABDEFGHJLNPQRSTUWXYZ'];

export function generateRandomUkPostcode(): string {
    const area = faker.string.alpha({ length: 2, casing: 'upper' });
    const district = faker.string.numeric({ length: { min: 1, max: 2 }, allowLeadingZeros: false });
    const sector = faker.string.numeric({ length: 1 });
    const unit = faker.helpers.arrayElements(UK_POSTCODE_INWARD_LETTERS, 2).join('');
    return `${area}${district} ${sector}${unit}`;
}
