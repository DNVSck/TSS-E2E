import { faker } from '@faker-js/faker';
import { DateTimeUtil } from '../core/util/date-time-util';
import { TRANSPORT_DOCUMENT_FORMAT, TypeOfMovementKey } from '../constant/type-of-movement-code-constant';
import { WarehouseTypeCode } from '../constant/warehouse-type-constant';

// Generators for values shaped by THIS service's rules - a valid arrival window, a
// transport document number a real trader would enter. They live here rather than in
// core/util because they encode domain knowledge: core stays generic enough to copy
// into another project, and knows nothing about arrivals or transport documents.
//
// Separate from the *-data.ts factories because their callers span layers: the data
// factories use one, a page object uses the other as a default.


export function generateValidArrivalDate(): string {
    const arrival = new Date(Date.now() + 30 * 60 * 1000);
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
 * Kept 30 minutes back rather than days: the screen collects day, month, hour and minute
 * but NO year, so anything far in the past is read against the current year and lands
 * somewhere nobody intended - and around 1 January it lands in the wrong one entirely.
 */
export function generatePastArrivalDate(): string {
    const arrival = new Date(Date.now() - 30 * 60 * 1000);
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
