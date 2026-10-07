import { AddNewGMRFlow } from './add-new-gmr-flow';
import { GmrOverviewFlow } from './gmr-overview-flow';
import { TriggerGmrStatusThroughGvmsFlow } from './trigger-gmr-status-through-gvms-flow';
import { GmrData } from '../../test-data/gmr-data';
import { ReportLog } from '../../core/report/report-log';
import { MovementOverviewFlow } from '../movement/movement-overview-flow';
import { DeclarationAccessFlow } from '../declaration-access-flow';

export class CancelGmrFlow {
    constructor(
        private readonly addNewGmrFlow: AddNewGMRFlow,
        private readonly gmrOverviewFlow: GmrOverviewFlow,
        private readonly triggerGmrStatusThroughGvmsFlow: TriggerGmrStatusThroughGvmsFlow,
        private readonly movementOverviewFlow: MovementOverviewFlow,
        private readonly declarationAccessFlow: DeclarationAccessFlow,
    ) { }

    async verifyDraftGmrIsCancelledWithItsMovement(input: GmrData, reason: string): Promise<void> {
        await ReportLog.step('Cancel the movement and verify its draft GMR is cancelled with it', async () => {
            await this.addNewGmrFlow.addNewGmrDraft(input);
            const draft = this.gmrOverviewFlow.locateGmrRecordHere();

            await this.declarationAccessFlow.locateMovementHeader();
            await this.movementOverviewFlow.cancelMovementDeclaration(reason);
            await this.movementOverviewFlow.verifyMovementStatus('status.cancelled');

            await this.gmrOverviewFlow.verifyGmrStatusAt(
                draft, 'status.cancelled', 'after its movement was cancelled'
            );
        });
    }

    async verifyMovementTakesOneLiveGmrAtATime(input: GmrData): Promise<void> {
        await ReportLog.step('Cancel the draft GMR and raise another on the same movement', async () => {
            await this.gmrOverviewFlow.verifyCreateGmrIsOffered(true, 'before any GMR exists');

            await this.addNewGmrFlow.addNewGmrDraft(input);
            const draft = this.gmrOverviewFlow.locateGmrRecordHere();
            await this.gmrOverviewFlow.verifyCreateGmrIsOffered(false, 'while a draft GMR is live');

            await this.gmrOverviewFlow.cancelGmr(draft);
            await this.gmrOverviewFlow.verifyCreateGmrIsOffered(true, 'once the draft GMR is cancelled');

            await this.addNewGmrFlow.addNewGmrAndSubmit(input);
        });
    }

    async verifyOpenGmrCancelsOnceGvmsAccepts(input: GmrData): Promise<void> {
        await ReportLog.step('Cancel the open GMR and have GVMS accept it', async () => {
            const gmrReference = await this.addNewGmrFlow.addNewGmrAndSubmit(input);
            const record = this.gmrOverviewFlow.locateGmrRecordHere();
            await this.gmrOverviewFlow.verifyCreateGmrIsOffered(false, 'while an open GMR is live');

            await this.gmrOverviewFlow.cancelGmr(record);
            await this.gmrOverviewFlow.verifyGmrStatusAt(
                record, 'status.pendingCancellation', 'after the trader cancelled it'
            );

            await this.triggerGmrStatusThroughGvmsFlow
                .acceptGmrCancellationThroughGvms(gmrReference, record);
            await this.gmrOverviewFlow.verifyCreateGmrIsOffered(
                true, 'once GVMS accepted the cancellation'
            );
        });
    }
}
