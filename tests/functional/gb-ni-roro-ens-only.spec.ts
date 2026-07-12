import { ReportLog } from '../../src/core/report/report-log';
import { ensOnlyConsignment } from '../../src/test-data/consignment-data';
import { getBaseUrl, test } from '../test-hooks';
import { COMPANY_PROFILE } from '../../src/core/auth/credentials';
import { authStatePath } from '../../src/core/auth/auth-state';

// TODO: set the Azure test case id for the ENS-only journey once it exists.

/**
 * ENS-only is the shortest journey: no importer, no IMMI/controlled-goods
 * questions, no exporter and no invoice currency. The buyer and seller are asked
 * directly, and the transport screen additionally asks for a destination country.
 * `ensOnlyConsignment()` supplies `isEnsOnly` plus the mandatory ENS-only reason.
 */
test.describe('GB to NI RoRo ENS-only Declaration Process', () => {
  // Replays the session cached by globalSetup; no sign-in per test.
  test.use({ storageState: authStatePath(COMPANY_PROFILE.AGENT) });

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
