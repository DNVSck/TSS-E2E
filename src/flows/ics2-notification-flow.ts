import { APIRequestContext } from '@playwright/test';
import { ReportLog } from '../core/report/report-log';
import { IS_ISC2_MOCK } from '../../config/environment';
import { buildIe3n03PublishBody, PUBLISH_ENDPOINT } from '../helper/api-helper';

export class Ics2NotificationFlow {
    constructor(private readonly rmq: APIRequestContext) {}

    /**
     * Publishes an IE3N03 "Authorised for Movement" message to the ICS2 exchange
     * via the RabbitMQ management HTTP API.
     *
     * Skipped where a mock ICS2 server is deployed (`ISC2_MOCK_SERVER=true`): the mock
     * issues the authorisation itself, so publishing a second one would be the test
     * standing in for a service that is already doing the job. Only an environment
     * wired to the real ICS2 needs the message built and sent from here.
     *
     * Throws if `ensMrn` is empty (i.e. the MRN poll timed out before this call),
     * since publishing an IE3N03 without a valid MRN is meaningless.
     *
     * @param ensMrn  - ENS MRN returned from completeEnsDeclarationFlow
     * @param ensN730 - transportDocumentNumber (N730) used during consignment declaration
     */
    async authoriseForMovementUnlessMocked(ensMrn: string, ensN730: string): Promise<void> {
        if (IS_ISC2_MOCK) {
            await ReportLog.step('ICS2 authorise-for-movement - skipped (mock ICS2 server)', async () => {});
            return;
        }

        await this.triggerAuthorisedForMovement(ensMrn, ensN730);
    }

    private async triggerAuthorisedForMovement(ensMrn: string, ensN730: string): Promise<void> {
        if (!ensMrn) {
            throw new Error(
                'triggerAuthorisedForMovement: ensMrn is empty — ' +
                'the ENS MRN must be present before publishing the IE3N03 message.'
            );
        }

        await ReportLog.step('Trigger IE3N03 Authorised for Movement via RabbitMQ', async () => {
            const response = await this.rmq.post(PUBLISH_ENDPOINT, {
                data: buildIe3n03PublishBody(ensMrn, ensN730),
            });

            ReportLog.setParameter('IE3N03 HTTP status', String(response.status()));

            if (!response.ok()) {
                throw new Error(
                    `IE3N03 publish failed with status ${response.status()}: ${await response.text()}`
                );
            }
        });
    }
}
