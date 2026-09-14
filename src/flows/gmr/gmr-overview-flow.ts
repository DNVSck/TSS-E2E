import { expect } from '@playwright/test';
import { MovementOverviewPage } from '../../page-object/movement-overview-page';
import { GmrDeclarePage } from '../../page-object/gmr-declare-page';
import { GmrDetailsPage } from '../../page-object/gmr-details-page';
import { ExternalContactDeclarePage } from '../../page-object/external-contact-declare-page';
import { InspectionLocation } from '../../test-data/payload/gvms-notification-payload';
import { TFunction, TranslationKey } from '../../fixtures/locale-fixture';
import { LOCAL_REFERENCE } from '../../constant/local-reference-constants';
import { ReportLog } from '../../core/report/report-log';

export class GmrOverviewFlow {
    constructor(
        private readonly movementOverviewPage: MovementOverviewPage,
        private readonly gmrDeclarePage: GmrDeclarePage,
        private readonly gmrDetailsPage: GmrDetailsPage,
        private readonly externalContactDeclarePage: ExternalContactDeclarePage,
        private readonly t: TFunction,
    ) { }

    /**
     * The GMR overview's "External Contacts" tab, one wizard per address. A no-op on
     * an empty list, so a GMR that names no contact is unaffected.
     *
     * Same shape as the consignment overview's holder-of-authorisation and previous-
     * document tabs: switch to the tab, click its "new record" button, fill the wizard,
     * and land back on the tab for the next one.
     */
    async declareExternalContacts(contacts: string[] = []): Promise<void> {
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
     * The GMR came back Open with its ID intact - the one verdict, whether this is the
     * first submit or a correction of an Open GMR.
     *
     * One method for both because the claim is identical and was drifting apart: the
     * first submit only reported the ID it read, while a resubmission asserted it, so
     * the journey that BUILDS a GMR was checked less than the one that edits it.
     *
     * Soft: by the time this runs the service has already accepted or refused, and a
     * run should report which rather than stop at it.
     */
    async verifyGmrOpen(stage: 'submit' | 'resubmission'): Promise<string> {
        return ReportLog.step(`Validate GMR is Open with a GMR ID after ${stage}`, async () => {
            if (!await this.openRecord(`GMR detail opened after ${stage}`)) {
                return '';
            }

            const { gmrId, status } = await this.gmrDetailsPage.waitForGmrStatus('status.open');

            expect.soft(gmrId, `GMR ID after ${stage}`).toMatch(LOCAL_REFERENCE.GMR_PREFIX);
            expect.soft(status, `GMR status after ${stage}`).toBe(this.t('status.open'));

            ReportLog.setParameter('GMR ID', gmrId);
            ReportLog.setParameter(`GMR status (after ${stage})`, status);
            return status;
        });
    }

    /** The same read for any status the record can reach - see GVMS. */
    async verifyGmrStatus(expectedStatusKey: TranslationKey, because: string): Promise<string> {
        await this.openRecord(`the GMR record opened so its status can be read (${because})`);

        const { status } = await this.gmrDetailsPage.waitForGmrStatus(expectedStatusKey);

        ReportLog.setParameter(`GMR status (${because})`, status);
        expect(status, `GMR status ${because}`).toBe(this.t(expectedStatusKey));

        return status;
    }

    /**
     * The transport the GMR inherited from its movement. Accompanied movements name a
     * vehicle and unaccompanied ones a trailer, and the row that does not apply is not
     * rendered at all - so each direction asserts both the registration it expects AND
     * the absence of the other, which is what stops the check passing on a GMR that
     * carried neither.
     */
    async verifyTransportIdentity(isTrailerUnaccompanied: boolean): Promise<void> {
        const identity = await this.gmrDetailsPage.readTransportIdentity();

        ReportLog.setParameter('GMR vehicle registration', identity.vehicleRegistrationNumber);
        ReportLog.setParameter('GMR trailer registration', identity.trailerRegistrationNumber);

        const expectedRegistration = isTrailerUnaccompanied
            ? identity.trailerRegistrationNumber
            : identity.vehicleRegistrationNumber;
        const unexpectedRegistration = isTrailerUnaccompanied
            ? identity.vehicleRegistrationNumber
            : identity.trailerRegistrationNumber;
        const which = isTrailerUnaccompanied ? 'trailer' : 'vehicle';

        expect.soft(
            expectedRegistration,
            `GMR ${which} registration number (an ${isTrailerUnaccompanied ? 'unaccompanied' : 'accompanied'} movement names one)`
        ).not.toBe('');

        expect.soft(
            unexpectedRegistration,
            `GMR ${isTrailerUnaccompanied ? 'vehicle' : 'trailer'} registration number (offered to the other movement type only)`
        ).toBe('');

        expect.soft(
            identity.isTrailerUnaccompanied,
            'GMR "Is trailer unaccompanied?"'
        ).toBe(this.t(isTrailerUnaccompanied ? 'common.yes' : 'common.no'));
    }

    /**
     * What the record says about being held, and - when it is held - that every
     * location the caller was told to expect is named. The caller supplies both,
     * because whether an inspection is due is a fact about what GVMS reported rather
     * than anything this screen can decide for itself.
     */
    async verifyInspection(
        required: boolean,
        reportToLocations: readonly InspectionLocation[] = [],
        because = ''
    ): Promise<void> {
        const inspection = await this.gmrDetailsPage.readInspection();
        const suffix = because === '' ? '' : ` ${because}`;

        ReportLog.setParameter(`Inspection required${suffix}`, inspection.required);

        expect(inspection.required, `inspection required${suffix}`)
            .toBe(this.t(required ? 'common.yes' : 'common.no'));

        if (reportToLocations.length === 0) {
            return;
        }

        ReportLog.setParameter(`Report to locations${suffix}`, inspection.reportToLocations);

        for (const location of reportToLocations) {
            for (const locationId of location.locationIds) {
                expect(
                    inspection.reportToLocations,
                    `locations to report to for inspection type ${location.inspectionTypeId}`
                ).toContain(locationId);
            }
        }
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
            await this.gmrDetailsPage.clickFinishButton();

            return this.verifyGmrOpen('resubmission');
        });
    }

    /**
     * Submitting a GMR leaves a URL that still reads as the record while the page
     * rendered is the movement overview's GMR tab, so the record is opened rather than
     * assumed before anything on it is read.
     */
    private async openRecord(because: string): Promise<boolean> {
        const opened = await this.movementOverviewPage.reopenGmrDetailFromTab();

        expect.soft(opened, because).toBe(true);
        return opened;
    }
}
