import { ReportLog } from '../../../src/core/report/report-log';
import { test } from '../../base-test';
import { REPRESENTATION_TYPE } from '../../../src/constant/representation-type-constant';
import { COMPANY_PROFILE } from '../../../src/auth/credentials';
import { sfdStandaloneGoodsItem } from '../../../src/test-data/sfd-standalone-goods-item-data';
import { reportTestCaseLink } from '../../../src/helper/report-helper';
import { IMPORTER_COMPANY_NAME, BASE_URL } from '../../../config/environment';
import { PORT_OF_ARRIVAL } from '../../../src/constant/port-of-arrival-constant';
import { CANCELLATION_REASON } from '../../../src/test-data/consignment-data';

const SFD_EIDR_STANDALONE = '4614';
const EIDR_STANDALONE_CANCEL_DRAFT = '6878';
const EIDR_STANDALONE_CANCEL_AUTHORISED = '6880';
const EIDR_STANDALONE_CANCEL_NEEDS_REASON = '6945';
const EIDR_STANDALONE_CANCEL_DISMISSED = '6947';
const SFD_EIDR_STANDALONE_ARRIVED = '7111';
const SFD_EIDR_STANDALONE_IMPORTER_ARRIVED = '7113';
const SFD_EIDR_STANDALONE_IMPORTER_PRELODGED = '7115';

