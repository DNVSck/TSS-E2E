import { faker } from '@faker-js/faker';
import { DateTimeUtil } from '../core/util/date-time-util';
import { TRANSPORT_DOCUMENT_FORMAT, TypeOfMovementKey } from '../constant/type-of-movement-code-constant';

// Generators for values shaped by THIS service's rules - a valid arrival window, a
// transport document number a real trader would enter. They live here rather than in
// core/util because they encode domain knowledge: core stays generic enough to copy
// into another project, and knows nothing about arrivals or transport documents.
//
// Separate from the *-data.ts factories because their callers span layers: the data
// factories use one, a page object uses the other as a default.

/**
 * A valid arrival date/time for this service's forms: the current UTC (UTC+0) date
 * and time plus 30 minutes, formatted as `YYYY-MM-DDTHH:mm` for the datetime-local
 * input. The 30-minute lead keeps it safely in the future without tripping the
 * form's far-future validation.
 */
export function generateValidArrivalDate(): string {
    const arrival = new Date(Date.now() + 30 * 60 * 1000);
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
