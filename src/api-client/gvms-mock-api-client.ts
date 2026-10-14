import { APIRequestContext } from '@playwright/test';
import { createHmac } from 'node:crypto';
import { BaseApiClient } from './base-api-client';
import { ServerErrorSink } from '../core/report/service-error-recorder';

/**
 * Where TSS listens for what GVMS has to say about a GMR. Owned here for the same
 * reason a page object owns its locators: it is the one fact about this service that a
 * caller should never have to hold.
 */
const HMRC_CALLBACK_PATH = 'hmrc-gvms/hmrc-callback';

/**
 * HMRC's push notifications are authenticated by an HMAC of the body under a shared
 * secret, hex-encoded, in this header. SHA-1 is HMRC's choice, not a preference.
 */
const SIGNATURE_HEADER = 'X-Hub-Signature';
const SIGNATURE_ALGORITHM = 'sha1';

/**
 * The mock GVMS, driven over the portal's own callback.
 *
 * It sends what it is given and reports the outcome by throwing - it does not build the
 * payload (that is gvms-notification-payload) and does not decide when an update is due
 * (that is GvmsNotificationFlow).
 *
 * What it DOES own is the signature, because signing is part of addressing rather than
 * of content: the same message sent unsigned is the same message, and is refused.
 */
export class GvmsMockApiClient extends BaseApiClient {
    /**
     * The secret arrives from the fixture, like every other client's credentials,
     * rather than being read from the config here. A client that reaches for its own
     * environment cannot be pointed at another one, and this suite already keeps that
     * wiring in one place - see api-fixture.
     */
    constructor(
        request: APIRequestContext,
        private readonly pushSecret: string,
        serverErrors?: ServerErrorSink,
    ) {
        super(request, serverErrors);
    }

    /**
     * Push one GVMS status update to the portal.
     *
     * The body is serialised HERE and sent as that exact string, which is the whole
     * reason this does not hand an object to Playwright: the signature covers the bytes
     * on the wire, so anything that re-serialises between signing and sending - a
     * different key order, a space - invalidates it, and the callback answers with a
     * refusal that says nothing about why.
     */
    async sendGmrNotification(body: Record<string, unknown>): Promise<number> {
        const raw = JSON.stringify(body);

        return this.postUntilAnswered(HMRC_CALLBACK_PATH, raw, {
            'Content-Type': 'application/json',
            [SIGNATURE_HEADER]: this.sign(raw),
        });
    }

    private sign(body: string): string {
        return createHmac(SIGNATURE_ALGORITHM, this.pushSecret).update(body, 'utf8').digest('hex');
    }
}