test.describe('GB to NI RoRo EIDR Standalone Declaration Process - Agent Represents Trader', () => {
  test.use({ authProfile: COMPANY_PROFILE.AGENT });

  test.beforeEach(async ({ representTraderFlow }) => {
    await ReportLog.setFeature('GB to NI EIDR Standalone Declaration Process');
    await representTraderFlow.representTrader(IMPORTER_COMPANY_NAME);
  });

  test('Verify SFD-EIDR Standalone - Prelodged - RoRo (Accompanied) is created and submitted successfully (4000-000)', { tag: ['@smoke', '@regression'] }, async ({ createAndSubmitSfdStandaloneFlow }, testInfo) => {
    await ReportLog.setStory('SFD-EIDR Standalone - Prelodged - RoRo (Accompanied)');
    reportTestCaseLink(SFD_EIDR_STANDALONE);
    await ReportLog.step('Create and submit the SFD standalone declaration', () =>
      createAndSubmitSfdStandaloneFlow.completeSfdStandaloneFlow({
        testInfo,
        url: BASE_URL,
        consignmentOverrides: {
          representationType: REPRESENTATION_TYPE.DIRECT,
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
  test('Verify SFD-EIDR Standalone - Arrived - RoRo (Accompanied) is created and submitted successfully (4000-000)', { tag: ['@regression', '@happyPath'] }, async ({ createAndSubmitSfdStandaloneFlow }, testInfo) => {
    await ReportLog.setStory('SFD-EIDR Standalone - Arrived - RoRo (Accompanied)');
    reportTestCaseLink(SFD_EIDR_STANDALONE_ARRIVED);
    await ReportLog.step('Create and submit the SFD standalone declaration', () =>
      createAndSubmitSfdStandaloneFlow.completeSfdStandaloneFlow({
        testInfo,
        url: BASE_URL,
        consignmentOverrides: {
          representationType: REPRESENTATION_TYPE.DIRECT,
          isPreLodged: false,
          isControlledGoods: false,
          portOfArrival: PORT_OF_ARRIVAL.WARRENPOINT_GVMS_PORT,
        },
        goodsItemOverrides: sfdStandaloneGoodsItem(),
      })
    );
  });
});

test.describe('GB to NI RoRo EIDR Standalone Declaration Process - Importer Declare by themself', () => {
  test.use({ authProfile: COMPANY_PROFILE.IMPORTER });

  test.beforeEach(async () => {
    await ReportLog.setFeature('GB to NI EIDR Standalone Declaration Process');
  });

  test('Verify SFD-EIDR Standalone - Prelodged - RoRo (Accompanied) - Importer Declare by themself is created and submitted successfully (4000-000)', { tag: ['@regression', '@happyPath'] }, async ({ createAndSubmitSfdStandaloneFlow }, testInfo) => {
    await ReportLog.setStory('SFD-EIDR Standalone - Prelodged - RoRo (Accompanied) - Importer Declare by themself');
    reportTestCaseLink(SFD_EIDR_STANDALONE_IMPORTER_PRELODGED);
    await ReportLog.step('Create and submit the SFD standalone declaration', () =>
      createAndSubmitSfdStandaloneFlow.completeSfdStandaloneFlow({
        testInfo,
        url: BASE_URL,
        consignmentOverrides: {
          isPreLodged: true,
          isControlledGoods: false,
        },
        goodsItemOverrides: sfdStandaloneGoodsItem(),
      })
    );
  });

  test('Verify SFD-EIDR Standalone - Arrived - RoRo (Accompanied) - Importer Declare by themself is created and submitted successfully (4000-000)', { tag: ['@regression', '@happyPath'] }, async ({ createAndSubmitSfdStandaloneFlow }, testInfo) => {
    await ReportLog.setStory('SFD-EIDR Standalone - Arrived - RoRo (Accompanied) - Importer Declare by themself');
    reportTestCaseLink(SFD_EIDR_STANDALONE_IMPORTER_ARRIVED);
    await ReportLog.step('Create and submit the SFD standalone declaration', () =>
      createAndSubmitSfdStandaloneFlow.completeSfdStandaloneFlow({
        testInfo,
        url: BASE_URL,
        consignmentOverrides: {
          isPreLodged: false,
          isControlledGoods: false,
          portOfArrival: PORT_OF_ARRIVAL.WARRENPOINT_GVMS_PORT,
        },
        goodsItemOverrides: sfdStandaloneGoodsItem(),
      })
    );
  });
});

test.describe('GB to NI RoRo EIDR Standalone Declaration Process - Cancellation', () => {
  test.use({ authProfile: COMPANY_PROFILE.IMPORTER });

  test.beforeEach(async () => {
    await ReportLog.setFeature('GB to NI EIDR Standalone Declaration Process');
  });

  test('Verify a "Draft" EIDR standalone consignment can be cancelled', { tag: ['@regression', '@cancellation'] }, async ({
    createDraftSfdStandaloneFlow, cancelConsignmentFlow
  }, testInfo) => {
    await ReportLog.setStory('EIDR Standalone - cancel the consignment while it is still a draft');
    reportTestCaseLink(EIDR_STANDALONE_CANCEL_DRAFT);

    await createDraftSfdStandaloneFlow.createDraftSfdStandalone({
      testInfo,
      url: BASE_URL,
      consignmentOverrides: { isControlledGoods: false },
      goodsItemOverrides: sfdStandaloneGoodsItem(),
    });

    await cancelConsignmentFlow.cancelConsignmentAndVerifyItIsCancelled(CANCELLATION_REASON);
  });

  test('Verify an EIDR standalone consignment cannot be cancelled without a reason', { tag: ['@regression', '@cancellation'] }, async ({
    createDraftSfdStandaloneFlow, cancelConsignmentFlow
  }, testInfo) => {
    await ReportLog.setStory('EIDR Standalone - the service refuses a cancellation with no reason');
    reportTestCaseLink(EIDR_STANDALONE_CANCEL_NEEDS_REASON);

    await createDraftSfdStandaloneFlow.createDraftSfdStandalone({
      testInfo,
      url: BASE_URL,
      consignmentOverrides: { isControlledGoods: false },
      goodsItemOverrides: sfdStandaloneGoodsItem(),
    });

    await cancelConsignmentFlow.verifyCancellationNeedsAReason();
  });

  test('Verify an EIDR standalone consignment survives going back from the cancel screen', { tag: ['@regression', '@cancellation'] }, async ({
    createDraftSfdStandaloneFlow, cancelConsignmentFlow
  }, testInfo) => {
    await ReportLog.setStory('EIDR Standalone - open the cancel screen, go back, and the declaration is untouched');
    reportTestCaseLink(EIDR_STANDALONE_CANCEL_DISMISSED);

    await createDraftSfdStandaloneFlow.createDraftSfdStandalone({
      testInfo,
      url: BASE_URL,
      consignmentOverrides: { isControlledGoods: false },
      goodsItemOverrides: sfdStandaloneGoodsItem(),
    });

    await cancelConsignmentFlow.verifyCancellationCanBeDismissed('status.draft');
  });

  test('Verify an EIDR standalone consignment already "Authorised" can be cancelled', { tag: ['@regression', '@cancellation'] }, async ({
    createAndSubmitSfdStandaloneFlow, cancelConsignmentFlow
  }, testInfo) => {
    await ReportLog.setStory('EIDR Standalone - cancel the consignment after the service has authorised it');
    reportTestCaseLink(EIDR_STANDALONE_CANCEL_AUTHORISED);

    await createAndSubmitSfdStandaloneFlow.completeSfdStandaloneFlow({
      testInfo,
      url: BASE_URL,
      consignmentOverrides: { isControlledGoods: false },
      goodsItemOverrides: sfdStandaloneGoodsItem(),
    });

    await cancelConsignmentFlow.cancelConsignmentAndVerifyItIsCancelled(CANCELLATION_REASON);
  });
});
