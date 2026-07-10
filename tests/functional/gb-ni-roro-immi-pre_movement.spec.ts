import { TYPE_OF_MOVEMENT_OPTION_CODE } from '../../src/constant/type-of-movement-code-constant';
import { ReportLog } from '../../src/core/report/report-log';
import { consignment } from '../../src/test-data/consignment-data';
import { movement } from '../../src/test-data/movements-data';
import { initialFormData } from '../../src/test-data/initial-form-data';
import { getBaseUrl, test } from '../test-hooks';
import { goods } from '../../src/test-data/goods-data';
import { COMPANY_PROFILE } from '../../src/core/auth/credentials';
import { authStatePath } from '../../src/core/auth/auth-state';

const TGP_TC_ID = '2793';
const NO_TGP_TC_ID = '2809';

test.describe('GB to NI RoRo IMMI Pre-movement', () => {
  // Replays the session cached by globalSetup; no sign-in per test.
  test.use({ storageState: authStatePath(COMPANY_PROFILE.AGENT) });

  test.beforeEach(async () => {
    await ReportLog.setFeature('IMMI - Pre-movement');
  });

  test('IMMI Pre-movement - GB to NI RoRo Accompanied with using TGP', { tag: ['@smoke'] }, async ({
    t,
    createAndSubmitEnsDeclarationFlow,
  }, testInfo) => {
    await ReportLog.setStory('IMMI Pre-movement - GB to NI RoRo IMMI Accompanied with TGP');

    ReportLog.setTestCaseLink(TGP_TC_ID);

    await createAndSubmitEnsDeclarationFlow.completeEnsDeclarationFlow(
      testInfo,
      getBaseUrl(),
      initialFormData(),
      movement(),
      consignment({ isGoodsAtRisk: false, useIMMI: true }),
      goods()
    )

  });

  test('IMMI Pre-movement - GB to NI RoRo Unaccompanied without using TGP', { tag: ['@smoke'] }, async ({
    t,
    createAndSubmitEnsDeclarationFlow,
  }, testInfo) => {
    await ReportLog.setStory('IMMI Pre-movement - GB to NI RoRo IMMI Unaccompanied without TGP');

    ReportLog.setTestCaseLink(NO_TGP_TC_ID);

    await createAndSubmitEnsDeclarationFlow.completeEnsDeclarationFlow(
      testInfo,
      getBaseUrl(),
      initialFormData(),
      movement({ typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_UNACCOMPANIED }),
      consignment({ isGoodsAtRisk: false, useIMMI: true }),
      goods()
    );
  });
});
