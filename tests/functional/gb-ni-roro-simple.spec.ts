import { ENVIRONMENT_INFO } from '../../config/environment';
import { ReportLog } from '../../src/core/report/report-log';
import { getBaseUrl, test } from '../test-hooks';
import { TRANSPORT_CHARGES_OPTION_CODE, TYPE_OF_MOVEMENT_OPTION_CODE, NEW_GOODS_MOVEMENT_DECLARATION } from '../../src/constant/goods-movement-declaration-constants';
import { AllureTestManager } from '../../src/core/report/allure-test-manager';

test.describe('GB to NI RoRo Simplified Customs Declaration Process', () => {

  test.beforeEach(async () => {
    await ReportLog.setFeature('GB to NI RoRo Simplified Customs Declaration Process');
  });

  test('Accompanied', { tag: ['@smoke', '@test'] }, async ({ t, gbNiRoRoSimpleAccoFlow }, testInfo) => {
    await ReportLog.setStory('ENS SFD - GB to NI RoRo Simplified Customs Declaration Accompanied');
    AllureTestManager.addTestLink('https://goto-uk.netcompany.com/cases/GTE96/HMRCTSS/Lists/TestCases/DispForm.aspx?ID=2423');
    ReportLog.info(`Starting navigation test from ${getBaseUrl()} with locale: ${ENVIRONMENT_INFO.currentLocale}`);

    await gbNiRoRoSimpleAccoFlow.completeGbToNiRoRoSimpleAcco(
      testInfo,
      getBaseUrl(),
      t('portal.title')
    );
  });

  test('Unaccompanied', { tag: ['@smoke'] }, async ({ t, gbNiRoRoSimpleAccoFlow }, testInfo) => {
    await ReportLog.setStory('ENS SFD - GB to NI RoRo Simplified Customs Declaration UnAccompanied');
    ReportLog.info(`Starting navigation test from ${getBaseUrl()} with locale: ${ENVIRONMENT_INFO.currentLocale}`);

    await gbNiRoRoSimpleAccoFlow.completeGbToNiRoRoSimpleAcco(
      testInfo,
      getBaseUrl(),
      t('portal.title'),
      undefined,
      {
        typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_UNACCOMPANIED,
        transportCharges: TRANSPORT_CHARGES_OPTION_CODE.PAYMENT_BY_CREDIT_CARD,
      }
    );
  });

  test('Accompanied - On Behalf of Carrier', { tag: ['@smoke'] }, async ({ t, gbNiRoRoSimpleAccoFlow }, testInfo) => {
    await ReportLog.setStory('ENS SFD - GB to NI RoRo Simplified Declaration Accompanied On Behalf of Carrier');
    ReportLog.info(`Starting navigation test from ${getBaseUrl()} with locale: ${ENVIRONMENT_INFO.currentLocale}`);

    await gbNiRoRoSimpleAccoFlow.completeGbToNiRoRoSimpleAcco(
      testInfo,
      getBaseUrl(),
      t('portal.title'),
      undefined,
      {
        roleInThisMovement: NEW_GOODS_MOVEMENT_DECLARATION.ROLE_IN_THIS_MOVEMENT.ON_BEHALF_OF_CARRIER,
        haulierSeparateThisMovement: NEW_GOODS_MOVEMENT_DECLARATION.SEPARATE_HAULIER_THIS_MOVEMENT.SEPARATE_HAULIER,
      }
    );
  });

});