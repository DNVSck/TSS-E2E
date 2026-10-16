import { ReportLog } from '../../../src/core/report/report-log';
import { test } from '../../base-test';
import { REPRESENTATION_TYPE } from '../../../src/constant/representation-type-constant';
import { COMPANY_PROFILE } from '../../../src/auth/credentials';
import { sfdStandaloneGoodsItem } from '../../../src/test-data/sfd-standalone-goods-item-data';
import { reportTestCaseLink } from '../../../src/helper/report-helper';
import { IMPORTER_COMPANY_NAME, BASE_URL } from '../../../config/environment';
import { PORT_OF_ARRIVAL } from '../../../src/constant/port-of-arrival-constant';
import { NIRMS_COMMODITY, nirmsGoodsItem } from '../../../src/test-data/nirms-data';
import { ADDITIONAL_PROCEDURE_CODES } from '../../../src/constant/additional-procedure-codes-constant';
import { CANCELLATION_REASON } from '../../../src/test-data/consignment-data';
import { sfdStandaloneRejectedByCds } from '../../../src/test-data/rejection-lever-data';
import { AUTHORISATION_TYPE_CODE } from '../../../src/constant/authorisation-type-code-constant';

const SFD_STANDALONE = '4440';
const SFD_EIDR_STANDALONE = '4614';
const SFD_NIRMS_N853 = '4929';
const EIDR_STANDALONE_CANCEL_DRAFT = '6878';
const EIDR_STANDALONE_CANCEL_AUTHORISED = '6880';
const EIDR_STANDALONE_CANCEL_NEEDS_REASON = '6945';
const EIDR_STANDALONE_CANCEL_DISMISSED = '6947';
const SFD_STANDALONE_ARRIVED = '7110';
const SFD_EIDR_STANDALONE_ARRIVED = '7111';
const SFD_STANDALONE_IMPORTER_ARRIVED = '7112';
const SFD_EIDR_STANDALONE_IMPORTER_ARRIVED = '7113';
const SFD_STANDALONE_IMPORTER_PRELODGED = '7114';
const SFD_EIDR_STANDALONE_IMPORTER_PRELODGED = '7115';
const SFD_STANDALONE_CANCEL_DRAFT = '7116';
const SFD_STANDALONE_CANCEL_TIR = '7117';
const SFD_STANDALONE_RESUBMIT = '7118';

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
        url: BASE_URL,
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
    reportTestCaseLink(SFD_STANDALONE_ARRIVED);
    const sfd = await ReportLog.step('Create and submit the SFD standalone declaration', () =>
      createAndSubmitSfdStandaloneFlow.completeSfdStandaloneFlow({
        testInfo,
        url: BASE_URL,
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
        url: BASE_URL,
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

test.describe('GB to NI RoRo SFD Standalone Declaration Process - Importer Declare by themself', () => {
  // The importer signs in as their OWN company, so there is NO representation and no
  // representTrader in the hook below - which is also why these journeys leave
  // representationType undefined: the "Representation information" screen the describe
  // above answers is never shown to a trader declaring for itself. What is under test
  // here is that the same declarations are accepted without an agent in front of them.
  test.use({ authProfile: COMPANY_PROFILE.IMPORTER });

  test.beforeEach(async () => {
    await ReportLog.setFeature('GB to NI SFD Standalone Declaration Process');
  });

  test('Verify SFD Standalone - Prelodged - RoRo (Accompanied) - Importer Declare by themself is created and submitted successfully (4000-000)', { tag: ['@regression', '@happyPath'] }, async ({ createAndSubmitSfdStandaloneFlow, triggerFinalStatusThroughCdsFlow }, testInfo) => {
    await ReportLog.setStory('SFD Standalone - Prelodged - RoRo (Accompanied) - Importer Declare by themself');
    reportTestCaseLink(SFD_STANDALONE_IMPORTER_PRELODGED);
    const sfd = await ReportLog.step('Create and submit the SFD standalone declaration', () =>
      createAndSubmitSfdStandaloneFlow.completeSfdStandaloneFlow({
        testInfo,
        url: BASE_URL,
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
    reportTestCaseLink(SFD_STANDALONE_IMPORTER_ARRIVED);
    const sfd = await ReportLog.step('Create and submit the SFD standalone declaration', () =>
      createAndSubmitSfdStandaloneFlow.completeSfdStandaloneFlow({
        testInfo,
        url: BASE_URL,
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
          portOfArrival: PORT_OF_ARRIVAL.WARRENPOINT_HARBOUR,
        },
        goodsItemOverrides: sfdStandaloneGoodsItem(),
      })
    );
  });
});

test.describe('GB to NI RoRo SFD Standalone Declaration Process - Cancellation', () => {
  test.use({ authProfile: COMPANY_PROFILE.IMPORTER });

  test.beforeEach(async () => {
    await ReportLog.setFeature('GB to NI SFD Standalone Declaration Process');
  });

  test('Verify a "Draft" SFD standalone consignment can be cancelled', { tag: ['@regression', '@cancellation'] }, async ({
    createDraftSfdStandaloneFlow, cancelConsignmentFlow
  }, testInfo) => {
    await ReportLog.setStory('SFD Standalone - cancel the consignment while it is still a draft');
    reportTestCaseLink(SFD_STANDALONE_CANCEL_DRAFT);

    await createDraftSfdStandaloneFlow.createDraftSfdStandalone({
      testInfo,
      url: BASE_URL,
      consignmentOverrides: { isControlledGoods: true },
      goodsItemOverrides: sfdStandaloneGoodsItem(),
    });

    await cancelConsignmentFlow.cancelConsignmentAndVerifyItIsCancelled(CANCELLATION_REASON);
  });

  test('Verify an SFD standalone consignment in "Trader Input Required" can be cancelled instead of corrected', { tag: ['@regression', '@cancellation'] }, async ({
    createAndSubmitSfdStandaloneFlow, cancelConsignmentFlow
  }, testInfo) => {
    await ReportLog.setStory('SFD Standalone - CDS hands it back, and the trader cancels rather than correcting');
    reportTestCaseLink(SFD_STANDALONE_CANCEL_TIR);

    await createAndSubmitSfdStandaloneFlow.completeSfdStandaloneFlow({
      testInfo,
      url: BASE_URL,
      consignmentOverrides: {
        isControlledGoods: true,
        holdersOfAuthorisation: [sfdStandaloneRejectedByCds()],
      },
      goodsItemOverrides: sfdStandaloneGoodsItem(),
      expectedStatusKey: 'status.traderInputRequired',
    });

    await cancelConsignmentFlow.cancelConsignmentAndVerifyItIsCancelled(CANCELLATION_REASON);
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


test.describe('GB to NI RoRo SFD Standalone Declaration Process - Resubmission after CDS refuses it', () => {
  test.use({ authProfile: COMPANY_PROFILE.IMPORTER });

  test.beforeEach(async () => {
    await ReportLog.setFeature('GB to NI SFD Standalone Declaration Process');
  });


  test('Verify an SFD standalone consignment in "Trader Input Required" by CDS can be corrected and resubmitted', {
    tag: ['@regression', '@resubmission'],
  }, async ({ createAndSubmitSfdStandaloneFlow, resubmitDeclarationFlow }, testInfo) => {
    await ReportLog.setStory('SFD Standalone - CDS refuses an authorisation the declaration should not carry, and the trader removes it and resubmits');
    reportTestCaseLink(SFD_STANDALONE_RESUBMIT);

    await ReportLog.step('Declare a standalone SFD CDS will refuse', () =>
      createAndSubmitSfdStandaloneFlow.completeSfdStandaloneFlow({
        testInfo,
        url: BASE_URL,
        consignmentOverrides: {
          isControlledGoods: true,
          holdersOfAuthorisation: [sfdStandaloneRejectedByCds()],
        },
        goodsItemOverrides: sfdStandaloneGoodsItem(),
        expectedStatusKey: 'status.traderInputRequired',
      })
    );

    await resubmitDeclarationFlow.removeAuthorisationAndResubmitStandaloneSfd(
      AUTHORISATION_TYPE_CODE.EXCISE_WAREHOUSE_EXW
    );
  });
});
