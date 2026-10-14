import { TraderApiClient } from '../../../api-client/trader-api-client';
import { DeclareEnsThroughApiFlow } from './declare-ens-through-api-flow';
import { Ics2NotificationFlow } from '../../ics2-notification-flow';
import { CompanyProfileService } from '../../../api-service/portal-api/company-profile-service';
import { GmrJourney } from '../../../test-data/gmr-journey-data';
import { ReportLog } from '../../../core/report/report-log';

export interface RaiseMovementForGmrThroughApiOptions {
    journey: GmrJourney;
    representingCompanyId?: string;
}

export interface RaisedMovement {
    movementLrn: string;
    consignmentReference: string;
}

export class RaiseMovementForGmrThroughApiFlow {
    constructor(
        private readonly traderApi: TraderApiClient,
        private readonly declareEnsThroughApiFlow: DeclareEnsThroughApiFlow,
        private readonly ics2NotificationFlow: Ics2NotificationFlow,
        private readonly companyProfileService: CompanyProfileService,
    ) { }

    async isGmrAutoUpdateAllowed(): Promise<boolean> {
        return ReportLog.step('Read whether this company auto-updates its GMRs', async () => {
            const allowed = await this.companyProfileService.isGmrAutoUpdateAllowed();
            ReportLog.setParameter('GMR auto update', allowed ? 'granted' : 'not granted');

            return allowed;
        });
    }

    private async authoriseThroughIcs2(
        journey: GmrJourney,
        consignmentReference: string,
        transportDocumentNumber: string
    ): Promise<void> {
        if (!journey.authorisesThroughIcs2) {
            return;
        }

        const ensMrn = await this.declareEnsThroughApiFlow.waitForEnsMrn(consignmentReference);

        await ReportLog.step('Authorise the movement through ICS2', () =>
            this.ics2NotificationFlow.authoriseForMovementUnlessMocked(
                ensMrn, transportDocumentNumber
            )
        );

        await this.declareEnsThroughApiFlow.waitForEidrAuthorised(consignmentReference);
    }

    async raiseEligibleMovementThroughTraderApi(
        options: RaiseMovementForGmrThroughApiOptions
    ): Promise<RaisedMovement> {
        const { journey, representingCompanyId } = options;

        return this.traderApi.whileRepresenting(representingCompanyId, async () => {
            const { movementLrn, consignmentReference, transportDocumentNumber } =
                await ReportLog.step(
                    `Declare an eligible ENS-${journey.declarationType} RoRo (${journey.movement}) movement `
                    + `through the Trader API to raise the GMR against`,
                    () => this.declareEnsThroughApiFlow.declareAndSubmit(journey.declaration())
                );

            await this.settleConsignment(journey, consignmentReference, transportDocumentNumber);

            return this.reportRaised(journey, movementLrn, consignmentReference);
        });
    }

    async addEligibleConsignmentThroughTraderApi(
        movementLrn: string,
        journey: GmrJourney
    ): Promise<string> {
        const { consignmentReference, transportDocumentNumber } = await ReportLog.step(
            `Declare a second ENS-${journey.declarationType} consignment under ${movementLrn} `
            + `through the Trader API`,
            () => this.declareEnsThroughApiFlow.declareUnderMovement(
                movementLrn, journey.declaration()
            )
        );

        await this.settleConsignment(journey, consignmentReference, transportDocumentNumber);

        return consignmentReference;
    }

    private async settleConsignment(
        journey: GmrJourney,
        consignmentReference: string,
        transportDocumentNumber: string
    ): Promise<void> {
        switch (journey.declarationType) {
            case 'SFD':
                await this.declareEnsThroughApiFlow.waitForSfdAwaitingArrival(consignmentReference);
                return;
            case 'IMMI':
                await this.declareEnsThroughApiFlow.waitForImmiAwaitingArrival(consignmentReference);
                return;
            case 'EIDR':
                await this.authoriseThroughIcs2(
                    journey, consignmentReference, transportDocumentNumber
                );
                return;
            default: {
                const unsettled: never = journey.declarationType;
                throw new Error(
                    `No rule says when an ENS-${unsettled} consignment becomes eligible, so a `
                    + `journey that reached here would be measured before the service had `
                    + `finished with it.`
                );
            }
        }
    }

    private reportRaised(
        journey: GmrJourney,
        movementLrn: string,
        consignmentReference: string
    ): RaisedMovement {
        ReportLog.setParameter('GMR raised against', `${journey.declarationType} (Trader API)`);
        ReportLog.setParameter('Movement LRN', movementLrn);

        return { movementLrn, consignmentReference };
    }
}
