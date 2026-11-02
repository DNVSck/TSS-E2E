import { APIRequestContext } from '@playwright/test';
import { BaseApiClient } from './base-api-client';
import { ServerErrorSink } from '../core/report/service-error-recorder';

const ARRIVAL_NOTIFICATION_PATH = 'customs/declarations/arrival-notification';
const XML_V1 = 'application/vnd.hmrc.1.0+xml';

export class HmrcApiClient extends BaseApiClient {
    constructor(request: APIRequestContext, serverErrors?: ServerErrorSink) {
        super(request, serverErrors);
    }

    async sendArrivalNotification(xml: string, accessToken: string): Promise<void> {
        await this.post(ARRIVAL_NOTIFICATION_PATH, xml, {
            Accept: XML_V1,
            'Content-Type': 'application/xml; charset=UTF-8',
            Authorization: `Bearer ${accessToken}`,
        });
    }
}
