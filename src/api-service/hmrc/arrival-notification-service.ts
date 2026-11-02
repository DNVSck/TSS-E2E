import { HmrcApiClient } from '../../api-client/hmrc-api-client';
import { DeclarationIdentity } from '../../test-data/payload/cds-notification-payload';
import { arrivalNotificationPayload } from '../../test-data/payload/arrival-notification-payload';

export class ArrivalNotificationService {
    constructor(
        private readonly api: HmrcApiClient,
        private readonly accessToken: () => Promise<string>,
    ) { }

    async sendArrivalNotification(declaration: DeclarationIdentity): Promise<void> {
        await this.api.sendArrivalNotification(arrivalNotificationPayload(declaration), await this.accessToken());
    }
}
