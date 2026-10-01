import { expect } from '@playwright/test';
import { MovementOverviewPage } from '../../page-object/movement-overview-page';
import { GmrDeclarePage } from '../../page-object/gmr-declare-page';
import { GmrDetailsPage } from '../../page-object/gmr-details-page';
import { GmrOverviewFlow } from './gmr-overview-flow';
import { ReportLog } from '../../core/report/report-log';
import { GmrData } from '../../test-data/gmr-data';
import { TFunction } from '../../fixtures/locale-fixture';
import { LOCAL_REFERENCE } from '../../constant/local-reference-constants';
import { AccessibilityCheckpoint } from '../accessibility-audit-flow';

export class AddNewGMRFlow {

    constructor(
        private readonly movementOverviewPage: MovementOverviewPage,
        private readonly gmrDeclarePage: GmrDeclarePage,
        private readonly gmrDetailsPage: GmrDetailsPage,
        private readonly gmrOverviewFlow: GmrOverviewFlow,
        private readonly t: TFunction,
    ) { }

    async addNewGmrAndSubmit(
        input: GmrData,
        checkpoint?: AccessibilityCheckpoint
    ): Promise<string> {
        await this.returnToMovementOverview();
        await this.goToCreateNewGMR();
        await checkpoint?.('GMR - route', { probeErrors: true });
        await this.chooseRouteId(input);
        await checkpoint?.('GMR - check your answers');
        await this.finishGMRCreation();
        await this.gmrOverviewFlow.declareExternalContacts(input.external_contacts_list);
        const localReferenceNumber = await this.verifyDraftGmr();
        await this.submitGMR();
        await this.gmrOverviewFlow.verifyGmrOpen('submit');

        return localReferenceNumber;
    }

    /**
     * A GMR is created from a movement-level tab, but the preceding declaration flow
     * ends on a consignment detail page. Breadcrumb back to the movement overview
     * first, otherwise the GMR tab is not on the page to click.
     */
    private async returnToMovementOverview(): Promise<void> {
        await ReportLog.step('Return to Movement Overview (breadcrumb) before creating GMR', async () => {
            await this.movementOverviewPage.returnToMovementOverview();
        });
    }

    private async goToCreateNewGMR(): Promise<void> {
        await ReportLog.step('Navigate to GMR tab at Movement Overview Page and click on Create GMR button', async () => {
            await this.movementOverviewPage.navigateToGmrTabAndClickOnCreateGMR();
        });
    }

    private async chooseRouteId(input: GmrData): Promise<void> {
        await ReportLog.step(`Select Route ID "${input.route_id}" for GMR Details`, async () => {
            await this.gmrDeclarePage.selectRouteId(input.route_id);
            ReportLog.setParameter('GMR route', input.route_id);
        });
    }

    private async finishGMRCreation(): Promise<void> {
        await ReportLog.step('Click Finish Button at "GMR Check your answer page"', async () => {
            await this.gmrDetailsPage.clickFinishButton();
        });
    }

    /**
     * On the GMR "Check your answers" page (after Finish, before Submit): confirm the
     * GMR is a Draft and its reference opens with "GMR". Soft checks, reported.
     */
    private async verifyDraftGmr(): Promise<string> {
        return ReportLog.step('Validate GMR is Draft with a GMR reference', async () => {
            const { localReferenceNumber, status } = await this.gmrDetailsPage.readDraftGmr();

            expect.soft(localReferenceNumber, 'GMR local reference number')
                .toMatch(LOCAL_REFERENCE.GMR_PREFIX);
            expect.soft(status, 'GMR status').toBe(this.t('status.draft'));

            ReportLog.setParameter('GMR reference', localReferenceNumber);
            ReportLog.setParameter('GMR status (draft)', status);

            return localReferenceNumber;
        });
    }

    private async submitGMR(): Promise<void> {
        await ReportLog.step('Submit GMR', async () => {
            await this.gmrDetailsPage.submitGMR();
        });
    }
}
