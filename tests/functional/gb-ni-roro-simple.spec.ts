import { ReportLog } from '../../src/core/report/report-log';
import { getBaseUrl, test } from '../test-hooks';
import { TRANSPORT_CHARGES_OPTION_CODE } from '../../src/constant/transport-charges-code-constant';
import { TYPE_OF_MOVEMENT_OPTION_CODE } from '../../src/constant/type-of-movement-code-constant';
import { ROLE_IN_MOVEMENT } from '../../src/constant/role-in-movement-constant';
import { SEPARATE_HAULIER } from '../../src/constant/separate-haulier-constant';
import { COMPANY_PROFILE } from '../../src/core/auth/credentials';
import { authStatePath } from '../../src/core/auth/auth-state';

const TEST_CASE_ID = '2423';

test.describe('GB to NI RoRo Simplified Customs Declaration Process', () => {
  // Replays the session cached by globalSetup; no sign-in per test.
  test.use({ storageState: authStatePath(COMPANY_PROFILE.AGENT) });

  test.beforeEach(async () => {
    await ReportLog.setFeature('GB to NI RoRo Simplified Customs Declaration Process');
  });

  test('Accompanied', { tag: ['@smoke', '@test'] }, async ({ t, createAndSubmitEnsDeclarationFlow }, testInfo) => {
    await ReportLog.setStory('ENS SFD - GB to NI RoRo Simplified Customs Declaration Accompanied');

    ReportLog.setTestCaseLink(TEST_CASE_ID);

    await createAndSubmitEnsDeclarationFlow.completeEnsDeclarationFlow(
      testInfo,
      getBaseUrl(),
    );
  });

  test('Unaccompanied', { tag: ['@smoke'] }, async ({ t, createAndSubmitEnsDeclarationFlow }, testInfo) => {
    await ReportLog.setStory('ENS SFD - GB to NI RoRo Simplified Customs Declaration UnAccompanied');

    await createAndSubmitEnsDeclarationFlow.completeEnsDeclarationFlow(
      testInfo,
      getBaseUrl(),
      undefined,
      {
        typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_UNACCOMPANIED,
        transportCharges: TRANSPORT_CHARGES_OPTION_CODE.PAYMENT_BY_CREDIT_CARD,
      }
    );
  });

  test('Accompanied - On Behalf of Carrier', { tag: ['@smoke'] }, async ({ t, createAndSubmitEnsDeclarationFlow }, testInfo) => {
    await ReportLog.setStory('ENS SFD - GB to NI RoRo Simplified Declaration Accompanied On Behalf of Carrier');

    await createAndSubmitEnsDeclarationFlow.completeEnsDeclarationFlow(
      testInfo,
      getBaseUrl(),
      undefined,
      {
        roleInThisMovement: ROLE_IN_MOVEMENT.ON_BEHALF_OF_CARRIER,
        haulierSeparateThisMovement: SEPARATE_HAULIER.SEPARATE_HAULIER,
      }
    );
  });

});
