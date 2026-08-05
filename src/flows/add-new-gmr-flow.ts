import { expect } from '@playwright/test';
import { MovementOverviewPage } from "../page-object/movement-overview-page";
import { GmrDeclarePage } from "../page-object/gmr-declare-page";
import { GmrDetailsPage } from "../page-object/gmr-details-page";
import { ExternalContactDeclarePage } from "../page-object/external-contact-declare-page";
import { ReportLog } from '../core/report/report-log';
import { GmrData } from "../test-data/gmr-data";

export class AddNewGMRFlow {

    constructor(
        private readonly movementOverviewPage: MovementOverviewPage,
        private readonly gmrDeclarePage: GmrDeclarePage,
        private readonly gmrDetailsPage: GmrDetailsPage,
        private readonly externalContactDeclarePage: ExternalContactDeclarePage
    ) {}

    async addNewGmrAndSubmit(input: GmrData): Promise<void> {
        await this.returnToMovementOverview();
        await this.goToCreateNewGMR();
        await this.chooseRouteId(input);
        await this.finishGMRCreation();
        await this.declareExternalContacts(input.external_contacts_list);
        await this.verifyDraftGmr();
        await this.submitGMR();
        await this.verifyGmrOpen();
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
        });
    }

    private async finishGMRCreation(): Promise<void> {
        await ReportLog.step('Click Finish Button at "GMR Check your answer page"', async () => {
            await this.gmrDetailsPage.clickFinishButton();
        });
    }

    /**
     * The GMR overview's "External Contacts" tab, one wizard per address. A no-op on
     * an empty list, so a GMR that names no contact is unaffected.
     *
     * Same shape as the consignment overview's holder-of-authorisation and previous-
     * document tabs: switch to the tab, click its "new record" button, fill the wizard,
     * and land back on the tab for the next one.
     */
    private async declareExternalContacts(contacts: string[] = []): Promise<void> {
        if (contacts.length === 0) {
            return;
        }

        await ReportLog.step('Declare external contacts', async () => {
            for (const [index, contactEmail] of contacts.entries()) {
                await ReportLog.step(`Add external contact ${index + 1} of ${contacts.length}`, async () => {
                    await this.gmrDetailsPage.declareNewExternalContact();
                    await this.externalContactDeclarePage.addNewExternalContact(contactEmail);
                });
            }
        });
    }

    /**
     * On the GMR "Check your answers" page (after Finish, before Submit): confirm the
     * GMR is a Draft and its reference opens with "GMR". Soft checks, reported.
     */
    private async verifyDraftGmr(): Promise<void> {
        await ReportLog.step('Validate GMR is Draft with a GMR reference', async () => {
            const reference = await this.gmrDetailsPage.assertDraftGmr();
            ReportLog.setParameter('GMR reference', reference);
        });
    }

    private async submitGMR(): Promise<void> {
        await ReportLog.step('Submit GMR', async () => {
            await this.gmrDetailsPage.submitGMR();
        });
    }

    /**
     * Post-submit: submitting returns to the movement overview with the GMR tab
     * active. Open the GMR's detail, then wait until it becomes "Open" and its GMR ID
     * (opening with "GMR") has been issued. Soft checks, reported.
     */
    private async verifyGmrOpen(): Promise<void> {
        await ReportLog.step('Validate GMR is Open with a GMR ID after submit', async () => {
            const opened = await this.movementOverviewPage.openGmrDetailFromTab();
            expect.soft(opened, 'GMR detail opened').toBe(true);
            if (!opened) return;

            const { gmrId } = await this.gmrDetailsPage.waitForGmrOpen();
            ReportLog.setParameter('GMR ID', gmrId);
        });
    }
}
