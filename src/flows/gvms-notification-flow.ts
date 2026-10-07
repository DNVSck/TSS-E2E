import { GvmsMockApiClient } from '../api-client/gvms-mock-api-client';
import { ReportLog } from '../core/report/report-log';
import { reportAttempts } from '../helper/report-helper';
import { IS_GVMS_MOCK_AVAILABLE } from '../../config/environment';
import {
    buildGvmsNotification, GmrIdentity, GvmsStateMessage,
} from '../test-data/payload/gvms-notification-payload';

/**
 * Makes GVMS say something about a GMR.
 *
 * A flow, so it is where the reporting and the decisions live: the client only sends
 * and signs, the payload builder only states facts, and this decides whether an update
 * is due at all and refuses to send one that names no GMR.
 *
 * Which state to send is the caller's choice, passed in as a row of GVMS_STATE, so a
 * new GVMS state needs nothing here:
 *
 *     await gvmsNotificationFlow.sendStateUpdate(GVMS_STATE.CHECKED_IN, gmr);
 *
 * There is no wait in here, and that is deliberate: the precondition is expressed by
 * HAVING the GMR's GVMS identity, which the portal only carries once GVMS has answered
 * for it - so an empty one fails loudly below rather than being papered over by a timer.
 */
export class GvmsNotificationFlow {
    constructor(private readonly gvmsMockApiClient: GvmsMockApiClient) { }

    /**
     * Push one GVMS status update back to the portal.
     *
     * Skipped where no push secret is configured: without it the callback refuses every
     * body, and an environment wired to the real GVMS has nothing to stand in for.
     */
    async sendStateUpdate(state: GvmsStateMessage, gmr: GmrIdentity | undefined): Promise<void> {
        if (!IS_GVMS_MOCK_AVAILABLE) {
            await ReportLog.step(
                `GVMS ${state.name} - skipped (no GVMS push secret configured)`,
                async () => { }
            );
            return;
        }

        this.assertIdentified(state, gmr);

        const body = buildGvmsNotification(state, gmr);

        await ReportLog.step(`GVMS reports ${state.name} for GMR ${gmr.gmrId}`, async () => {
            reportAttempts(`GVMS ${state.name}`, await this.gvmsMockApiClient.sendGmrNotification(body));
        });
    }

    /**
     * Refuse to send an update for a GMR that has not been identified.
     *
     * An empty boxId means the portal has no subscription to deliver to, and an empty
     * gmrId means GVMS has not seen the GMR yet. Either way the callback would accept
     * the push and discard it, leaving the test to fail later on a status that never
     * moved - a failure that says nothing about the real cause.
     */
    private assertIdentified(
        state: GvmsStateMessage,
        gmr: GmrIdentity | undefined
    ): asserts gmr is GmrIdentity {
        if (!gmr) {
            throw new Error(
                `Cannot report ${state.name}: the journey generated no GMR to report on.`
            );
        }

        const missing = (['gmrId', 'boxId'] as const).filter(key => !gmr[key]);

        if (missing.length > 0) {
            throw new Error(
                `Cannot report ${state.name}: ${missing.join(' and ')} is empty. Both are read `
                + `from the Portal API's answer for the GMR, and they arrive only once GVMS `
                + `has replied to it - so the GMR has to be submitted and settled first.`
            );
        }
    }
}
