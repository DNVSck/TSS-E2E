import { APIRequestContext } from '@playwright/test';
import { BaseApiClient } from './base-api-client';

/**
 * The Portal API's one client: it owns the connection, and nothing about any resource.
 *
 * Deliberately thinner than TraderApiClient, because the two services do not answer
 * alike. The Trader API wraps every answer in a `result` envelope and reports a refusal
 * inside it, so that client has an envelope to unwrap and a refusal to catch. This one
 * answers the resource itself and says no with an HTTP code, which BaseApiClient
 * already turns into an error naming the call - so there is nothing left for a Portal
 * client to add beyond typing what came back.
 *
 * The services above compose this rather than extend it: a company-permission service
 * is not a kind of HTTP client.
 */
export class PortalApiClient extends BaseApiClient {
    constructor(request: APIRequestContext) {
        super(request);
    }

    async read<T>(path: string): Promise<T> {
        const response = await this.get(path);
        return await response.json() as T;
    }
}

/**
 * Read a permission the caller is about to decide on, and refuse a missing one.
 *
 * Not `?? false`: an absent flag is a changed contract, and defaulting it to "not
 * permitted" would quietly turn that into "the screen should not appear" - a verdict
 * nobody measured, delivered as though it had been.
 *
 * Here rather than in a service because every Portal resource answers in flags - the
 * counterpart of requiredField on the Trader API's client.
 */
export function requiredFlag(
    value: boolean | undefined,
    field: string,
    call: string
): boolean {
    if (typeof value !== 'boolean') {
        throw new TypeError(
            `${call}: the Portal API answered without "${field}", so what it permits is `
            + `unknown rather than false. The endpoint's contract has changed.`
        );
    }

    return value;
}
