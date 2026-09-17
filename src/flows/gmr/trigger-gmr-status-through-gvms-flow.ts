import { expect } from '@playwright/test';
import { GvmsNotificationFlow } from '../gvms-notification-flow';
import { GmrService } from '../../api-service/portal-api/gmr-service';
import { GmrOverviewFlow } from './gmr-overview-flow';
import {
    GVMS_STATE, GmrIdentity, GvmsStateMessage,
} from '../../test-data/payload/gvms-notification-payload';
import { TFunction, TranslationKey } from '../../fixtures/locale-fixture';
import { GmrMovement } from '../../test-data/gmr-journey-data';
import { ReportLog } from '../../core/report/report-log';

const GVMS_ANSWERS_TIMEOUT = 120_000;

export class TriggerGmrStatusThroughGvmsFlow {
    constructor(
        private readonly gvmsNotificationFlow: GvmsNotificationFlow,
        private readonly gmrService: GmrService,
        private readonly gmrOverviewFlow: GmrOverviewFlow,
        private readonly t: TFunction,
    ) { }

    async carryGmrToCompleted(gmrReference: string, movement: GmrMovement): Promise<void> {
        await this.verifyTransport(movement);
        await this.checkIn(gmrReference);
        await this.embark(gmrReference);
        await this.complete(gmrReference);
    }

    async carryGmrToCompletedThroughInspection(
        gmrReference: string,
        movement: GmrMovement
    ): Promise<void> {
        await this.verifyTransport(movement);
        await this.checkIn(gmrReference);
        await this.embarkForInspection(gmrReference);
        await this.complete(gmrReference);
    }

    private async verifyTransport(movement: GmrMovement): Promise<void> {
        await ReportLog.step('Validate the GMR carries the movement transport', () =>
            this.gmrOverviewFlow.verifyTransportIdentity(movement.isTrailerUnaccompanied)
        );
    }

    private async checkIn(localReferenceNumber: string): Promise<void> {
        await ReportLog.step('Check the GMR in through GVMS', () =>
            this.reportStateAndVerify(
                localReferenceNumber, GVMS_STATE.CHECKED_IN, 'status.checkedIn'
            )
        );
    }

    private async embark(localReferenceNumber: string): Promise<void> {
        await ReportLog.step('Embark the GMR through GVMS', () =>
            this.reportStateAndVerify(
                localReferenceNumber, GVMS_STATE.EMBARKED, 'status.embarked'
            )
        );
    }

    private async embarkForInspection(localReferenceNumber: string): Promise<void> {
        await ReportLog.step('Embark the GMR through GVMS and hold it for inspection', () =>
            this.reportStateAndVerify(
                localReferenceNumber, GVMS_STATE.EMBARKED_FOR_INSPECTION, 'status.embarked'
            )
        );
    }

    private async complete(localReferenceNumber: string): Promise<void> {
        await ReportLog.step('Complete the GMR through GVMS', () =>
            this.reportStateAndVerify(
                localReferenceNumber, GVMS_STATE.COMPLETED, 'status.completed'
            )
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
