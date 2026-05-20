import { ReportLog } from '../core/report/report-log';
import { MovementData } from "../test-data/movements-data";
import { DeclarationOverviewPage } from "../page-object/declaration-overview-page";

export class MovementOverviewFlow {
    constructor(
        private readonly declarationOverviewPage: DeclarationOverviewPage,
    ) { }

    async MovementOverview(input: MovementData
    ): Promise<void> {

        await ReportLog.step('Validate goods movement overview', async () => {
            await this.declarationOverviewPage.assertDraftMovementOverview();
        });
    }

}