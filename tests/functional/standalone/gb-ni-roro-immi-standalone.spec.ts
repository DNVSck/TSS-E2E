import { ReportLog } from '../../../src/core/report/report-log';
import { getBaseUrl, test } from '../../test-hooks';
import { COMPANY_PROFILE } from '../../../src/auth/credentials';
import { IMPORTER_COMPANY_NAME } from '../../../config/environment';
import { immiStandaloneGoodsItem } from '../../../src/test-data/immi-standalone-goods-item-data';
import { ADDITIONAL_PROCEDURE_CODES } from '../../../src/constant/additional-procedure-codes-constant';
import { REPRESENTATION_TYPE } from '../../../src/constant/representation-type-constant';
import { TYPE_OF_MOVEMENT_OPTION_CODE } from '../../../src/constant/type-of-movement-code-constant';
import { reportTestCaseLink } from '../../../src/helper/report-helper';

const IMMI_STANDALONE_PRELODGED = '4442';

test.describe('GB to NI RoRo IMMI Standalone Declaration Process - Agent Represents Trader', () => {
  test.use({ authProfile: COMPANY_PROFILE.AGENT });

  test.beforeEach(async ({ representTraderFlow }) => {
    await ReportLog.setFeature('GB to NI IMMI Standalone Declaration Process');
    // The agent represents the importer, which is why the journey shows the
    // "Representation information" screen.
    await representTraderFlow.representTrader(IMPORTER_COMPANY_NAME);
  });

  test('Verify IMMI Standalone - Prelodged - RoRo (Accompanied) - Direct is created and submitted successfully', { tag: ['@smoke' , '@regression' , '@e2e'] }, async ({ createAndSubmitImmiStandaloneFlow }, testInfo) => {
    await ReportLog.setStory('IMMI Standalone - Prelodged - RoRo (Accompanied) - Direct');
    reportTestCaseLink(IMMI_STANDALONE_PRELODGED);
    await createAndSubmitImmiStandaloneFlow.completeImmiStandaloneFlow({
      testInfo,
      url: getBaseUrl(),
      consignmentOverrides: {
        typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
        representationType: REPRESENTATION_TYPE.DIRECT,
      },
      goodsItemOverrides: immiStandaloneGoodsItem(),
    });
  });

  test('Verify IMMI Standalone - Prelodged - RoRo (Unaccompanied) - Indirect is created and submitted successfully', { tag: ['@smoke', '@regression', '@e2e'] }, async ({ createAndSubmitImmiStandaloneFlow }, testInfo) => {
    await ReportLog.setStory('IMMI Standalone - Prelodged - RoRo (Unaccompanied) - Indirect');
    await createAndSubmitImmiStandaloneFlow.completeImmiStandaloneFlow({
      testInfo,
      url: getBaseUrl(),
      consignmentOverrides: {
        typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_UNACCOMPANIED,
        representationType: REPRESENTATION_TYPE.INDIRECT,
      },
      goodsItemOverrides: immiStandaloneGoodsItem({
        additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.SPIMM_CATEGORY_2_EXCISE_1EN,
      }),
    });
  });
});

test.describe('GB to NI RoRo IMMI Standalone Declaration Process - Importer Declare by themself', () => {
  // The importer signs in as their OWN company, so there is NO representation:
  // no representTrader here, and representationType is left undefined so the flow
  // skips the "Representation information" screen.
  test.use({ authProfile: COMPANY_PROFILE.IMPORTER });

  test.beforeEach(async () => {
    await ReportLog.setFeature('GB to NI IMMI Standalone Declaration Process');
  });

  test('Verify IMMI Standalone - Prelodged - RoRo (Accompanied) - Importer Declare by themself is created and submitted successfully', { tag: ['@regression' , '@e2e'] }, async ({ createAndSubmitImmiStandaloneFlow }, testInfo) => {
    await ReportLog.setStory('IMMI Standalone - Prelodged - RoRo (Accompanied) - Importer Declare by themself');
    await createAndSubmitImmiStandaloneFlow.completeImmiStandaloneFlow({
      testInfo,
      url: getBaseUrl(),
      consignmentOverrides: {
        typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
        representationType: undefined,
      },
      goodsItemOverrides: immiStandaloneGoodsItem(),
    });
  });
});
