import { ReportLog } from '../../core/report/report-log';
import { MovementOverviewFlow } from '../movement/movement-overview-flow';
import { ConsignmentOverviewFlow } from '../consignment/consignment-overview-flow';
import { CreateDraftEnsDeclarationFlow, EnsDeclarationOptions } from './create-draft-ens-declaration-flow';
import { FeedbackPage } from '../../page-object/feedback-page';
import { FeedbackData } from '../../test-data/feedback-data';
import { verifySubmittedWithoutErrors } from '../../helper/declaration-status-helper';

/**
 * Submits an ENS declaration and gives the end-of-journey feedback.
 *
 * Not built on CreateAndSubmitEnsDeclarationFlow: that flow verifies the submitted
 * declaration by navigating through it, and the banner carrying the feedback link
 * does not survive a navigation or a refresh. This one goes from the submit
 * straight to the banner.
 */
export class EndOfJourneyFeedbackFlow {
    constructor(
        private readonly createDraftEnsDeclarationFlow: CreateDraftEnsDeclarationFlow,
        private readonly consignmentOverviewFlow: ConsignmentOverviewFlow,
        private readonly movementOverviewFlow: MovementOverviewFlow,
        private readonly feedbackPage: FeedbackPage,
    ) { }

    async submitEnsDeclarationAndGiveFeedback(
        options: EnsDeclarationOptions,
        feedback: FeedbackData
    ): Promise<void> {
        await this.createDraftEnsDeclarationFlow.createDraftEnsDeclaration(options);

        await this.consignmentOverviewFlow.submitConsignment();
        await this.movementOverviewFlow.waitForSubmittedMovementOverview();

        await this.movementOverviewFlow.openFeedbackFromSubmitBanner();
        await this.giveFeedback(feedback);
    }

    private async giveFeedback(feedback: FeedbackData): Promise<void> {
        await ReportLog.step('Fill and submit the feedback form', async () => {
            await this.feedbackPage.waitForFeedbackForm();
            await this.feedbackPage.fillForm(feedback);
            verifySubmittedWithoutErrors(await this.feedbackPage.submit(), 'the feedback form');
        });
    }
}
