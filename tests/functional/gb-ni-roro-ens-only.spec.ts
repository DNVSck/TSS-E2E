import { ReportLog } from '../../src/core/report/report-log';
import { ensOnlyConsignment } from '../../src/test-data/consignment-data';
import { getBaseUrl, test } from '../test-hooks';
import { TYPE_OF_MOVEMENT_OPTION_CODE } from '../../src/constant/type-of-movement-code-constant';
import { COMPANY_PROFILE } from '../../src/core/auth/credentials';
import { HAULIER_COMPANY_NAME } from '../../config/environment';


test.describe('GB to NI RoRo ENS-only Declaration Process', () => {
  // Runs as AGENT: this worker replays its own AGENT account's cached session
  // (chosen from the pool), signed in once by globalSetup. No sign-in per test.
  test.use({ authProfile: COMPANY_PROFILE.AGENT });

  test.beforeEach(async ({ representTraderFlow }) => {
    await ReportLog.setFeature('GB to NI RoRo ENS-only Declaration Process');
    // Agent represents the Haulier company before declaring on the Importer's
    // behalf — a server-side session state the journeys below then run under.
    await representTraderFlow.representTrader(HAULIER_COMPANY_NAME);
  });

  test('Verify ENS Only - RoRo (Accompanied) is created and submitted successfully', { tag: ['@smoke'] }, async ({ createAndSubmitEnsDeclarationFlow }, testInfo) => {
    await ReportLog.setStory('ENS-only - GB to NI RoRo Accompanied');
    await createAndSubmitEnsDeclarationFlow.completeEnsDeclarationFlow({
      testInfo,
      url: getBaseUrl(),
      movementOverrides: { typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED },
      consignmentOverrides: ensOnlyConsignment(),
    });
  });
});
