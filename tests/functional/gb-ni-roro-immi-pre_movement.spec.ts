import { ENVIRONMENT_INFO } from '../../config/environment';
import { TYPE_OF_MOVEMENT_OPTION_CODE } from '../../src/constant/goods-movement-declaration-constants';
import { ReportLog } from '../../src/core/report/report-log';
import { consignment } from '../../src/test-data/consignment-data';
import { movement } from '../../src/test-data/movements-data';
import { route } from '../../src/test-data/initial-form-data';
import { getBaseUrl, test } from '../test-hooks';
import { AllureTestManager } from '../../src/core/report/allure-test-manager';
import { TEST_LINK_CONFIG } from '../../src/constant/test-link.constant';
import { goods } from '../../src/test-data/goods-data';
import { COMPANY_PROFILE } from '../../src/core/auth/credentials';

const TGP_TC_ID = '2793';
const NO_TGP_TC_ID = '2809';

test.describe('GB to NI RoRo IMMI Pre-movement', () => {
  test.beforeEach(async () => {
    await ReportLog.setFeature('IMMI - Pre-movement');
  });

  test('IMMI Pre-movement - GB to NI RoRo Accompanied with using TGP', { tag: ['@smoke'] }, async ({
    t,
    createAndSubmitEnsDeclarationFlow,
  }, testInfo) => {
    await ReportLog.setStory('IMMI Pre-movement - GB to NI RoRo IMMI Accompanied with TGP');

    AllureTestManager.addTestLink(`${TEST_LINK_CONFIG.TEST_CASES_URL}${TGP_TC_ID}`);
    ReportLog.info(`Starting navigation test from ${getBaseUrl()} with locale: ${ENVIRONMENT_INFO.currentLocale}`);

    await createAndSubmitEnsDeclarationFlow.completeEnsDeclarationFlow(
      testInfo,
      getBaseUrl(),
      COMPANY_PROFILE.AGENT,
      route(),
      movement(),
      consignment({ isGoodsAtRisk: 'no', useIMMI: 'yes' }),
      goods()
    );

  });

  test('IMMI Pre-movement - GB to NI RoRo Unaccompanied without using TGP', { tag: ['@smoke'] }, async ({
    t,
    createAndSubmitEnsDeclarationFlow,
  }, testInfo) => {
    await ReportLog.setStory('IMMI Pre-movement - GB to NI RoRo IMMI Unaccompanied without TGP');

    AllureTestManager.addTestLink(`${TEST_LINK_CONFIG.TEST_CASES_URL}${NO_TGP_TC_ID}`);
    ReportLog.info(`Starting navigation test from ${getBaseUrl()} with locale: ${ENVIRONMENT_INFO.currentLocale}`);

     await createAndSubmitEnsDeclarationFlow.completeEnsDeclarationFlow(
      testInfo,
      getBaseUrl(),
      COMPANY_PROFILE.AGENT,
      route(),
      movement({ typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_UNACCOMPANIED }),
      consignment({ isGoodsAtRisk: 'no', useIMMI: 'yes' }),
      goods()
    );
  });
});
