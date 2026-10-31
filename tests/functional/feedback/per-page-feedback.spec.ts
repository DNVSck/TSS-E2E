import { expect, test } from '../../base-test';
import { ReportLog } from '../../../src/core/report/report-log';
import { COMPANY_PROFILE } from '../../../src/auth/credentials';
import { BASE_URL } from '../../../config/environment';
import { INITIAL_FORM_DECLARATION } from '../../../src/constant/initial-form-declaration-constants';
import { feedbackData } from '../../../src/test-data/feedback-data';
import { reportTestCaseLink } from '../../../src/helper/report-helper';
import { FEEDBACK } from '../../../src/constant/feedback-constant';
import { BOOLEAN } from '../../../src/constant/radio-value-constant';
import { ROUTES } from '../../../src/constant/endpoints-constant';

const { FROM_URL } = FEEDBACK;
const PER_PAGE_FEEDBACK = '3055';
const CONFIRMATION = new RegExp(`${ROUTES.PORTAL.FEEDBACK_CONFIRMATION}$`);

test.describe('Per-page feedback - feedback submitted from the Beta banner while declaring', () => {
  test.use({ authProfile: COMPANY_PROFILE.AGENT });

  test.beforeEach(async ({ portalAccessFlow, initialFormDeclaraPage }, testInfo) => {
    await ReportLog.setFeature('Per-page feedback');
    await portalAccessFlow.openService({ baseUrl: BASE_URL, testInfo });
    await initialFormDeclaraPage.waitForDirectionScreen();
  });

  test('Verify feedback can be submitted from the direction of declaration page', { tag: ['@smoke', '@regression', '@feedback', '@happyPath'] }, async ({ feedbackFlow, basePage }) => {
    await ReportLog.setStory('Feedback from the first page of the declaration');
    reportTestCaseLink(PER_PAGE_FEEDBACK);
    const data = feedbackData({ isPageUseful: BOOLEAN.YES });

    const fromUrl = await feedbackFlow.openFeedbackForm();
    expect(fromUrl).toBe(FROM_URL.DIRECTION_OF_DECLARATION);

    await feedbackFlow.answerFeedbackForm(data);
    await feedbackFlow.submitFeedback();
    await expect.poll(() => new URL(basePage.getCurrentUrl()).pathname).toMatch(CONFIRMATION);
  });

  test('Verify feedback can be submitted from a later page of the declaration', { tag: ['@regression', '@feedback', '@happyPath'] }, async ({ feedbackFlow, initialFormDeclaraPage, basePage }) => {
    await ReportLog.setStory('Feedback from a later page of the declaration');
    reportTestCaseLink(PER_PAGE_FEEDBACK);
    const data = feedbackData({ isPageUseful: BOOLEAN.NO, comment: 'The next question was unclear' });

    await ReportLog.step('Choose the direction of the declaration', () =>
      initialFormDeclaraPage.selectDirectionOfDeclaration(INITIAL_FORM_DECLARATION.DIRECTION_OF_DECLARATION.GB_TO_NI)
    );

    const fromUrl = await feedbackFlow.openFeedbackForm();
    expect(fromUrl).toBe(FROM_URL.GB_NI_PROCESS);

    await feedbackFlow.answerFeedbackForm(data);
    await feedbackFlow.submitFeedback();
    await expect.poll(() => new URL(basePage.getCurrentUrl()).pathname).toMatch(CONFIRMATION);
  });

  test('Verify the comment is optional', { tag: ['@regression', '@feedback'] }, async ({ feedbackFlow, basePage }) => {
    await ReportLog.setStory('Feedback without a comment');
    reportTestCaseLink(PER_PAGE_FEEDBACK);
    const data = feedbackData({ isPageUseful: BOOLEAN.YES, comment: '' });

    await feedbackFlow.openFeedbackForm();
    await feedbackFlow.answerFeedbackForm(data);
    await feedbackFlow.submitFeedback();
    await expect.poll(() => new URL(basePage.getCurrentUrl()).pathname).toMatch(CONFIRMATION);
  });

  test('Verify the user must say whether the page is useful', { tag: ['@regression', '@feedback', '@negative'] }, async ({ feedbackFlow }) => {
    await ReportLog.setStory('Feedback validation - radio left empty');
    reportTestCaseLink(PER_PAGE_FEEDBACK);

    await feedbackFlow.openFeedbackForm();
    const { errors, inlineErrorShown } = await feedbackFlow.continueWithoutAnswering();

    expect(errors).toHaveLength(1);
    expect(inlineErrorShown).toBe(true);
  });
});
