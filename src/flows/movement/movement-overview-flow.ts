import { expect } from '@playwright/test';
import { ReportLog } from '../../core/report/report-log';
import { MovementOverviewPage } from "../../page-object/movement-overview-page";
import { ConsignmentDetailPage, alphanumericOnly } from "../../page-object/consignment-detail-page";
import { LOCAL_REFERENCE, MRN_COUNTRY_CODE, MrnCountryCode, mrnPrefix } from '../../constant/local-reference-constants';
import { TFunction } from '../../fixtures/locale-fixture';

export class MovementOverviewFlow {
    constructor(
        private readonly movementOverviewPage: MovementOverviewPage,
        private readonly consignmentDetailPage: ConsignmentDetailPage,
        // Held for the same reason as in ConsignmentOverviewFlow: the comparison is
        // against translated text, but deciding what a terminal status means for the
        // journey belongs to this layer, not to a page.
        private readonly t: TFunction,
    ) { }

    async waitForSubmittedMovementOverview(): Promise<void> {
        await this.movementOverviewPage.waitForSubmittedMovementOverview();
    }

    async verifyDraftMovementOverview(): Promise<void> {
        await ReportLog.step('Validate goods movement overview', async () => {
            const { localReferenceNumber, declarationStatus } =
                await this.movementOverviewPage.readDraftMovementOverview();
            ReportLog.setParameter('Movement LRN', localReferenceNumber);
            ReportLog.setParameter('Movement status', declarationStatus);

            // Reported first, then judged. Asserting the string rather than a boolean so
            // a failure names the reference it actually read.
            expect.soft(localReferenceNumber, 'Local reference number')
                .toMatch(LOCAL_REFERENCE.ENS_PREFIX);
            expect.soft(declarationStatus, 'Declaration status').toBe(this.t('status.draft'));
        });
    }

    /**
     * Post-submit proof-of-life on every journey: the mock authorises the movement
     * (submit auto-returns to the movement overview), then the ENS consignment
     * detail returns an MRN opening with the ENS country code. The status reached
     * after submit is REPORTED but not asserted - which value is correct depends on
     * how far the mock has taken the declaration, so pinning one would flake. All
     * value checks are soft.
     */
    async verifyEnsConsignmentDetail(
        // Forwarded to the MRN poll. A journey submitting for the first time leaves
        // this alone: "Trader Input Required" there means the service is done and no
        // MRN is coming, and stopping on it saves the whole timeout. A caller that has
        // just RESUBMITTED a rejected consignment must pass false - that status is the
        // one being left, still on screen until the backend answers, and stopping on it
        // reports no MRN for a correction that was accepted.
        options: { traderInputIsSettled?: boolean } = {}
    ): Promise<string> {
        return ReportLog.step('Validate ENS consignment MRN after submission', async () => {
            const opened = await this.movementOverviewPage.openEnsConsignmentDetail();
            expect.soft(opened, 'ENS consignment listed').toBe(true);
            if (!opened) return '';

            const ensMrn = await this.consignmentDetailPage.waitForMovementReferenceNumber(options);
            const status = await this.consignmentDetailPage.getConsignmentStatus();
            // Report before asserting, so the values are in the report whether the
            // assertion below passes or fails.
            ReportLog.setParameter('ENS MRN', ensMrn);
            ReportLog.setParameter('ENS Consignment status (submitted)', status);

            expect.soft(ensMrn, 'ENS MRN').toMatch(mrnPrefix(MRN_COUNTRY_CODE.ENS));
            return ensMrn;
        });
    }

    /**
     * Verify the ENS consignment was REJECTED back to the trader.
     *
     * The opposite expectation to verifyEnsConsignmentDetail, and the reason it is a
     * separate method rather than a flag: the authority specs submit deliberately
     * invalid data to reach this state, so here "Trader Input Required" is the
     * precondition of the test, not its failure.
     *
     * Hard assertions, unlike the soft ones the happy-path checks use. This is the
     * spine of those tests - every permission check that follows is about a rejected
     * consignment, so if the rejection never happened the rest measures nothing and
     * should not be allowed to report a result at all.
     */
    async verifyEnsConsignmentTraderInputRequired(): Promise<string> {
        return this.verifyTraderInputRequired('ENS', () =>
            this.movementOverviewPage.openEnsConsignmentDetail()
        );
    }

    /**
     * The auto-generated SFD's own rejection - a DIFFERENT event from the ENS one
     * above, not a consequence of it. ENS submits through ICS2 and SFD through CDS,
     * so each is accepted or rejected on its own, and an ENS sitting at Trader Input
     * Required still produced an SFD that went on to CDS.
     */
    async verifySfdConsignmentTraderInputRequired(): Promise<string> {
        return this.verifyTraderInputRequired('SFD', () =>
            this.movementOverviewPage.openSfdConsignmentDetail()
        );
    }

    /**
     * The auto-generated IMMI's own rejection. The same CDS refusal the SFD can meet -
     * an authorisation naming a party that does not hold it - reached by the other
     * journey, so the authority tests can ask their questions of an IMMI as well.
     */
    async verifyImmiConsignmentTraderInputRequired(): Promise<string> {
        return this.verifyTraderInputRequired('IMMI', () =>
            this.movementOverviewPage.openImmiConsignmentDetail()
        );
    }

