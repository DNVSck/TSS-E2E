import { ReportLog } from '../../../src/core/report/report-log';
import { getBaseUrl, test } from '../../test-hooks';
import { REPRESENTATION_TYPE } from '../../../src/constant/representation-type-constant';
import { COMPANY_PROFILE } from '../../../src/auth/credentials';
import { sfdStandaloneGoodsItem } from '../../../src/test-data/sfd-standalone-goods-item-data';
import { reportTestCaseLink } from '../../../src/helper/report-helper';
import { IMPORTER_COMPANY_NAME } from '../../../config/environment';
import { PORT_OF_ARRIVAL } from '../../../src/constant/port-of-arrival-constant';
import { NIRMS_COMMODITY, nirmsGoodsItem } from '../../../src/test-data/nirms-data';
import { ADDITIONAL_PROCEDURE_CODES } from '../../../src/constant/additional-procedure-codes-constant';

const SFD_STANDALONE = '4440';
const SFD_EIDR_STANDALONE = '4614';
const SFD_NIRMS_N853 = '4929';

test.describe('GB to NI RoRo SFD Standalone Declaration Process - Agent Represents Trader', () => {
  // The Agent signs in and then represents the importer, so the declaration is made on
  // the importer's behalf. The mirror describe below declares the same journeys with no
  // representation at all.
  test.use({ authProfile: COMPANY_PROFILE.AGENT });

  test.beforeEach(async ({ representTraderFlow }) => {
    await ReportLog.setFeature('GB to NI SFD Standalone Declaration Process');
    await representTraderFlow.representTrader(IMPORTER_COMPANY_NAME);
  });

  test('Verify SFD Standalone - Prelodged - RoRo (Accompanied) is created and submitted successfully (4000-000)', { tag: ['@smoke', '@regression', '@happyPath'] }, async ({ createAndSubmitSfdStandaloneFlow, triggerFinalStatusThroughCdsFlow }, testInfo) => {
    await ReportLog.setStory('SFD Standalone - Prelodged - RoRo (Accompanied)');
    reportTestCaseLink(SFD_STANDALONE);
    const sfd = await ReportLog.step('Create and submit the SFD standalone declaration', () =>
      createAndSubmitSfdStandaloneFlow.completeSfdStandaloneFlow({
        testInfo,
        url: getBaseUrl(),
        consignmentOverrides: {
          representationType: REPRESENTATION_TYPE.DIRECT, 
          isControlledGoods: true,
        },
        goodsItemOverrides: sfdStandaloneGoodsItem(),
      })
    );

    await ReportLog.step('Arrive the standalone SFD through CDS', () =>
      triggerFinalStatusThroughCdsFlow.arriveStandaloneSfd(sfd)
    );
  });

  // An arrived movement is the same declaration minus the arrival date/time screen, and
  // it settles on "Arrived" instead of "Awaiting arrival" - the flow derives both from
  // isPreLodged, so the override below is the only difference from the test above.
  test('Verify SFD Standalone - Arrived - RoRo (Accompanied) is created and submitted successfully (4000-000)', { tag: ['@regression', '@happyPath'] }, async ({ createAndSubmitSfdStandaloneFlow, triggerFinalStatusThroughCdsFlow }, testInfo) => {
    await ReportLog.setStory('SFD Standalone - Arrived - RoRo (Accompanied)');
    const sfd = await ReportLog.step('Create and submit the SFD standalone declaration', () =>
      createAndSubmitSfdStandaloneFlow.completeSfdStandaloneFlow({
        testInfo,
        url: getBaseUrl(),
        consignmentOverrides: {
          representationType: REPRESENTATION_TYPE.DIRECT,
          isPreLodged: false,
          isControlledGoods: true,
          portOfArrival: PORT_OF_ARRIVAL.WARRENPOINT_HARBOUR,
        },
        goodsItemOverrides: sfdStandaloneGoodsItem(),
      })
    );

    await ReportLog.step('Arrive the standalone SFD through CDS', () =>
      triggerFinalStatusThroughCdsFlow.arriveStandaloneSfd(sfd)
    );
  });

  test('Verify SFD-EIDR Standalone - Prelodged - RoRo (Accompanied) is created and submitted successfully (4000-000)', { tag: ['@smoke', '@regression'] }, async ({ createAndSubmitSfdStandaloneFlow }, testInfo) => {
    await ReportLog.setStory('SFD-EIDR Standalone - Prelodged - RoRo (Accompanied)');
    reportTestCaseLink(SFD_EIDR_STANDALONE);
    await ReportLog.step('Create and submit the SFD standalone declaration', () =>
      createAndSubmitSfdStandaloneFlow.completeSfdStandaloneFlow({
        testInfo,
        url: getBaseUrl(),
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
    await ReportLog.step('Create and submit the SFD standalone declaration', () =>
      createAndSubmitSfdStandaloneFlow.completeSfdStandaloneFlow({
        testInfo,
        url: getBaseUrl(),
        consignmentOverrides: {
          representationType: REPRESENTATION_TYPE.DIRECT,
          isPreLodged: false,
          isControlledGoods: false,
          portOfArrival: PORT_OF_ARRIVAL.WARRENPOINT_HARBOUR,
        },
        goodsItemOverrides: sfdStandaloneGoodsItem(),
      })
    );
  });

  test('Verify SFD Standalone - Prelodged - RoRo (Accompanied) using NIRMS is created and submitted successfully (4000-1CG)', { tag: ['@regression', '@happyPath', '@nirms'] }, async ({ createAndSubmitSfdStandaloneFlow, triggerFinalStatusThroughCdsFlow }, testInfo) => {
    await ReportLog.setStory('SFD Standalone - Prelodged - RoRo (Accompanied) - NIRMS');
    reportTestCaseLink(SFD_NIRMS_N853);
    const sfd = await ReportLog.step('Create and submit the SFD standalone declaration', () =>
      createAndSubmitSfdStandaloneFlow.completeSfdStandaloneFlow({
        testInfo,
        url: getBaseUrl(),
        consignmentOverrides: {
          representationType: REPRESENTATION_TYPE.DIRECT,
          isControlledGoods: true,
        },
        goodsItemOverrides: sfdStandaloneGoodsItem({
          ...nirmsGoodsItem(NIRMS_COMMODITY.LIVE_CARP),
          additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.CONTROLLED_GOODS_SIMPLIFIED_1CG,
          documentReferences: [
          ...NIRMS_COMMODITY.LIVE_CARP.supportingDocuments,
          ],
        }),
      })
    );

    await ReportLog.step('Arrive the standalone SFD through CDS', () =>
      triggerFinalStatusThroughCdsFlow.arriveStandaloneSfd(sfd)
    );
  });

});

test.describe('GB to NI RoRo SFD Standalone Declaration Process - Importer Declare by themself', { lock: COMPANY_PROFILE.IMPORTER }, () => {
  // The importer signs in as their OWN company, so there is NO representation and no
  // representTrader in the hook below - which is also why these journeys leave
  // representationType undefined: the "Representation information" screen the describe
  // above answers is never shown to a trader declaring for itself. What is under test
  // here is that the same declarations are accepted without an agent in front of them.
  // The lock on the describe above: this company has one login, so its tests take
  // turns wherever they live. Every spec running as it must name the same lock.
  test.use({ authProfile: COMPANY_PROFILE.IMPORTER });

  test.beforeEach(async () => {
    await ReportLog.setFeature('GB to NI SFD Standalone Declaration Process');
  });

  test('Verify SFD Standalone - Prelodged - RoRo (Accompanied) - Importer Declare by themself is created and submitted successfully (4000-000)', { tag: ['@regression', '@happyPath'] }, async ({ createAndSubmitSfdStandaloneFlow, triggerFinalStatusThroughCdsFlow }, testInfo) => {
    await ReportLog.setStory('SFD Standalone - Prelodged - RoRo (Accompanied) - Importer Declare by themself');
    const sfd = await ReportLog.step('Create and submit the SFD standalone declaration', () =>
      createAndSubmitSfdStandaloneFlow.completeSfdStandaloneFlow({
        testInfo,
        url: getBaseUrl(),
        consignmentOverrides: { isControlledGoods: true },
        goodsItemOverrides: sfdStandaloneGoodsItem(),
      })
    );

    await ReportLog.step('Arrive the standalone SFD through CDS', () =>
      triggerFinalStatusThroughCdsFlow.arriveStandaloneSfd(sfd)
    );
  });

  test('Verify SFD Standalone - Arrived - RoRo (Accompanied) - Importer Declare by themself is created and submitted successfully (4000-000)', { tag: ['@regression', '@happyPath', '@smoke'] }, async ({ createAndSubmitSfdStandaloneFlow, triggerFinalStatusThroughCdsFlow }, testInfo) => {
    await ReportLog.setStory('SFD Standalone - Arrived - RoRo (Accompanied) - Importer Declare by themself');
    const sfd = await ReportLog.step('Create and submit the SFD standalone declaration', () =>
      createAndSubmitSfdStandaloneFlow.completeSfdStandaloneFlow({
        testInfo,
        url: getBaseUrl(),
        consignmentOverrides: {
          isPreLodged: false,
          isControlledGoods: true,
          portOfArrival: PORT_OF_ARRIVAL.WARRENPOINT_HARBOUR,
        },
        goodsItemOverrides: sfdStandaloneGoodsItem(),
      })
    );

    await ReportLog.step('Arrive the standalone SFD through CDS', () =>
      triggerFinalStatusThroughCdsFlow.arriveStandaloneSfd(sfd)
    );
  });

  test('Verify SFD-EIDR Standalone - Prelodged - RoRo (Accompanied) - Importer Declare by themself is created and submitted successfully (4000-000)', { tag: ['@regression', '@happyPath'] }, async ({ createAndSubmitSfdStandaloneFlow }, testInfo) => {
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

  test('Verify SFD-EIDR Standalone - Arrived - RoRo (Accompanied) - Importer Declare by themself is created and submitted successfully (4000-000)', { tag: ['@regression', '@happyPath'] }, async ({ createAndSubmitSfdStandaloneFlow }, testInfo) => {
    await ReportLog.setStory('SFD-EIDR Standalone - Arrived - RoRo (Accompanied) - Importer Declare by themself');
    await ReportLog.step('Create and submit the SFD standalone declaration', () =>
      createAndSubmitSfdStandaloneFlow.completeSfdStandaloneFlow({
        testInfo,
        url: getBaseUrl(),
        consignmentOverrides: {
          isPreLodged: false,
          isControlledGoods: false,
          portOfArrival: PORT_OF_ARRIVAL.WARRENPOINT_HARBOUR,
        },
        goodsItemOverrides: sfdStandaloneGoodsItem(),
      })
    );
  });
});
