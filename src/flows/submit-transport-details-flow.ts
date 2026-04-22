import { TransportDetailsPage } from "../page-object/transport-details-page";
import { ReportLog } from '../core/report/report-log';

export class SubmitTransportDetailsFlow {
    constructor(
        private readonly transportDetailsPage: TransportDetailsPage
    ) { }

    async submitTransportDetails(
        movementType: string
    ): Promise<void> {

        await ReportLog.step('Submit transport details', async () => {
            await this.transportDetailsPage.selectTypeOfMovement(movementType);
        });
    }
}