    private async verifyTraderInputRequired(
        label: string,
        openDetail: () => Promise<boolean>
    ): Promise<string> {
        return ReportLog.step(`Verify the ${label} consignment was rejected back to the trader`, async () => {
            const opened = await openDetail();
            expect(opened, `${label} consignment listed`).toBe(true);

            const status = await this.consignmentDetailPage.waitForStatus('status.traderInputRequired');
            // Reported before the assertion, so a run that reached some other status
            // still carries the one it reached.
            ReportLog.setParameter(`${label} Consignment status (submitted)`, status);
            expect(status, `${label} consignment status`).toBe(this.t('status.traderInputRequired'));

            return status;
        });
    }

    /**
     * SFD-journey only: submitting an SFD consignment auto-generates a linked SFD
     * consignment. Check it exists and its MRN opens with the GB country code - softly, so
     * both are reported - then assert HARD that it reached "Awaiting arrival", because
     * nothing the journey does next works without an authorisation.
     */
    async verifySfdConsignmentDetail(): Promise<void> {
        await this.verifyAutoGeneratedConsignment(
            'SFD',
            () => this.movementOverviewPage.openSfdConsignmentDetail(),
            MRN_COUNTRY_CODE.SFD
        );
    }

    /**
     * IMMI-journey only: like SFD, submitting auto-generates a linked IMMI
     * consignment. Check it exists and its MRN opens with the GB country code - softly, so
     * both are reported - then assert HARD that it reached "Awaiting arrival", because
     * nothing the journey does next works without an authorisation.
     */
    async verifyImmiConsignmentDetail(expectedSupervisingOffice?: string): Promise<void> {
        await this.verifyAutoGeneratedConsignment(
            'IMMI',
            () => this.movementOverviewPage.openImmiConsignmentDetail(),
            MRN_COUNTRY_CODE.IMMI,
            expectedSupervisingOffice
        );
    }

    /**
     * EIDR-journey only: submitting also auto-generates a linked EIDR consignment,
     * but — unlike SFD/IMMI — it is never authorised with an MRN, so this soft-checks
     * it exists and carries no MRN (the MRN row renders as "-"). The status is only
     * recorded, not asserted: it transitions asynchronously (observed both "Trader
     * Input Required" and "Authorised" at this point), so pinning one value flakes.
     */
    async verifyEidrConsignmentDetail(): Promise<void> {
        await ReportLog.step('Validate auto-generated EIDR consignment', async () => {
            const opened = await this.movementOverviewPage.openEidrConsignmentDetail();
            expect.soft(opened, 'EIDR consignment auto-generated').toBe(true);
            if (!opened) return;

            // The LRN is EIDR's only identifier here — it is never authorised with
            // an MRN, so that row renders "-" and carries nothing to report.
            const lrn = await this.consignmentDetailPage.getConsignmentLocalReferenceNumber();
            const status = await this.consignmentDetailPage.getConsignmentStatus();
            ReportLog.setParameter('EIDR LRN', lrn);
            ReportLog.setParameter('EIDR status', status);

            // An EIDR is never authorised with an MRN, so the row renders "-". Reduced
            // to alphanumerics, a real MRN has some and the placeholder has none.
            const displayedMrn = await this.consignmentDetailPage.readDisplayedMovementReferenceNumber();
            expect.soft(alphanumericOnly(displayedMrn), 'EIDR MRN (should be absent)').toBe('');
        });
    }

    /**
     * Shared check for an auto-generated consignment (SFD or IMMI): open its detail,
     * soft-check it exists and its MRN opens with the expected country code, then stop
     * hard if it did not reach "Awaiting arrival".
     */
    private async verifyAutoGeneratedConsignment(
        label: string,
        openDetail: () => Promise<boolean>,
        mrnCode: MrnCountryCode,
        // Warehoused declarations only. Undefined means this journey has no warehouse,
        // so the row does not exist and asking for it would fail on its absence - see
        // requiresWarehouseIdentifier for the rule that decides.
        expectedSupervisingOffice?: string
    ): Promise<void> {
        await ReportLog.step(`Validate auto-generated ${label} consignment`, async () => {
            const opened = await openDetail();
            expect.soft(opened, `${label} consignment auto-generated`).toBe(true);
            if (!opened) return;

            // Report the LRN (the identifier used to find this consignment in the
            // service) and the status the consignment actually reached. Both are set
            // BEFORE the assertions, so a run that fails its checks still carries them.
            const lrn = await this.consignmentDetailPage.getConsignmentLocalReferenceNumber();
            const mrn = await this.consignmentDetailPage.waitForMovementReferenceNumber();
            const status = await this.consignmentDetailPage.getConsignmentStatus();
            ReportLog.setParameter(`${label} LRN`, lrn);
            ReportLog.setParameter(`${label} status`, status);

            expect.soft(mrn, `${label} MRN`).toMatch(mrnPrefix(mrnCode));

            // The auto-generated consignment is the FIRST place this can be checked on
            // an ENS journey: the ENS consignment the test filled in has no warehouse
            // of its own, so the office only appears once the service has generated the
            // warehoused one from it.
            if (expectedSupervisingOffice) {
                const office = await this.consignmentDetailPage.readSupervisingCustomsOffice();
                ReportLog.setParameter(`${label} supervising customs office`, office);
                expect.soft(office, 'Supervising customs office').toBe(expectedSupervisingOffice);
            }

            expect(status, `${label} consignment status`).toBe(this.t('status.awaitingArrival'));
        });
    }

}
