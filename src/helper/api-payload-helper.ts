import { TRADER_API_YES, TRADER_API_NO } from '../constant/trader-api/trader-api-request-constant';

/**
 * The API is not consistent about case: a header answers "YES" and a consignment
 * answers "yes". Two named helpers keep that visible - folded into one, the next
 * person to tidy it would break the header.
 */
export function yesNo(value: boolean): string {
    return value ? TRADER_API_YES : TRADER_API_NO;
}

export function yesNoUpper(value: boolean): string {
    return yesNo(value).toUpperCase();
}

export function orNull(value: string | undefined): string | null {
    return value || null;
}
