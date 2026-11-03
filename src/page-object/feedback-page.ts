import { Page, Locator } from '@playwright/test';
import { BasePage } from './base-page';
import { FeedbackData } from '../test-data/feedback-data';
import { FEEDBACK } from '../constant/feedback-constant';
import { BooleanValue } from '../constant/radio-value-constant';
import { ROUTES } from '../constant/endpoints-constant';
import { checkRadioByValue, clickToLeaveScreen, fillInputValue } from '../helper/element-helper';

const FEEDBACK_FORM_TIMEOUT = 30_000;

/**
 * The end-of-journey "Give feedback" form. Every control is addressed by its name/id,
 * never its label: the labels are translated and the form is the same in both locales.
 */
export class FeedbackPage extends BasePage {
    private readonly taskCompleted: Locator;
    private readonly taskEaseScore: Locator;
    private readonly taskEaseReason: Locator;
    private readonly satisfactionScore: Locator;
    private readonly isPageUsefulRadios: Locator;
    private readonly checkedIsPageUsefulRadio: Locator;
    private readonly commentInput: Locator;
    private readonly isPageUsefulError: Locator;

    constructor(page: Page) {
        super(page);

        this.taskCompleted = page.locator("input[name='taskCompleted']");
        this.taskEaseScore = page.locator("input[name='taskEaseScore']");
        this.taskEaseReason = page.locator('#taskEaseReason');
        this.satisfactionScore = page.locator("input[name='satisfactionScore']");
        this.isPageUsefulRadios = page.locator(`input[name="${FEEDBACK.FIELD.IS_PAGE_USEFUL}"]`);
        this.checkedIsPageUsefulRadio = page.locator(`input[name="${FEEDBACK.FIELD.IS_PAGE_USEFUL}"]:checked`);
        this.commentInput = page.locator(`textarea#${FEEDBACK.FIELD.COMMENT}`);
        this.isPageUsefulError = page.locator(`#${FEEDBACK.FIELD.IS_PAGE_USEFUL}-error`);
    }

    async waitForFeedbackForm(): Promise<void> {
        await this.page.waitForURL(url => url.pathname.includes(ROUTES.PORTAL.FEEDBACK_END_OF_JOURNEY), {
            waitUntil: 'domcontentloaded', timeout: FEEDBACK_FORM_TIMEOUT,
        });
        await this.commonContinueButton.waitFor({ state: 'visible', timeout: FEEDBACK_FORM_TIMEOUT });
    }

    async fillForm(feedback: FeedbackData): Promise<void> {
        await this.taskCompleted.and(this.page.locator(`[value='${feedback.taskCompleted}']`)).check();
        await this.taskEaseScore.and(this.page.locator(`[value='${feedback.taskEaseScore}']`)).check();
        await this.taskEaseReason.fill(feedback.taskEaseReason);
        await this.satisfactionScore.and(this.page.locator(`[value='${feedback.satisfactionScore}']`)).check();
        await this.commentInput.fill(feedback.comment);
    }

    /** Submit the form; returns the validation errors the service raised, if any. */
    async submit(): Promise<string[]> {
        return this.continueAndReadErrors();
    }

    async waitForForm(): Promise<void> {
        await this.commentInput.waitFor({ state: 'visible' });
    }

    async selectIsPageUseful(answer: BooleanValue): Promise<void> {
        await checkRadioByValue(this.isPageUsefulRadios, answer);
    }

    async enterComment(comment: string): Promise<void> {
        await fillInputValue(this.commentInput, comment);
    }

    /** Continue to "Check your answers". */
    async continueToCheckAnswers(): Promise<void> {
        await clickToLeaveScreen(this.page, this.commonContinueButton);
    }

    /** The radio currently ticked ('' when none), as its posted value. */
    async readIsPageUseful(): Promise<string> {
        if (await this.checkedIsPageUsefulRadio.count() === 0) {
            return '';
        }
        return await this.checkedIsPageUsefulRadio.getAttribute('value') ?? '';
    }

    /** The label the form shows beside the ticked radio, as the user read it. */
    async readSelectedLabel(): Promise<string> {
        const id = await this.checkedIsPageUsefulRadio.getAttribute('id');
        return (await this.page.locator(`label[for="${id}"]`).innerText()).trim();
    }

    async isInlineErrorShown(): Promise<boolean> {
        return this.isPageUsefulError.isVisible();
    }
}
