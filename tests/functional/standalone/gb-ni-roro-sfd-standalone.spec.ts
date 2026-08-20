import { ReportLog } from '../../../src/core/report/report-log';
import { getBaseUrl, test } from '../../test-hooks';
import { COMPANY_PROFILE } from '../../../src/auth/credentials';
import { sfdStandaloneGoodsItem } from '../../../src/test-data/sfd-standalone-goods-item-data';
import { reportTestCaseLink } from '../../../src/helper/report-helper';
import { IMPORTER_COMPANY_NAME } from '../../../config/environment';

const SFD_STANDALONE = '4440';
const SFD_EIDR_STANDALONE = '4614';

test.describe('GB to NI RoRo SFD Standalone Declaration Process - Agent Represents Trader', () => {
  // The Agent signs in and then represents the importer, so the declaration is made on
  // the importer's behalf. The mirror describe below declares the same journeys with no
  // representation at all.
  test.use({ authProfile: COMPANY_PROFILE.AGENT });

  test.beforeEach(async ({ representTraderFlow }) => {
    await ReportLog.setFeature('GB to NI SFD Standalone Declaration Process');
    await representTraderFlow.representTrader(IMPORTER_COMPANY_NAME);
  });

  test('Verify SFD Standalone - Prelodged - RoRo (Accompanied) is created and submitted successfully (4000-000)', { tag: ['@smoke', '@happyPath'] }, async ({ createAndSubmitSfdStandaloneFlow }, testInfo) => {
    await ReportLog.setStory('SFD Standalone - Prelodged - RoRo (Accompanied)');
    reportTestCaseLink(SFD_STANDALONE);
    await ReportLog.step('Create and submit the SFD standalone declaration', () =>
      createAndSubmitSfdStandaloneFlow.completeSfdStandaloneFlow({
        testInfo,
        url: getBaseUrl(),
        consignmentOverrides: { isControlledGoods: true },
        goodsItemOverrides: sfdStandaloneGoodsItem(),
      })
    );
  });

  // An arrived movement is the same declaration minus the arrival date/time screen, and
  // it settles on "Arrived" instead of "Awaiting arrival" - the flow derives both from
  // isPreLodged, so the override below is the only difference from the test above.
  test('Verify SFD Standalone - Arrived - RoRo (Accompanied) is created and submitted successfully (4000-000)', { tag: ['@regression', '@e2e', '@happyPath'] }, async ({ createAndSubmitSfdStandaloneFlow }, testInfo) => {
    await ReportLog.setStory('SFD Standalone - Arrived - RoRo (Accompanied)');
    await ReportLog.step('Create and submit the SFD standalone declaration', () =>
      createAndSubmitSfdStandaloneFlow.completeSfdStandaloneFlow({
        testInfo,
        url: getBaseUrl(),
        consignmentOverrides: {
          isPreLodged: false,
          isControlledGoods: true,
        },
        goodsItemOverrides: sfdStandaloneGoodsItem(),
      })
    );
  });

  test('Verify SFD-EIDR Standalone - Prelodged - RoRo (Accompanied) is created and submitted successfully (4000-000)', { tag: ['@smoke'] }, async ({ createAndSubmitSfdStandaloneFlow }, testInfo) => {
    await ReportLog.setStory('SFD-EIDR Standalone - Prelodged - RoRo (Accompanied)');
    reportTestCaseLink(SFD_EIDR_STANDALONE);
    await ReportLog.step('Create and submit the SFD standalone declaration', () =>
      createAndSubmitSfdStandaloneFlow.completeSfdStandaloneFlow({
        testInfo,
        url: getBaseUrl(),
        consignmentOverrides: {
          isPreLodged: true,
          isControlledGoods: false,
        },
        goodsItemOverrides: sfdStandaloneGoodsItem(),
      })
    );
  });

  // EIDR is this family's exception: it is authorised outright whether the movement was
  // pre-lodged or arrived, having no arrival to wait for. That makes this test worth
  // running despite reading like the one above - it is the only one that proves the
  // arrived route does NOT settle on "Arrived".
  test('Verify SFD-EIDR Standalone - Arrived - RoRo (Accompanied) is created and submitted successfully (4000-000)', { tag: ['@regression', '@e2e', '@happyPath'] }, async ({ createAndSubmitSfdStandaloneFlow }, testInfo) => {
    await ReportLog.setStory('SFD-EIDR Standalone - Arrived - RoRo (Accompanied)');
    await ReportLog.step('Create and submit the SFD standalone declaration', () =>
      createAndSubmitSfdStandaloneFlow.completeSfdStandaloneFlow({
        testInfo,
        url: getBaseUrl(),
        consignmentOverrides: {
          isPreLodged: false,
          isControlledGoods: false,
        },
        goodsItemOverrides: sfdStandaloneGoodsItem(),
      })
    );
  });
});

