import { ReportLog } from '../../../src/core/report/report-log';
import { ensOnlyConsignment } from '../../../src/test-data/consignment-data';
import { test } from '../../base-test';
import { TYPE_OF_MOVEMENT_OPTION_CODE } from '../../../src/constant/type-of-movement-code-constant';
import { COMPANY_PROFILE } from '../../../src/auth/credentials';
import { reportTestCaseLink } from '../../../src/helper/report-helper';
import { BASE_URL } from '../../../config/environment';
import { feedbackData } from '../../../src/test-data/feedback-data';

const END_OF_JOURNEY_FEEDBACK = '3065';

test.describe('End-of-journey feedback - Agent Represents Trader', () => {
  test.use({ authProfile: COMPANY_PROFILE.AGENT });

  test.beforeEach(async () => {
    await ReportLog.setFeature('End-of-journey feedback');
  });

  test('Verify user is prompted with a post-journey satisfaction survey and can submit or dismiss it without interruption', { tag: ['@regression', '@feedback'] }, async ({ endOfJourneyFeedbackFlow }, testInfo) => {
    await ReportLog.setStory('ENS-only - GB to NI RoRo Accompanied, then give feedback');
    reportTestCaseLink(END_OF_JOURNEY_FEEDBACK);
    await ReportLog.step('Submit the ENS declaration and give feedback from the banner', () =>
      endOfJourneyFeedbackFlow.submitEnsDeclarationAndGiveFeedback({
        testInfo,
        url: BASE_URL,
        movementOverrides: { typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED },
        consignmentOverrides: ensOnlyConsignment(),
      }, feedbackData())
    );
  });
});
