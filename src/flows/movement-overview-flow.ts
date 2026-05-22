import { ReportLog } from '../core/report/report-log';
import { MovementData } from "../test-data/movements-data";
import { MovementOverviewPage } from "../page-object/movement-overview-page";

export class MovementOverviewFlow {
    constructor(
        private readonly movementOverviewPage: MovementOverviewPage,
    ) { }

    async MovementOverview(input: MovementData
    ): Promise<void> {

        await ReportLog.step('Validate goods movement overview', async () => {
            await this.movementOverviewPage.assertDraftMovementOverview();
        });
    }

}