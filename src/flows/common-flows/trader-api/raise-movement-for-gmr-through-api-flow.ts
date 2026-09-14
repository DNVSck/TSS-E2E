import { TestInfo } from '@playwright/test';
import { DeclareEnsThroughApiFlow } from './declare-ens-through-api-flow';
import { DeclarationAccessFlow } from '../../declaration-access-flow';
import { BasePage } from '../../../page-object/base-page';
import { GmrJourney } from '../../../test-data/gmr-journey-data';
import { ReportLog } from '../../../core/report/report-log';

export interface RaiseMovementForGmrThroughApiOptions {
    testInfo: TestInfo;
    url: string;
    journey: GmrJourney;
}

export class RaiseMovementForGmrThroughApiFlow {
    constructor(
        private readonly declareEnsThroughApiFlow: DeclareEnsThroughApiFlow,
        private readonly declarationAccessFlow: DeclarationAccessFlow,
        private readonly basePage: BasePage,
    ) { }

    async raiseMovement(options: RaiseMovementForGmrThroughApiOptions): Promise<void> {
        const { testInfo, url, journey } = options;

        const { movementLrn, consignmentReference } = await ReportLog.step(
            `Declare an ENS-${journey.declarationType} RoRo (${journey.movement}) movement `
            + `through the Trader API to raise the GMR against`,
            () => this.declareEnsThroughApiFlow.declareAndSubmit(journey.declaration())
        );

        ReportLog.setParameter('GMR raised against', `${journey.declarationType} (Trader API)`);
        ReportLog.setParameter('Movement LRN', movementLrn);

        await this.basePage.navigateToPortal(url, testInfo);

        await ReportLog.step(
            `Open ${consignmentReference} so the GMR can be raised on its movement`,
            () => this.declarationAccessFlow.openDeclarationFromSearch(consignmentReference)
        );
    }
}
