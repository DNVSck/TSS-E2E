import { ConsignmentOverviewFlow } from '../consignment/consignment-overview-flow';
import { CancelConsignmentFlow } from '../consignment/cancel-consignment-flow';
import { MovementOverviewFlow } from '../movement/movement-overview-flow';
import { DeclarationAccessFlow, RecordUrls } from '../declaration-access-flow';
import { ReportLog } from '../../core/report/report-log';


export class CancelEnsDeclarationFlow {
    constructor(
        private readonly consignmentOverviewFlow: ConsignmentOverviewFlow,
        private readonly cancelConsignmentFlow: CancelConsignmentFlow,
        private readonly movementOverviewFlow: MovementOverviewFlow,
        private readonly declarationAccessFlow: DeclarationAccessFlow,
    ) { }

    async cancelConsignmentAndVerifyDeclarationIsCancelled(reason: string): Promise<void> {
        await ReportLog.step('Cancel the ENS consignment and verify the declaration is cancelled', async () => {
            await this.openEnsConsignment();
            await this.cancelConsignmentFlow.cancelConsignment(reason);
            await this.cancelConsignmentFlow.verifyConsignmentIsCancelled();

            await this.declarationAccessFlow.locateMovementHeader();
            await this.movementOverviewFlow.verifyMovementStatus('status.cancelled');
        });
    }

    async cancelMovementAndVerifyDeclarationIsCancelled(reason: string): Promise<void> {
        await ReportLog.step('Cancel the movement and verify the declaration is cancelled', async () => {
            await this.declarationAccessFlow.locateMovementHeader();
            await this.movementOverviewFlow.cancelMovementDeclaration(reason);
            await this.movementOverviewFlow.verifyMovementStatus('status.cancelled');

            const { consignment } = await this.declarationAccessFlow.locateEnsConsignmentRecords();
            await this.declarationAccessFlow.openRecord(consignment);
            await this.cancelConsignmentFlow.verifyConsignmentIsCancelled();
        });
    }

    async cancelOneConsignmentAndVerifyTheOtherSurvives(options: {
        cancel: string; survives: string; reason: string;
    }): Promise<void> {
        await ReportLog.step('Cancel one consignment and verify the rest of the declaration survives', async () => {
            await this.declarationAccessFlow.openRecord(options.cancel);
            await this.cancelConsignmentFlow.cancelConsignment(options.reason);
            await this.cancelConsignmentFlow.verifyConsignmentIsCancelled();

            await this.declarationAccessFlow.openRecord(options.survives);
            await this.verifyRecordsAreStillDraft();
        });
    }

    async cancelRefusedSfdConsignmentAndVerifyItIsCancelled(reason: string): Promise<void> {
        await this.cancelRefusedConsignment(
            'Cancel the SFD consignment CDS refused and verify it is cancelled',
            () => this.declarationAccessFlow.locateSfdConsignmentRecords(),
            reason
        );
    }

    async cancelRefusedImmiConsignmentAndVerifyItIsCancelled(reason: string): Promise<void> {
        await this.cancelRefusedConsignment(
            'Cancel the IMMI consignment CDS refused and verify it is cancelled',
            () => this.declarationAccessFlow.locateImmiConsignmentRecords(),
            reason
        );
    }

    async verifyMovementCancellationCanBeDismissed(): Promise<void> {
        await ReportLog.step('Open the movement cancel screen, go back, and check nothing changed', async () => {
            await this.declarationAccessFlow.locateMovementHeader();
            await this.movementOverviewFlow.verifyCancellationCanBeDismissed('status.draft');
        });
    }

    async verifyCancellationNeedsAReason(): Promise<void> {
        await ReportLog.step('Verify a cancellation with no reason is refused and changes nothing', async () => {
            const { consignment } = await this.openEnsConsignment();
            await this.cancelConsignmentFlow.verifyCancellationNeedsAReason();

            await this.declarationAccessFlow.openRecord(consignment);
            await this.verifyRecordsAreStillDraft();
        });
    }

    async verifyMovementCancellationExplainsScopeAndNeedsAReason(): Promise<void> {
        await ReportLog.step('Verify the movement cancel screen explains its scope, refuses no reason, and changes nothing', async () => {
            await this.declarationAccessFlow.locateMovementHeader();
            await this.movementOverviewFlow.verifyCancellationExplainsScopeAndNeedsAReason();

            const { consignment } = await this.openEnsConsignment();
            await this.declarationAccessFlow.openRecord(consignment);
            await this.verifyRecordsAreStillDraft();
        });
    }

    private async cancelRefusedConsignment(
        step: string,
        locate: () => Promise<RecordUrls>,
        reason: string
    ): Promise<void> {
        await ReportLog.step(step, async () => {
            const { consignment } = await locate();
            await this.declarationAccessFlow.openRecord(consignment);
            await this.cancelConsignmentFlow.cancelConsignmentAndVerifyItIsCancelled(reason);
        });
    }

    private async verifyRecordsAreStillDraft(): Promise<void> {
        await this.consignmentOverviewFlow.verifyConsignmentOverviewStatus('status.draft');
        await this.consignmentOverviewFlow.verifyConsignmentStillOffersActions();

        await this.declarationAccessFlow.locateMovementHeader();
        await this.movementOverviewFlow.verifyMovementStatus('status.draft');
    }

    private async openEnsConsignment(): Promise<RecordUrls> {
        await this.declarationAccessFlow.locateMovementHeader();
        return this.declarationAccessFlow.locateEnsConsignmentRecords();
    }
}
