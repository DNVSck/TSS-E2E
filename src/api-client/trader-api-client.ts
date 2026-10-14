import { APIRequestContext, APIResponse } from '@playwright/test';
import { BaseApiClient } from './base-api-client';
import { ServerErrorSink } from '../core/report/service-error-recorder';
import { StringUtil } from '../core/util/string-util';
import { ACT_AS_PARAM } from '../constant/trader-api/trader-api-request-constant';
import {
    TRADER_API_SUCCESS_STATUS, TRADER_API_RESULT_ERROR,
} from '../constant/trader-api/trader-api-response-constant';

const ERROR_BODY_LIMIT = 500;

export interface TraderApiResult {
    status?: string;
    process_message?: string;
    reference?: string;
}

/**
 * The Trader API's one client: it owns the connection and the envelope, and nothing
 * about any resource.
 *
 * Every response is wrapped - `{ "result": { ... } }` - and a refusal is reported
 * INSIDE it as status "error" with the reason in process_message, so a caller that only
 * checked the HTTP code would read a refusal as a success. Unwrapping happens here so
 * no service can forget it.
 *
 * The services above compose this rather than extend it: a movement service is not a
 * kind of HTTP client, and inheriting one would hand every resource a transport it has
 * no business touching.
 */
export class TraderApiClient extends BaseApiClient {
    private representedCompanyId?: string;

    constructor(request: APIRequestContext, serverErrors?: ServerErrorSink) {
        super(request, serverErrors);
    }

    async whileRepresenting<T>(companyId: string | undefined, work: () => Promise<T>): Promise<T> {
        if (!companyId) {
            return work();
        }

        const previous = this.representedCompanyId;
        this.representedCompanyId = companyId;

        try {
            return await work();
        } finally {
            this.representedCompanyId = previous;
        }
    }

    async send<T extends TraderApiResult>(
        path: string,
        body: Record<string, unknown>,
        call: string
    ): Promise<T> {
        return this.resultOf<T>(await this.post(this.asRepresented(path), body), call);
    }

    async read<T extends TraderApiResult>(path: string, call: string): Promise<T> {
        return this.resultOf<T>(await this.get(this.asRepresented(path)), call);
    }

    private asRepresented(path: string): string {
        if (!this.representedCompanyId) {
            return path;
        }

        const separator = path.includes('?') ? '&' : '?';
        return `${path}${separator}${ACT_AS_PARAM}=${encodeURIComponent(this.representedCompanyId)}`;
    }

    private async resultOf<T extends TraderApiResult>(
        response: APIResponse,
        call: string
    ): Promise<T> {
        if (response.status() !== TRADER_API_SUCCESS_STATUS) {
            throw new Error(
                `${call}: the Trader API answered ${response.status()} `
                + `${response.statusText()}, and it answers ${TRADER_API_SUCCESS_STATUS} on every `
                + `success - a create included. Something about the endpoint has changed.`
            );
        }

        const body = await response.json() as { result?: T };
        const result = body.result;

        if (!result) {
            throw new Error(
                `${call}: the Trader API answered ${response.status()} without a "result" `
                + `object, so there is nothing to read: `
                + `${StringUtil.truncate(JSON.stringify(body), ERROR_BODY_LIMIT)}`
            );
        }

        if (result.status === TRADER_API_RESULT_ERROR) {
            throw new Error(
                `${call}: the Trader API refused it with HTTP ${response.status()} - `
                + `${result.process_message ?? 'no message given'}`
            );
        }

        return result;
    }
}


export function requiredField<T extends TraderApiResult, K extends keyof T & string>(
    result: T,
    field: K,
    call: string
): NonNullable<T[K]> {
    const value = result[field];

    if (!value) {
        throw new Error(
            `${call}: the Trader API accepted the call but its reply carried no `
            + `"${field}", so there is nothing for the caller to go on.`
        );
    }

    return value;
}
