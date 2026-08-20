import { APIRequestContext, APIResponse } from '@playwright/test';
import { StringUtil } from '../core/util/string-util';

/** How much of a failing response body an error message quotes. */
const ERROR_BODY_LIMIT = 500;

/**
 * Make a path relative to the service's base URL, whichever way it was written.
 *
 * Stripping the leading slash is not cosmetic. An absolute path resolves against the
 * base URL's ORIGIN and discards any path the base URL carries: RMQ_HOST is
 * https://<env>.nc-tss.uk/rmq, so "/api/exchanges/..." is sent to
 * https://<env>.nc-tss.uk/api/exchanges/... - the "/rmq" silently gone, and the server
 * answering 400. That happened on 2026-08-20 and cost a test run to find.
 *
 * The other half of the fix is in api-fixture, which ends every base URL with a slash
 * so a relative path lands under it rather than beside it. Both halves are needed, and
 * neither is guessable from the other, which is why each says so.
 */
function relativeToBase(path: string): string {
    return path.replace(/^\/+/, '');
}

/**
 * What every API client in this suite shares: it holds one APIRequestContext, and it
 * turns a non-2xx response into an error that names the call and quotes what came back.
 *
 * The counterpart of BasePage, and bounded the same way. A page object owns the
 * locators and reads for ONE screen and never asserts a business rule; a client owns
 * the calls for ONE service and never decides what a response MEANS - that stays with
 * the flow. A client also never reports: ReportLog.step lives in flows, and a client
 * that narrated itself would hang a step off every call whether or not it was a unit
 * of work worth reading.
 *
 * These are not renamed passthroughs over APIRequestContext. `get` and `post` exist
 * because they add the failure message the raw context cannot give - without it a red
 * run says "500" and every debugging session begins by reproducing the call by hand.
 * A caller that needs something this does not cover should reach for `this.request`
 * directly rather than growing a wrapper here that adds nothing.
 */
export abstract class BaseApiClient {
    protected constructor(protected readonly request: APIRequestContext) { }

    protected async post(path: string, body?: unknown): Promise<APIResponse> {
        const route = relativeToBase(path);
        const response = await this.request.post(route, body === undefined ? undefined : { data: body });
        await this.assertSucceeded('POST', route, response);
        return response;
    }

    protected async get(path: string): Promise<APIResponse> {
        const route = relativeToBase(path);
        const response = await this.request.get(route);
        await this.assertSucceeded('GET', route, response);
        return response;
    }

    /**
     * Fail loudly, with the body included.
     *
     * The body is the part worth the trouble: a mock that refuses a payload says why in
     * it, and that sentence is usually the whole diagnosis. Truncated, because a mock
     * having a bad day can answer with an HTML error page.
     */
    private async assertSucceeded(method: string, path: string, response: APIResponse): Promise<void> {
        if (response.ok()) {
            return;
        }

        throw new Error(
            `${method} ${path} failed with ${response.status()} ${response.statusText()}: `
            + StringUtil.truncate(await response.text(), ERROR_BODY_LIMIT)
        );
    }
}
