import { PhaseBanner } from '../page-object/components/phase-banner';
import { FeedbackPage } from '../page-object/feedback-page';
import { ReportLog } from '../core/report/report-log';
import { FeedbackData } from '../test-data/feedback-data';
import { verifySubmittedWithoutErrors } from '../helper/declaration-status-helper';

export class FeedbackFlow {
    constructor(
        private readonly phaseBanner: PhaseBanner,
        private readonly feedbackPage: FeedbackPage,
    ) { }

    /** Open the feedback form from the Beta banner of the page the user is on; returns the page the banner names as its origin. */
    async openFeedbackForm(): Promise<string> {
        return ReportLog.step('Open the feedback form from the Beta banner', async () => {
            const fromUrl = await this.phaseBanner.readFromUrl();
            await this.phaseBanner.openFeedback();
            await this.feedbackPage.waitForForm();
            return fromUrl;
        });
    }

    async answerFeedbackForm(data: FeedbackData): Promise<void> {
        await ReportLog.step('Answer the feedback form', async () => {
            await this.feedbackPage.selectIsPageUseful(data.isPageUseful);
            if (data.comment) {
                await this.feedbackPage.enterComment(data.comment);
            }
        });
    }

    async submitFeedback(): Promise<void> {
        await ReportLog.step('Submit the feedback', async () => {
            verifySubmittedWithoutErrors(await this.feedbackPage.submit(), 'the feedback form');
        });
    }

    /** Submit the form without answering "Is this page useful?" and return the errors the service lists. */
    async continueWithoutAnswering(): Promise<{ errors: string[]; inlineErrorShown: boolean }> {
        return ReportLog.step('Continue without answering whether the page is useful', async () => {
            const errors = await this.feedbackPage.continueAndReadErrors();
            return { errors, inlineErrorShown: await this.feedbackPage.isInlineErrorShown() };
        });
    }
}
