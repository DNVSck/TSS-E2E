import { ReportLog } from '../../../src/core/report/report-log';
import { getBaseUrl, test } from '../../test-hooks';
import { COMPANY_PROFILE } from '../../../src/auth/credentials';
import { sfdStandaloneGoodsItem } from '../../../src/test-data/sfd-standalone-goods-item-data';
import { reportTestCaseLink } from '../../../src/helper/report-helper';

const SFD_STANDALONE = '4440';
const SFD_EIDR_STANDALONE = '4614';

test.describe('GB to NI RoRo SFD Standalone Declaration Process - Agent Represents Trader', () => {
  // Runs as the Agent's OWN company: standalone journeys do NOT represent a trader.
  test.use({ authProfile: COMPANY_PROFILE.AGENT });

  test.beforeEach(async () => {
    await ReportLog.setFeature('GB to NI SFD Standalone Declaration Process');
  });

  test('Verify SFD Standalone - Prelodged - RoRo (Accompanied) is created and submitted successfully', { tag: ['@smoke'] }, async ({ createAndSubmitSfdStandaloneFlow }, testInfo) => {
    await ReportLog.setStory('SFD Standalone - Prelodged - RoRo (Accompanied)');
    reportTestCaseLink(SFD_STANDALONE);
    await createAndSubmitSfdStandaloneFlow.completeSfdStandaloneFlow({
      testInfo,
      url: getBaseUrl(),
      consignmentOverrides: { isControlledGoods: true },
      goodsItemOverrides: sfdStandaloneGoodsItem({ areGoodsControlled: false }),
    });
  });

  test('Verify SFD-EIDR Standalone - Prelodged - RoRo (Accompanied) is created and submitted successfully', { tag: ['@smoke'] }, async ({ createAndSubmitSfdStandaloneFlow }, testInfo) => {
    await ReportLog.setStory('SFD-EIDR Standalone - Prelodged - RoRo (Accompanied)');
    reportTestCaseLink(SFD_EIDR_STANDALONE);
    await createAndSubmitSfdStandaloneFlow.completeSfdStandaloneFlow({
      testInfo,
      url: getBaseUrl(),
      consignmentOverrides: {
        isPreLodged: true,
        isControlledGoods: false,
      },
      goodsItemOverrides: sfdStandaloneGoodsItem(),
    });
  });
});
