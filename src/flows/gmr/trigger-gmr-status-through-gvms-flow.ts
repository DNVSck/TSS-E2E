import { expect } from '@playwright/test';
import { GvmsNotificationFlow } from '../gvms-notification-flow';
import { GmrService } from '../../api-service/portal-api/gmr-service';
import { GmrOverviewFlow } from './gmr-overview-flow';
import {
    GVMS_STATE, GmrIdentity, GvmsStateMessage,
} from '../../test-data/payload/gvms-notification-payload';
import { TFunction, TranslationKey } from '../../fixtures/locale-fixture';
import { ReportLog } from '../../core/report/report-log';

const GVMS_ANSWERS_TIMEOUT = 120_000;

export class TriggerGmrStatusThroughGvmsFlow {
    constructor(
        private readonly gvmsNotificationFlow: GvmsNotificationFlow,
        private readonly gmrService: GmrService,
        private readonly gmrOverviewFlow: GmrOverviewFlow,
        private readonly t: TFunction,
    ) { }

    async checkInGmr(localReferenceNumber: string): Promise<void> {
        await this.reportStateAndVerify(
            localReferenceNumber, GVMS_STATE.CHECKED_IN, 'status.checkedIn'
        );
    }

    async embarkGmr(localReferenceNumber: string): Promise<void> {
        await this.reportStateAndVerify(
            localReferenceNumber, GVMS_STATE.EMBARKED, 'status.embarked'
        );
    }

    async embarkGmrForInspection(localReferenceNumber: string): Promise<void> {
        await this.reportStateAndVerify(
            localReferenceNumber, GVMS_STATE.EMBARKED_FOR_INSPECTION, 'status.embarked'
        );
    }

    async completeGmr(localReferenceNumber: string): Promise<void> {
        await this.reportStateAndVerify(
            localReferenceNumber, GVMS_STATE.COMPLETED, 'status.completed'
        );
    }

    private async reportStateAndVerify(
        localReferenceNumber: string,
        state: GvmsStateMessage,
        expectedStatusKey: TranslationKey
    ): Promise<void> {
        const gmr = await this.waitForGvmsToAnswer(localReferenceNumber);

        await this.gvmsNotificationFlow.sendStateUpdate(state, gmr);

        await this.gmrOverviewFlow.verifyGmrStatus(
            expectedStatusKey, `after GVMS reported ${state.name}`
        );

        await this.gmrOverviewFlow.verifyInspection(
            state.inspectionRequired,
            state.reportToLocations,
            `after GVMS reported ${state.name}`
        );
    }

    private async waitForGvmsToAnswer(localReferenceNumber: string): Promise<GmrIdentity> {
        return ReportLog.step(
            `Wait for GVMS to answer for GMR ${localReferenceNumber}`,
            async () => {
                let identity: GmrIdentity = { gmrId: '', boxId: '' };

                await expect.poll(async () => {
                    const summary = await this.gmrService.readGmr(localReferenceNumber);
                    identity = { gmrId: summary.gmrId, boxId: summary.gvms.boxId };

                    return identity.gmrId !== '' && identity.boxId !== '';
                }, {
                    timeout: GVMS_ANSWERS_TIMEOUT,
                    intervals: [2_000, 5_000],
                    message: `GVMS never answered for GMR ${localReferenceNumber}`,
                }).toBe(true);

                ReportLog.setParameter('GVMS box id', identity.boxId);
                return identity;
            }
        );
    }
}
