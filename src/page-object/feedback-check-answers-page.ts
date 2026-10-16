import { BasePage } from './base-page';
import { clickLinkAndWaitForNavigation, readFieldIfPresent } from '../helper/element-helper';

/** "Check your answers" for the per-page feedback form. */
export class FeedbackCheckAnswersPage extends BasePage {
    async waitForPage(): Promise<void> {
        await this.commonFinishButton.waitFor({ state: 'visible' });
    }

    /** The answer shown for a form field ('' when its row is empty or not listed). */
    async readAnswer(field: string): Promise<string> {
        const link = this.summaryList.changeLinkFor(field);
        return readFieldIfPresent(this.summaryList.valueOfRowWith(link));
    }

    async changeAnswer(field: string): Promise<void> {
        await clickLinkAndWaitForNavigation(this.page, this.summaryList.changeLinkFor(field));
    }

    /** Save the feedback; the service sends the user back to the page they came from. */
    async saveAndContinue(): Promise<void> {
        await this.clickFinishButton();
    }
}
