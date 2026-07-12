import { ReportLog } from '../core/report/report-log';
import { MovementOverviewPage } from "../page-object/movement-overview-page";

export class MovementOverviewFlow {
    constructor(
        private readonly movementOverviewPage: MovementOverviewPage,
    ) { }

    async verifyDraftMovementOverview(): Promise<void> {
        await ReportLog.step('Validate goods movement overview', async () => {
            const localReferenceNumber = await this.movementOverviewPage.assertDraftMovementOverview();
            ReportLog.setParameter('Movement LRN', localReferenceNumber);
            await ReportLog.info(`Movement local reference number: ${localReferenceNumber}`);
        });
    }

}
