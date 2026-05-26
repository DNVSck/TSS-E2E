import { MovementOverviewPage } from "../page-object/movement-overview-page";
import { GmrDeclarePage } from "../page-object/gmr-declare-page";
import { GmrDetailsPage } from "../page-object/gmr-details-page";
import { ReportLog } from '../core/report/report-log';
import { GmrData } from "../test-data/gmr-data";

export class AddNewGMRFlow {

    constructor(
        private readonly movementOverviewPage: MovementOverviewPage,
        private readonly gmrDeclarePage: GmrDeclarePage,
        private readonly gmrDetailsPage: GmrDetailsPage
    ) {}

    async addNewGmrAndSubmit(input: GmrData): Promise<void> {
        await this.goToCreateNewGMR();
        await this.chooseRouteId(input);
        await this.finishGMRCreation();
        await this.submitGMR();
    }

    private async goToCreateNewGMR(): Promise<void> {
        await ReportLog.step('Navigate to GMR tab at Movement Overview Page and click on Create GMR button', async () => {
            await this.movementOverviewPage.navigateToGmrTabAndClickOnCreateGMR();
        });
    }

    private async chooseRouteId(input: GmrData): Promise<void> {
        await ReportLog.step(`Select Route ID for GMR Details:`, async () => {
            await this.gmrDeclarePage.selectRouteId(input.route_id);
        });
    }

    private async finishGMRCreation(): Promise<void> {
        await ReportLog.step('Click Finish Button at "GMR Check your answer page"', async () => {
            await this.gmrDetailsPage.clickFinishButton();
        });
    }

    private async submitGMR(): Promise<void> {
        await ReportLog.step('Submit GMR', async () => {
            await this.gmrDetailsPage.submitGMR();
        });
    }
}