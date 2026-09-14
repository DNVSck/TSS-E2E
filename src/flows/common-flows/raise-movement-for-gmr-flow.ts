import { TestInfo } from '@playwright/test';
import { CreateAndSubmitEnsDeclarationFlow } from './create-and-submit-ens-declaration-flow';
import { Ics2NotificationFlow } from '../ics2-notification-flow';
import { GmrJourney } from '../../test-data/gmr-journey-data';
import { ReportLog } from '../../core/report/report-log';

export interface RaiseMovementForGmrOptions {
    testInfo: TestInfo;
    url: string;
    journey: GmrJourney;
}

export class RaiseMovementForGmrFlow {
    constructor(
        private readonly createAndSubmitEnsDeclarationFlow: CreateAndSubmitEnsDeclarationFlow,
        private readonly ics2NotificationFlow: Ics2NotificationFlow,
    ) { }

    async raiseMovement(options: RaiseMovementForGmrOptions): Promise<void> {
        const { testInfo, url, journey } = options;

        const { transportDocumentNumber, ensMrn } = await ReportLog.step(
            `Declare an ENS-${journey.declarationType} RoRo (${journey.movement}) movement `
            + `to raise the GMR against`,
            () => this.createAndSubmitEnsDeclarationFlow.completeEnsDeclarationFlow({
                testInfo,
                url,
                ...journey.declaration(),
            })
        );

        ReportLog.setParameter('GMR raised against', journey.declarationType);

        if (!journey.authorisesThroughIcs2) {
            return;
        }

        await ReportLog.step('Authorise the movement through ICS2', () =>
            this.ics2NotificationFlow.authoriseForMovementUnlessMocked(ensMrn, transportDocumentNumber)
        );
    }
}
