import { ReportLog } from '../../../src/core/report/report-log';
import { getBaseUrl, test } from '../../test-hooks';
import { COMPANY_PROFILE } from '../../../src/auth/credentials';
import { IMPORTER_COMPANY_NAME } from '../../../config/environment';
import { ffdStandaloneGoodsItem } from '../../../src/test-data/ffd-standalone-goods-item-data';
import { TYPE_OF_MOVEMENT_OPTION_CODE } from '../../../src/constant/type-of-movement-code-constant';


test.describe('GB to NI RoRo FFD Standalone Declaration Process - Agent Represents Trader', () => {
  // FFD = the app's "Standard Declaration" standalone journey.
  test.use({ authProfile: COMPANY_PROFILE.AGENT });

  test.beforeEach(async ({representTraderFlow}) => {
    await ReportLog.setFeature('GB to NI FFD Standalone Declaration Process');
    await representTraderFlow.representTrader(IMPORTER_COMPANY_NAME);
  });

  test('Verify FFD Standalone - Prelodged - RoRo (Accompanied) is created and submitted successfully (4000-000)', { tag: ['@smoke', '@happyPath'] }, async ({ createAndSubmitFfdStandaloneFlow }, testInfo) => {
    await ReportLog.setStory('FFD Standalone - Prelodged - RoRo (Accompanied)');
    await createAndSubmitFfdStandaloneFlow.completeFfdStandaloneFlow({
      testInfo,
      url: getBaseUrl(),
      consignmentOverrides: {
        typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
      },
      goodsItemOverrides: ffdStandaloneGoodsItem(),
    });
  });

  // Accompanied and unaccompanied differ by one screen: the vehicle registration
  // becomes the trailer registration. Everything after it is the same journey.
  test('Verify FFD Standalone - Prelodged - RoRo (Unaccompanied) is created and submitted successfully (4000-000)', { tag: ['@smoke', '@happyPath'] }, async ({ createAndSubmitFfdStandaloneFlow }, testInfo) => {
    await ReportLog.setStory('FFD Standalone - Prelodged - RoRo (Unaccompanied)');
    await createAndSubmitFfdStandaloneFlow.completeFfdStandaloneFlow({
      testInfo,
      url: getBaseUrl(),
      consignmentOverrides: {
        typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_UNACCOMPANIED,
      },
      goodsItemOverrides: ffdStandaloneGoodsItem(),
    });
  });
});


test.describe('GB to NI RoRo FFD Standalone Declaration Process - Importer Declare by themself', () => {
  // The importer signs in as their OWN company, so there is NO representation:
  // no representTrader here, and representationType is left undefined so the flow
  // skips the "Representation information" screen.

  test.use({ authProfile: COMPANY_PROFILE.IMPORTER });

  test.beforeEach(async () => {
    await ReportLog.setFeature('GB to NI FFD Standalone Declaration Process');
  });

  test('Verify FFD Standalone - Prelodged - RoRo (Accompanied) - Importer Declare by themself is created and submitted successfully (4000-000)', { tag: ['@regression', '@happyPath'] }, async ({ createAndSubmitFfdStandaloneFlow }, testInfo) => {
    await ReportLog.setStory('FFD Standalone - Prelodged - RoRo (Accompanied) - Importer Declare by themself');
    await createAndSubmitFfdStandaloneFlow.completeFfdStandaloneFlow({
      testInfo,
      url: getBaseUrl(),
      consignmentOverrides: {
        typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
        // Signed in as the importer's own company, so the app never shows the
        // representation screen. The default is DIRECT, so it must be cleared here -
        // the same override the IMMI standalone self-login test carries.
        representationType: undefined,
      },
      goodsItemOverrides: ffdStandaloneGoodsItem(),
    });
  });
}); 