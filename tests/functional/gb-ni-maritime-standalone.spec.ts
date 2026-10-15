import { ReportLog } from '../../src/core/report/report-log';
import { test } from '../base-test';
import { COMPANY_PROFILE } from '../../src/auth/credentials';
import { IMPORTER_COMPANY_NAME, BASE_URL } from '../../config/environment';
import { REPRESENTATION_TYPE } from '../../src/constant/representation-type-constant';
import { PROCEDURE_CODES } from '../../src/constant/procedure-codes-constant';
import { ADDITIONAL_PROCEDURE_CODES } from '../../src/constant/additional-procedure-codes-constant';
import { sfdStandaloneByMaritime } from '../../src/test-data/sfd-standalone-consignment-data';
import { sfdStandaloneGoodsItem } from '../../src/test-data/sfd-standalone-goods-item-data';
import { immiStandaloneByMaritime } from '../../src/test-data/immi-standalone-consignment-data';
import {
  immiStandaloneGoodsItem, IMMI_STANDALONE_COMMODITY_CODE,
} from '../../src/test-data/immi-standalone-goods-item-data';

test.describe('GB to NI Maritime Standalone Declaration Process - Agent Represents Trader', () => {
  test.use({ authProfile: COMPANY_PROFILE.AGENT });

  test.beforeEach(async ({ representTraderFlow }) => {
    await ReportLog.setFeature('GB to NI Maritime Standalone Declaration Process');
    await representTraderFlow.representTrader(IMPORTER_COMPANY_NAME);
  });

  test('Verify SFD Standalone - Prelodged - Maritime is created and submitted successfully (4000-000)', { tag: ['@maritime', '@regression', '@happyPath'] }, async ({ createAndSubmitSfdStandaloneFlow, triggerFinalStatusThroughCdsFlow }, testInfo) => {
    await ReportLog.setStory('SFD Standalone - Prelodged - Maritime');
    const sfd = await ReportLog.step('Create and submit the SFD standalone declaration', () =>
      createAndSubmitSfdStandaloneFlow.completeSfdStandaloneFlow(sfdStandaloneByMaritime({
        testInfo,
        url: BASE_URL,
        consignmentOverrides: {
          representationType: REPRESENTATION_TYPE.DIRECT,
          isControlledGoods: true,
        },
        goodsItemOverrides: sfdStandaloneGoodsItem(),
      }))
    );

    await ReportLog.step('Arrive the standalone SFD through CDS', () =>
      triggerFinalStatusThroughCdsFlow.arriveStandaloneSfd(sfd)
    );
  });

  test('Verify SFD-EIDR Standalone - Prelodged - Maritime is created and submitted successfully (4000-000)', { tag: ['@maritime', '@regression', '@happyPath'] }, async ({ createAndSubmitSfdStandaloneFlow }, testInfo) => {
    await ReportLog.setStory('SFD-EIDR Standalone - Prelodged - Maritime');
    await ReportLog.step('Create and submit the SFD standalone declaration', () =>
      createAndSubmitSfdStandaloneFlow.completeSfdStandaloneFlow(sfdStandaloneByMaritime({
        testInfo,
        url: BASE_URL,
        consignmentOverrides: {
          representationType: REPRESENTATION_TYPE.DIRECT,
          isControlledGoods: false,
        },
        goodsItemOverrides: sfdStandaloneGoodsItem(),
      }))
    );
  });

  test('Verify IMMI Standalone - Prelodged - Maritime - Direct is created and submitted successfully (4000-1EN)', { tag: ['@maritime', '@regression', '@happyPath'] }, async ({ createAndSubmitImmiStandaloneFlow, triggerFinalStatusThroughCdsFlow }, testInfo) => {
    await ReportLog.setStory('IMMI Standalone - Prelodged - Maritime - Direct');
    const immi = await ReportLog.step('Create and submit the IMMI standalone declaration', () =>
      createAndSubmitImmiStandaloneFlow.completeImmiStandaloneFlow(immiStandaloneByMaritime({
        testInfo,
        url: BASE_URL,
        consignmentOverrides: {
          representationType: REPRESENTATION_TYPE.DIRECT,
        },
        goodsItemOverrides: immiStandaloneGoodsItem({
          procedureCode: PROCEDURE_CODES.FREE_CIRCULATION_4000,
          additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.SPIMM_CATEGORY_2_EXCISE_1EN,
          commodityCode: IMMI_STANDALONE_COMMODITY_CODE.EIGHT_DIGIT,
        }),
      }))
    );

    await ReportLog.step('Close the standalone IMMI through CDS', () =>
      triggerFinalStatusThroughCdsFlow.closeStandaloneImmi(immi)
    );
  });
});
