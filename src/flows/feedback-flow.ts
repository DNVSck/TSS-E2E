import { PhaseBanner } from '../page-object/components/phase-banner';
import { FeedbackPage } from '../page-object/feedback-page';
import { FeedbackCheckAnswersPage } from '../page-object/feedback-check-answers-page';
import { ReportLog } from '../core/report/report-log';
import { FeedbackData } from '../test-data/feedback-data';
import { FEEDBACK } from '../constant/feedback-constant';
import { BooleanValue } from '../constant/radio-value-constant';

export interface CheckedFeedback {
    isPageUseful: string;
    comment: string;
}

export class FeedbackFlow {
    constructor(
        private readonly phaseBanner: PhaseBanner,
        private readonly feedbackPage: FeedbackPage,
        private readonly feedbackCheckAnswersPage: FeedbackCheckAnswersPage,
    ) { }

    /** Open the feedback form from the Beta banner of the page the user is on; returns the page it will come back to. */
    async openFeedbackForm(): Promise<string> {
        return ReportLog.step('Open the feedback form from the Beta banner', async () => {
            const fromUrl = await this.phaseBanner.readFromUrl();
            await this.phaseBanner.openFeedback();
            await this.feedbackPage.waitForForm();
            return fromUrl;
        });
    }

    /**
     * Answer the form; returns the label the user ticked, as the form showed it.
     * The check-your-answers page repeats that text, and the feedback pages are not
     * translated in Welsh, so it is read from the form rather than taken from t().
     */
    async answerFeedbackForm(data: FeedbackData): Promise<string> {
        return ReportLog.step('Answer the feedback form', async () => {
            await this.feedbackPage.selectIsPageUseful(data.isPageUseful);
            if (data.comment) {
                await this.feedbackPage.enterComment(data.comment);
            }
            return this.feedbackPage.readSelectedLabel();
        });
    }

    async continueToCheckAnswers(): Promise<void> {
        await ReportLog.step('Continue to check the feedback answers', async () => {
            await this.feedbackPage.continueToCheckAnswers();
            await this.feedbackCheckAnswersPage.waitForPage();
        });
    }

    /** Submit the form without answering "Is this page useful?" and return the errors the service lists. */
    async continueWithoutAnswering(): Promise<{ errors: string[]; inlineErrorShown: boolean }> {
        return ReportLog.step('Continue without answering whether the page is useful', async () => {
            const errors = await this.feedbackPage.continueAndReadErrors();
            return { errors, inlineErrorShown: await this.feedbackPage.isInlineErrorShown() };
        });
    }

    async readCheckedAnswers(): Promise<CheckedFeedback> {
        return ReportLog.step('Read the answers on Check your answers', async () => ({
            isPageUseful: await this.feedbackCheckAnswersPage.readAnswer(FEEDBACK.FIELD.IS_PAGE_USEFUL),
            comment: await this.feedbackCheckAnswersPage.readAnswer(FEEDBACK.FIELD.COMMENT),
        }));
    }

    /** Save the feedback; the service returns the user to the page they came from. */
    async saveFeedback(): Promise<void> {
        await ReportLog.step('Save the feedback', () => this.feedbackCheckAnswersPage.saveAndContinue());
    }

    /** Change "Is this page useful?" from Check your answers, and come back to Check your answers. */
    async changeIsPageUseful(answer: BooleanValue): Promise<{ prefilled: string; label: string }> {
        return ReportLog.step('Change the "Is this page useful?" answer', async () => {
            await this.feedbackCheckAnswersPage.changeAnswer(FEEDBACK.FIELD.IS_PAGE_USEFUL);
            await this.feedbackPage.waitForForm();
            const prefilled = await this.feedbackPage.readIsPageUseful();
            await this.feedbackPage.selectIsPageUseful(answer);
            const label = await this.feedbackPage.readSelectedLabel();
            await this.continueToCheckAnswers();
            return { prefilled, label };
        });
    }
}
