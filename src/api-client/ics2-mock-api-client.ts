import { APIRequestContext } from '@playwright/test';
import { BaseApiClient } from './base-api-client';
import { ServerErrorSink } from '../core/report/service-error-recorder';

/**
 * Where an ICS2 notification is published, and under what routing.
 *
 * Owned here rather than beside the payload builder: these three say WHERE a message
 * goes, which is the client's business - the same division that keeps a route in a
 * client and a locator in a page object.
 */
const ICS2_EXCHANGE = 'ics2-exchange';
const ICS2_ROUTING_KEY = 'portal.ics2.notification';

/**
 * The default vhost, percent-encoded. RabbitMQ names it "/" and the management API
 * puts it in the path, so it has to arrive escaped or the path splits in two.
 */
const DEFAULT_VHOST = '%2F';

const PUBLISH_PATH = `api/exchanges/${DEFAULT_VHOST}/${ICS2_EXCHANGE}/publish`;

/**
 * ICS2, reached by publishing to its exchange through the RabbitMQ management HTTP API.
 *
 * A mock in the sense that matters here - the suite is standing in for a service the
 * portal expects to hear from. It sends what it is given and reports the outcome by
 * throwing; it does not build the message and does not decide when one is due.
 */
export class Ics2MockApiClient extends BaseApiClient {
    constructor(request: APIRequestContext, serverErrors?: ServerErrorSink) {
        super(request, serverErrors);
    }

    /**
     * Publish one notification to the ICS2 exchange.
     *
     * The routing envelope is added here rather than by the builder, because it is
     * addressing rather than content - the same message published to another exchange
     * is the same message.
     */
    async publishNotification(message: Record<string, unknown>): Promise<void> {
        await this.post(PUBLISH_PATH, {
            vhost: '/',
            name: ICS2_EXCHANGE,
            routing_key: ICS2_ROUTING_KEY,
            ...message,
        });
    }
}
