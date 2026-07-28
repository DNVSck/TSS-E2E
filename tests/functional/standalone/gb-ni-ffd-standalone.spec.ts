import { ReportLog } from '../../../src/core/report/report-log';
import { getBaseUrl, test } from '../../test-hooks';
import { COMPANY_PROFILE } from '../../../src/core/auth/credentials';
import { ffdStandaloneConsignment } from '../../../src/test-data/ffd-standalone-consignment-data';
import { IMPORTER_COMPANY_NAME } from '../../../config/environment';


test.describe('GB to NI RoRo FFD Standalone Declaration Process - Agent Represents Trader', () => {
  // FFD = the app's "Standard Declaration" standalone journey.
  test.use({ authProfile: COMPANY_PROFILE.AGENT });

  test.beforeEach(async ({representTraderFlow}) => {
    await ReportLog.setFeature('GB to NI FFD Standalone Declaration Process');
    await representTraderFlow.representTrader(IMPORTER_COMPANY_NAME);
  });

  test('Verify FFD Standalone - Prelodged - RoRo (Accompanied) is created and submitted successfully', { tag: ['@smoke'] }, async ({ createAndSubmitStandaloneFlow }, testInfo) => {
    await ReportLog.setStory('FFD Standalone - Prelodged - RoRo (Accompanied)');
    await createAndSubmitStandaloneFlow.completeStandaloneFlow({
      testInfo,
      url: getBaseUrl(),
      consignmentData: ffdStandaloneConsignment(),
    });
  });
});


test.describe('GB to NI RoRo FFD Standalone Declaration Process - Importer Declrare by themself', () => {
  // The importer signs in as their OWN company, so there is NO representation:
  // no representTrader here, and representationType is left undefined so the flow
  // skips the "Representation information" screen.

  test.use({ authProfile: COMPANY_PROFILE.IMPORTER });

  test.beforeEach(async () => {
    await ReportLog.setFeature('GB to NI FFD Standalone Declaration Process');
  });

  test('Verify FFD Standalone - Prelodged - RoRo (Accompanied) - Importer Declrare by themself is created and submitted successfully', { tag: ['@regression'] }, async ({ createAndSubmitStandaloneFlow }, testInfo) => {
    await ReportLog.setStory('FFD Standalone - Prelodged - RoRo (Accompanied) - Importer Declrare by themself');
    await createAndSubmitStandaloneFlow.completeStandaloneFlow({
      testInfo,
      url: getBaseUrl(),
      consignmentData: ffdStandaloneConsignment(),
    });
  });
});