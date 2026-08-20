import { APIRequestContext } from '@playwright/test';
import { BaseApiClient } from './base-api-client';

/**
 * Where TSS listens for what CDS has to say about a declaration. Owned here for the
 * same reason a page object owns its locators: it is the one fact about this service
 * that a caller should never have to hold.
 */
const HMRC_CALLBACK_PATH = 'hmrc-cds/hmrc-callback';

/**
 * The mock CDS, driven over its own HTTP API.
 *
 * It sends what it is given and reports the outcome by throwing - it does not build
 * the payload (that is cds-notification-payload) and does not decide when a response
 * is due (that is CdsNotificationFlow). One method today because the service exposes
 * one callback; a second endpoint becomes a second method here, not a parameter.
 */
export class CdsMockApiClient extends BaseApiClient {
    constructor(request: APIRequestContext) {
        super(request);
    }

    /** Push one CDS response to the portal. Throws unless the callback accepts it. */
    async sendDeclarationResponse(body: Record<string, unknown>): Promise<void> {
        await this.post(HMRC_CALLBACK_PATH, body);
    }
}
