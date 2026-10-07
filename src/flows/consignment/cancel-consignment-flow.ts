import { TranslationKey } from '../../fixtures/locale-fixture';
import { ConsignmentOverviewPage } from '../../page-object/consignment-overview-page';
import { ConsignmentOverviewFlow } from './consignment-overview-flow';
import { ReportLog } from '../../core/report/report-log';
import { verifySubmittedWithoutErrors, verifyRefusedWithErrors } from '../../helper/declaration-status-helper';

export class CancelConsignmentFlow {
    constructor(
        private readonly consignmentOverviewPage: ConsignmentOverviewPage,
        private readonly consignmentOverviewFlow: ConsignmentOverviewFlow,
    ) { }

    async cancelConsignmentAndVerifyItIsCancelled(reason: string): Promise<void> {
        await ReportLog.step('Cancel the consignment and verify it is cancelled', async () => {
            await this.cancelConsignment(reason);
            await this.verifyConsignmentIsCancelled();
        });
    }

    async cancelConsignment(reason: string): Promise<void> {
        await this.openCancellation();
        await this.confirmCancellation(reason);
    }

    async verifyConsignmentIsCancelled(): Promise<void> {
        await this.consignmentOverviewFlow.verifyConsignmentOverviewStatus('status.cancelled');
        await this.consignmentOverviewFlow.verifyConsignmentOffersNoActions();
    }

    /**
     * The reason is mandatory, and enforced on the SERVER - the field carries no
     * `required` attribute, so an empty one posts and comes back refused rather than
     * being blocked in the browser.
     *
     * Opens the screen itself rather than assuming one is open: a check that depended
     * on the caller having opened it would pass or fail on call order.
     */
    async verifyCancellationNeedsAReason(): Promise<void> {
        await this.openCancellation();

        await ReportLog.step('Confirm the cancellation with no reason', async () => {
            const errors = await this.consignmentOverviewPage.confirmCancellation('');

            ReportLog.setParameter('Empty reason refused with', errors.join(' | ') || 'nothing');
            verifyRefusedWithErrors(errors, 'a cancellation with no reason');
        });
    }

    async verifyCancellationCanBeDismissed(statusKey: TranslationKey): Promise<void> {
        await this.openCancellation();

        await ReportLog.step('Go back without cancelling', async () => {
            await this.consignmentOverviewPage.returnToRecordOverview();
            await this.consignmentOverviewFlow.verifyConsignmentOverviewStatus(statusKey);
        });
    }

    private async openCancellation(): Promise<void> {
        await ReportLog.step('Open the cancel screen', async () => {
            await this.consignmentOverviewPage.goToConsignmentOverview();
            await this.consignmentOverviewPage.openCancelDeclaration();
        });
    }

    private async confirmCancellation(reason: string): Promise<void> {
        await ReportLog.step('Confirm the cancellation', async () => {
            verifySubmittedWithoutErrors(
                await this.consignmentOverviewPage.confirmCancellation(reason),
                'the cancellation'
            );
            ReportLog.setParameter('Cancellation reason', reason);
            await this.consignmentOverviewPage.returnToRecordOverview();
        });
    }
}
