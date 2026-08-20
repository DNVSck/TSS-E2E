import { Ics2MockApiClient } from '../api-client/ics2-mock-api-client';
import { ReportLog } from '../core/report/report-log';
import { IS_ISC2_MOCK } from '../../config/environment';
import { buildIe3n03Message } from '../test-data/payload/ics2-notification-payload';

/**
 * Makes ICS2 say a movement is authorised.
 *
 * A flow, so it holds the decisions and the reporting: the client only publishes, the
 * payload builder only states facts. Reshaped on 2026-08-20 to sit on Ics2MockApiClient
 * instead of driving an APIRequestContext itself - it had been posting, reading the
 * status and raising its own error, which is three jobs and the same three every other
 * service would have had to copy.
 */
export class Ics2NotificationFlow {
    constructor(private readonly ics2MockApiClient: Ics2MockApiClient) { }

    /**
     * Publishes an IE3N03 "Authorised for Movement" message to the ICS2 exchange.
     *
     * Skipped where a mock ICS2 server is deployed (`ISC2_MOCK_SERVER=true`): the mock
     * issues the authorisation itself, so publishing a second one would be the test
     * standing in for a service that is already doing the job. Only an environment
     * wired to the real ICS2 needs the message built and sent from here.
     *
     * Note the sense of that flag is the OPPOSITE of the CDS one: here a mock existing
     * means do nothing, there it means the callback can be driven at all. Two flags
     * that look alike and mean opposite things, which is why the CDS side derives its
     * gate from the token rather than adding a second boolean.
     *
     * @param ensMrn  - ENS MRN returned from completeEnsDeclarationFlow
     * @param ensN730 - transportDocumentNumber (N730) used during consignment declaration
     */
    async authoriseForMovementUnlessMocked(ensMrn: string, ensN730: string): Promise<void> {
        if (IS_ISC2_MOCK) {
            await ReportLog.step('ICS2 authorise-for-movement - skipped (mock ICS2 server)', async () => { });
            return;
        }

        await this.triggerAuthorisedForMovement(ensMrn, ensN730);
    }

    private async triggerAuthorisedForMovement(ensMrn: string, ensN730: string): Promise<void> {
        if (!ensMrn) {
            throw new Error(
                'triggerAuthorisedForMovement: ensMrn is empty - '
                + 'the ENS MRN must be present before publishing the IE3N03 message.'
            );
        }

        await ReportLog.step(
            `ICS2 authorises movement ${ensMrn} for the portal`,
            () => this.ics2MockApiClient.publishNotification(buildIe3n03Message(ensMrn, ensN730))
        );
    }
}
