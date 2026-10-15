import { ReportLog } from '../../../src/core/report/report-log';
import { test } from '../../base-test';
import { COMPANY_PROFILE } from '../../../src/auth/credentials';
import { IMPORTER_COMPANY_NAME, BASE_URL } from '../../../config/environment';
import { REPRESENTATION_TYPE } from '../../../src/constant/representation-type-constant';
import { TYPE_OF_MOVEMENT_OPTION_CODE } from '../../../src/constant/type-of-movement-code-constant';
import { AUTHORISATION_TYPE_CODE } from '../../../src/constant/authorisation-type-code-constant';
import { holderOfAuthorisation } from '../../../src/test-data/holder-of-authorisation-data';
import { GOODS_CSV } from '../../../src/test-data/goods-csv-data';
import { reportTestCaseLink } from '../../../src/helper/report-helper';

const CSV_SFD_STANDALONE = '6231';
const CSV_EIDR_STANDALONE = '6232';
const CSV_IMMI_STANDALONE = '6235';

test.describe('GB to NI RoRo Standalone Goods CSV Upload - Agent Represents Trader', () => {
  test.use({ authProfile: COMPANY_PROFILE.AGENT });

  test.beforeEach(async ({ representTraderFlow }) => {
    await ReportLog.setFeature('GB to NI RoRo Standalone Goods CSV Upload');
    await representTraderFlow.representTrader(IMPORTER_COMPANY_NAME);
  });

  test('Verify SFD Standalone - Prelodged - RoRo (Accompanied) with goods uploaded by CSV is created and submitted successfully (4000-000)', { tag: ['@csvUpload', '@regression', '@happyPath'] }, async ({ createAndSubmitSfdStandaloneFlow }, testInfo) => {
    await ReportLog.setStory('SFD Standalone - goods records uploaded by CSV');
    reportTestCaseLink(CSV_SFD_STANDALONE);
    await ReportLog.step('Create and submit the SFD standalone declaration with goods from CSV', () =>
      createAndSubmitSfdStandaloneFlow.completeSfdStandaloneWithGoodsCsv({
        testInfo,
        url: BASE_URL,
        consignmentOverrides: {
          representationType: REPRESENTATION_TYPE.DIRECT,
          isControlledGoods: true,
        },
      }, GOODS_CSV.SFD_STANDALONE)
    );
  });

  test('Verify SFD-EIDR Standalone - Prelodged - RoRo (Accompanied) with goods uploaded by CSV is created and submitted successfully (4000-000)', { tag: ['@csvUpload', '@regression', '@happyPath'] }, async ({ createAndSubmitSfdStandaloneFlow }, testInfo) => {
    await ReportLog.setStory('SFD-EIDR Standalone - goods records uploaded by CSV');
    reportTestCaseLink(CSV_EIDR_STANDALONE);
    await ReportLog.step('Create and submit the SFD-EIDR standalone declaration with goods from CSV', () =>
      createAndSubmitSfdStandaloneFlow.completeSfdStandaloneWithGoodsCsv({
        testInfo,
        url: BASE_URL,
        consignmentOverrides: {
          representationType: REPRESENTATION_TYPE.DIRECT,
          isPreLodged: true,
          isControlledGoods: false,
        },
      }, GOODS_CSV.EIDR_STANDALONE)
    );
  });

  test('Verify IMMI Standalone - Prelodged - RoRo (Accompanied) - Direct with goods uploaded by CSV is created and submitted successfully (0700-1EL)', { tag: ['@csvUpload', '@regression', '@happyPath'] }, async ({ createAndSubmitImmiStandaloneFlow }, testInfo) => {
    await ReportLog.setStory('IMMI Standalone - goods records uploaded by CSV');
    reportTestCaseLink(CSV_IMMI_STANDALONE);
    await ReportLog.step('Create and submit the IMMI standalone declaration with goods from CSV', () =>
      createAndSubmitImmiStandaloneFlow.completeImmiStandaloneWithGoodsCsv({
        testInfo,
        url: BASE_URL,
        consignmentOverrides: {
          typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
          representationType: REPRESENTATION_TYPE.DIRECT,
          holdersOfAuthorisation: [
            holderOfAuthorisation({ typeCode: AUTHORISATION_TYPE_CODE.EXCISE_WAREHOUSE_EXW })
          ],
        },
      }, GOODS_CSV.IMMI_STANDALONE)
    );
  });
});
