import {
    SupplementaryDeclarationOverviewPage,
} from '../../page-object/supplementary-declaration-overview-page';
import { ConsignmentDetailPage } from '../../page-object/consignment-detail-page';
import { DeclarationAccessFlow } from '../declaration-access-flow';
import { ReportLog } from '../../core/report/report-log';
import { TFunction, TranslationKey } from '../../fixtures/locale-fixture';
import {
    verifyDeclarationStatus, verifySubmittedWithoutErrors, verifyRefusedWithErrors,
} from '../../helper/declaration-status-helper';

export interface LinkedSupplementaryDeclaration {
    reference: string;
    frontierLrn: string;
}

export class CancelSupplementaryDeclarationFlow {
    constructor(
        private readonly overviewPage: SupplementaryDeclarationOverviewPage,
        private readonly consignmentDetailPage: ConsignmentDetailPage,
        private readonly declarationAccessFlow: DeclarationAccessFlow,
        private readonly t: TFunction,
    ) { }

    async cancelSupplementaryDeclarationAndVerifyItIsPendingCancellation(
        reason: string,
        frontierLrn: string
    ): Promise<void> {
        await ReportLog.step('Cancel the supplementary declaration and verify it and its SFD are pending cancellation', async () => {
            await this.cancelSupplementaryDeclaration(reason);
            await this.verifyStatus('status.pendingCancellation', 'cancellation requested');
            await this.verifyLinkedSfdStatus(frontierLrn, 'status.pendingCancellation', 'cancellation requested');
        });
    }

    async verifySupplementaryDeclarationAndLinkedSfdAreCancelled(
        declaration: LinkedSupplementaryDeclaration,
        after: string
    ): Promise<void> {
        await this.verifyLinkedSfdStatus(declaration.frontierLrn, 'status.cancelled', after);

        await this.declarationAccessFlow.openDeclarationFromSearch(declaration.reference);
        await this.verifyStatus('status.cancelled', after);
    }

    async verifyCancellationCanBeDismissed(): Promise<void> {
        await this.overviewPage.openCancelDeclaration();

        await ReportLog.step('Go back without cancelling', async () => {
            await this.overviewPage.returnToRecordOverview();
            await this.verifyStatus('status.draft', 'cancellation dismissed');
        });
    }

    async verifyCancellationNeedsAReason(): Promise<void> {
        await this.overviewPage.openCancelDeclaration();

        await ReportLog.step('Confirm the cancellation with no reason', async () => {
            const errors = await this.overviewPage.confirmCancellation('');

            ReportLog.setParameter('Empty reason refused with', errors.join(' | ') || 'nothing');
            verifyRefusedWithErrors(errors, 'a cancellation with no reason');
        });
    }

    private async cancelSupplementaryDeclaration(reason: string): Promise<void> {
        await this.overviewPage.openCancelDeclaration();

        verifySubmittedWithoutErrors(
            await this.overviewPage.confirmCancellation(reason), 'the cancellation'
        );
        ReportLog.setParameter('Cancellation reason', reason);

        await this.overviewPage.returnToRecordOverview();
    }

    private async verifyStatus(statusKey: TranslationKey, after: string): Promise<void> {
        const expected = this.t(statusKey);
        const shown = await this.overviewPage.waitForStatus(statusKey);
        ReportLog.setParameter(`SD status (${after})`, shown || 'not shown');

        verifyDeclarationStatus(shown, expected, `Supplementary declaration status once ${after}`);
    }

    private async verifyLinkedSfdStatus(
        frontierLrn: string,
        statusKey: TranslationKey,
        after: string
    ): Promise<void> {
        const expected = this.t(statusKey);

        await this.declarationAccessFlow.openDeclarationFromSearch(frontierLrn);
        const shown = await this.consignmentDetailPage.waitForStatus(statusKey);
        ReportLog.setParameter(`Linked SFD status (${after})`, shown || 'not shown');

        verifyDeclarationStatus(shown, expected, `Linked SFD ${frontierLrn} status once ${after}`);
    }
}
