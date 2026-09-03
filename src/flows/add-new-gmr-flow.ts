import { expect } from '@playwright/test';
import { MovementOverviewPage } from "../page-object/movement-overview-page";
import { GmrDeclarePage } from "../page-object/gmr-declare-page";
import { GmrDetailsPage } from "../page-object/gmr-details-page";
import { ExternalContactDeclarePage } from "../page-object/external-contact-declare-page";
import { ReportLog } from '../core/report/report-log';
import { GmrData } from "../test-data/gmr-data";
import { TFunction } from '../fixtures/locale-fixture';
import { LOCAL_REFERENCE } from '../constant/local-reference-constants';

export class AddNewGMRFlow {

    constructor(
        private readonly movementOverviewPage: MovementOverviewPage,
        private readonly gmrDeclarePage: GmrDeclarePage,
        private readonly gmrDetailsPage: GmrDetailsPage,
        private readonly externalContactDeclarePage: ExternalContactDeclarePage,
        private readonly t: TFunction,
    ) {}

    async addNewGmrAndSubmit(input: GmrData): Promise<void> {
        await this.returnToMovementOverview();
        await this.goToCreateNewGMR();
        await this.chooseRouteId(input);
        await this.finishGMRCreation();
        await this.declareExternalContacts(input.external_contacts_list);
        await this.verifyDraftGmr();
        await this.submitGMR();
        await this.verifyGmrOpen('submit');
    }

    /**
     * Change the route on a GMR that is already Open, and put it back in.
     *
     * The only row a GMR offers to change, and the only proof that a company shown a
     * Change link may actually use it: being OFFERED an edit and having one ACCEPTED
     * are different claims about a permission.
     *
     * The caller passes a route the GMR was not created with - resubmitting the same
     * answer would not show the service took an edit.
     */
    async changeRouteAndResubmit(routeId: string): Promise<string> {
        return ReportLog.step(`Change the GMR route to "${routeId}" and resubmit`, async () => {
            await this.gmrDetailsPage.changeRouteId();
            await this.gmrDeclarePage.selectRouteId(routeId);

            // "Complete and submit" on the check-your-answers screen - the same finish
            // button the creation wizard ends on.
            await this.gmrDetailsPage.clickFinishButton();

            return this.verifyGmrOpen('resubmission');
        });
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
            const { localReferenceNumber, status } = await this.gmrDetailsPage.readDraftGmr();

            expect.soft(localReferenceNumber, 'GMR local reference number')
                .toMatch(LOCAL_REFERENCE.GMR_PREFIX);
            expect.soft(status, 'GMR status').toBe(this.t('status.draft'));

            ReportLog.setParameter('GMR reference', localReferenceNumber);
            ReportLog.setParameter('GMR status (draft)', status);
        });
    }

    private async submitGMR(): Promise<void> {
        await ReportLog.step('Submit GMR', async () => {
            await this.gmrDetailsPage.submitGMR();
        });
    }

    /**
     * The GMR came back Open with its ID intact - the one verdict, whether this is the
     * first submit or a correction of an Open GMR.
     *
     * One method for both because the claim is identical and was drifting apart: the
     * first submit only reported the ID it read, while a resubmission asserted it, so
     * the journey that BUILDS a GMR was checked less than the one that edits it.
     *
     * openGmrDetailFromTab handles both arrivals: submitting returns to the movement
     * overview, correcting stays on the record, and it decides which from the URL.
     *
     * Soft: by the time this runs the service has already accepted or refused, and a
     * run should report which rather than stop at it.
     */
    private async verifyGmrOpen(stage: 'submit' | 'resubmission'): Promise<string> {
        return ReportLog.step(`Validate GMR is Open with a GMR ID after ${stage}`, async () => {
            const opened = await this.movementOverviewPage.openGmrDetailFromTab();
            expect.soft(opened, `GMR detail opened after ${stage}`).toBe(true);
            if (!opened) return '';

            const { gmrId, status } = await this.gmrDetailsPage.waitForGmrOpen();

            expect.soft(gmrId, `GMR ID after ${stage}`).toMatch(LOCAL_REFERENCE.GMR_PREFIX);
            expect.soft(status, `GMR status after ${stage}`).toBe(this.t('status.open'));

            ReportLog.setParameter('GMR ID', gmrId);
            ReportLog.setParameter(`GMR status (after ${stage})`, status);
            return status;
        });
    }
}
