import { ReportLog } from '../../../src/core/report/report-log';
import { test } from '../../base-test';
import { COMPANY_PROFILE } from '../../../src/auth/credentials';
import { IMPORTER_COMPANY_NAME, BASE_URL } from '../../../config/environment';
import { TYPE_OF_MOVEMENT_OPTION_CODE } from '../../../src/constant/type-of-movement-code-constant';
import { ffdH2ReimportAfterTemporaryExportGoodsItem } from '../../../src/test-data/ffd-standalone-goods-item-data';
import { ffdH2ReimportAfterTemporaryExportConsignment } from '../../../src/test-data/ffd-standalone-consignment-data';
import { reportTestCaseLink } from '../../../src/helper/report-helper';

const FFD_H2_REIMPORT_AFTER_TEMPORARY_EXPORT_PRELODGED = '6141';


test.describe('GB to NI RoRo FFD H2 Standalone Declaration Process - Agent Represents Trader', () => {
  test.use({ authProfile: COMPANY_PROFILE.AGENT });

  test.beforeEach(async ({representTraderFlow}) => {
    await ReportLog.setFeature('GB to NI FFD H2 Standalone Declaration Process');
    await representTraderFlow.representTrader(IMPORTER_COMPANY_NAME);
  });

  test('Verify FFD H2 Standalone - Arrived - RoRo (Unaccompanied) - Trader DDA is created and submitted successfully (4000-000)', { tag: ['@smoke', '@ffd', '@regression', '@happyPath'] }, async ({ createAndSubmitFfdH2StandaloneFlow }, testInfo) => {
    await ReportLog.setStory('FFD H2 Standalone - Arrived - RoRo (Unaccompanied) - Trader DDA');
    await createAndSubmitFfdH2StandaloneFlow.declareAndClose({
      testInfo,
      url: BASE_URL,
      consignmentOverrides: {
        isPreLodged: false,
        typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_UNACCOMPANIED,
      },
    });
  });
});


test.describe('GB to NI RoRo FFD H2 Standalone Declaration Process - Importer Declare by themself', () => {
  test.use({ authProfile: COMPANY_PROFILE.IMPORTER });

  test.beforeEach(async () => {
    await ReportLog.setFeature('GB to NI FFD H2 Standalone Declaration Process');
  });

  test('Verify FFD H2 Standalone - Prelodged - RoRo (Unaccompanied) - Trader DDA - Importer Declare by themself is created and submitted successfully (4000-000)', { tag: ['@ffd', '@regression', '@happyPath'] }, async ({ createAndSubmitFfdH2StandaloneFlow }, testInfo) => {
    await ReportLog.setStory('FFD H2 Standalone - Prelodged - RoRo (Unaccompanied) - Trader DDA - Importer Declare by themself');
    await createAndSubmitFfdH2StandaloneFlow.declareAndClose({
      testInfo,
      url: BASE_URL,
      consignmentOverrides: {
        typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_UNACCOMPANIED,
        representationType: undefined,
      },
    });
  });
});


test.describe('GB to NI RoRo FFD H2 Standalone - Entry to an Approved Warehouse being Reimported Following Temporary Export - Importer Declare by themself', () => {
  test.use({ authProfile: COMPANY_PROFILE.IMPORTER });

  test.beforeEach(async () => {
    await ReportLog.setFeature('GB to NI FFD H2 Standalone Declaration Process');
  });

  test('Verify FFD H2 Standalone - Prelodged - RoRo (Accompanied) - Trader DDA - Reimported Following Temporary Export - Importer Declare by themself is created and submitted successfully (7122-B02)', { tag: ['@ffd', '@regression'] }, async ({ createAndSubmitFfdH2StandaloneFlow }, testInfo) => {
    await ReportLog.setStory('FFD H2 Standalone - Prelodged - RoRo (Accompanied) - Trader DDA - Reimported Following Temporary Export - Importer Declare by themself');
    reportTestCaseLink(FFD_H2_REIMPORT_AFTER_TEMPORARY_EXPORT_PRELODGED);
    await createAndSubmitFfdH2StandaloneFlow.declareAndClose({
      testInfo,
      url: BASE_URL,
      consignmentOverrides: ffdH2ReimportAfterTemporaryExportConsignment({ representationType: undefined }),
      goodsItemOverrides: ffdH2ReimportAfterTemporaryExportGoodsItem(),
    });
  });

});
