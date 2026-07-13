import { ReportLog } from '../../src/core/report/report-log';
import { ensOnlyConsignment } from '../../src/test-data/consignment-data';
import { getBaseUrl, test } from '../test-hooks';
import { COMPANY_PROFILE } from '../../src/core/auth/credentials';


test.describe('GB to NI RoRo ENS-only Declaration Process', () => {
  // Runs as AGENT: this worker replays its own AGENT account's cached session
  // (chosen from the pool), signed in once by globalSetup. No sign-in per test.
  test.use({ authProfile: COMPANY_PROFILE.AGENT });

  test.beforeEach(async () => {
    await ReportLog.setFeature('GB to NI RoRo ENS-only Declaration Process');
  });

  test('Accompanied', { tag: ['@smoke'] }, async ({ createAndSubmitEnsDeclarationFlow }, testInfo) => {
    await ReportLog.setStory('ENS-only - GB to NI RoRo Accompanied');

    await createAndSubmitEnsDeclarationFlow.completeEnsDeclarationFlow({
      testInfo,
      url: getBaseUrl(),
      consignmentOverrides: ensOnlyConsignment(),
    });
  });
});