test.describe('GB to NI RoRo SFD Standalone Declaration Process - Importer Declare by themself', () => {
  // The importer signs in as their OWN company, so there is NO representation and no
  // representTrader in the hook below. SFD has no "Representation information" screen
  // either way, so the journeys themselves are identical to the describe above - what
  // is under test here is that the same declarations are accepted from the trader
  // directly, without an agent standing in front of them.
  test.use({ authProfile: COMPANY_PROFILE.IMPORTER });

  test.beforeEach(async () => {
    await ReportLog.setFeature('GB to NI SFD Standalone Declaration Process');
  });

  test('Verify SFD Standalone - Prelodged - RoRo (Accompanied) - Importer Declare by themself is created and submitted successfully (4000-000)', { tag: ['@regression', '@e2e', '@happyPath'] }, async ({ createAndSubmitSfdStandaloneFlow }, testInfo) => {
    await ReportLog.setStory('SFD Standalone - Prelodged - RoRo (Accompanied) - Importer Declare by themself');
    await ReportLog.step('Create and submit the SFD standalone declaration', () =>
      createAndSubmitSfdStandaloneFlow.completeSfdStandaloneFlow({
        testInfo,
        url: getBaseUrl(),
        consignmentOverrides: { isControlledGoods: true },
        goodsItemOverrides: sfdStandaloneGoodsItem(),
      })
    );
  });

  test('Verify SFD Standalone - Arrived - RoRo (Accompanied) - Importer Declare by themself is created and submitted successfully (4000-000)', { tag: ['@regression', '@e2e', '@happyPath'] }, async ({ createAndSubmitSfdStandaloneFlow }, testInfo) => {
    await ReportLog.setStory('SFD Standalone - Arrived - RoRo (Accompanied) - Importer Declare by themself');
    await ReportLog.step('Create and submit the SFD standalone declaration', () =>
      createAndSubmitSfdStandaloneFlow.completeSfdStandaloneFlow({
        testInfo,
        url: getBaseUrl(),
        consignmentOverrides: {
          isPreLodged: false,
          isControlledGoods: true,
        },
        goodsItemOverrides: sfdStandaloneGoodsItem(),
      })
    );
  });

  test('Verify SFD-EIDR Standalone - Prelodged - RoRo (Accompanied) - Importer Declare by themself is created and submitted successfully (4000-000)', { tag: ['@regression', '@e2e', '@happyPath'] }, async ({ createAndSubmitSfdStandaloneFlow }, testInfo) => {
    await ReportLog.setStory('SFD-EIDR Standalone - Prelodged - RoRo (Accompanied) - Importer Declare by themself');
    await ReportLog.step('Create and submit the SFD standalone declaration', () =>
      createAndSubmitSfdStandaloneFlow.completeSfdStandaloneFlow({
        testInfo,
        url: getBaseUrl(),
        consignmentOverrides: {
          isPreLodged: true,
          isControlledGoods: false,
        },
        goodsItemOverrides: sfdStandaloneGoodsItem(),
      })
    );
  });

  test('Verify SFD-EIDR Standalone - Arrived - RoRo (Accompanied) - Importer Declare by themself is created and submitted successfully (4000-000)', { tag: ['@regression', '@e2e', '@happyPath'] }, async ({ createAndSubmitSfdStandaloneFlow }, testInfo) => {
    await ReportLog.setStory('SFD-EIDR Standalone - Arrived - RoRo (Accompanied) - Importer Declare by themself');
    await ReportLog.step('Create and submit the SFD standalone declaration', () =>
      createAndSubmitSfdStandaloneFlow.completeSfdStandaloneFlow({
        testInfo,
        url: getBaseUrl(),
        consignmentOverrides: {
          isPreLodged: false,
          isControlledGoods: false,
        },
        goodsItemOverrides: sfdStandaloneGoodsItem(),
      })
    );
  });
});
