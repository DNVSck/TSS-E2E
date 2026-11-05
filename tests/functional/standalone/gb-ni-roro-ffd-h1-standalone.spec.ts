import { ReportLog } from '../../../src/core/report/report-log';
import { test } from '../../base-test';
import { COMPANY_PROFILE, isProfileConfigured, lockWhenSingleAccount } from '../../../src/auth/credentials';
import { IMPORTER_COMPANY_NAME, IMPORTER_IPO, TSS_DDA_EORI, TSS_DDA_COMPANY_NAME, BASE_URL, FISCAL_HOLD_EORI } from '../../../config/environment';
import { TYPE_OF_MOVEMENT_OPTION_CODE } from '../../../src/constant/type-of-movement-code-constant';
import { ffdH1StandaloneGoodsItem, ffdH1InwardProcessingAbdGoodsItem, ffdH1AtRiskEuCapGoodsItem, ffdH1NidomGoodsItem, ffdH1NotAtRiskGoodsItem, ffdH1AtRiskGoodsItem, ffdH1AtRiskSubsidyAppliedGoodsItem, ffdH1StandardFrontierGoodsItem, ffdH1StandardFrontierMultipleGoodsItems } from '../../../src/test-data/ffd-standalone-goods-item-data';
import { ffdH1GbNiRiskArrivedConsignment, ffdH1GbNiSubsidyAppliedArrivedConsignment, ffdH1StandardFrontierArrivedConsignment, ffdH1StandardFrontierMultipleGoodsArrivedConsignment } from '../../../src/test-data/ffd-standalone-consignment-data';
import { METHOD_OF_PAYMENT } from '../../../src/constant/method-of-payment-constant';
import { inwardProcessingLocationOfGoods } from '../../../src/helper/location-of-goods-helper';
import { CANCELLATION_REASON } from '../../../src/test-data/consignment-data';
import { ffdH1StandaloneRejectedByCds } from '../../../src/test-data/rejection-lever-data';
import { AUTHORISATION_TYPE_CODE } from '../../../src/constant/authorisation-type-code-constant';
import { visaCard } from '../../../src/test-data/payment-card-data';
import { GOODS_CSV } from '../../../src/test-data/goods-csv-data';
import { PORT_OF_ARRIVAL } from '../../../src/constant/port-of-arrival-constant';
import { UNLOCODE } from '../../../src/constant/unlocode-constant';
import { CONSIGNMENT_GOODS_DOMESTIC_STATUS } from '../../../src/constant/consignment-goods-domestic-status-constant';
import { previousDocument355, previousDocumentDCR } from '../../../src/test-data/previous-document-data';
import { NATURE_OF_GOODS } from '../../../src/constant/nature-of-goods-constant';
import { reportTestCaseLink } from '../../../src/helper/report-helper';

const FFD_AT_RISK_EU_CAP_PRELODGED = '6199';
const FFD_NIDOM_PRELODGED = '6206';
const FFD_NOT_AT_RISK_ARRIVED = '6233';
const FFD_AT_RISK_ARRIVED = '6227';
const FFD_AT_RISK_SUBSIDY_APPLIED_ARRIVED = '6239';
const FFD_STANDARD_FRONTIER_ARRIVED = '6251';
const FFD_STANDARD_FRONTIER_MULTIPLE_GOODS_ARRIVED = '6283';


test.describe('GB to NI RoRo FFD H1 Standalone Declaration Process - Agent Represents Trader', () => {
  // FFD = the app's "Standard Declaration" standalone journey.
  test.use({ authProfile: COMPANY_PROFILE.AGENT });

  test.beforeEach(async ({representTraderFlow}) => {
    await ReportLog.setFeature('GB to NI FFD H1 Standalone Declaration Process');
    await representTraderFlow.representTrader(IMPORTER_COMPANY_NAME);
  });

  test('Verify FFD H1 Standalone - Arrived - RoRo (Unaccompanied) - Trader DDA is created and submitted successfully (4000-000)', { tag: ['@smoke', '@ffd', '@regression', '@happyPath'] }, async ({ createAndSubmitFfdH1StandaloneFlow }, testInfo) => {
    await ReportLog.setStory('FFD H1 Standalone - Arrived - RoRo (Unaccompanied) - Trader DDA');
    await createAndSubmitFfdH1StandaloneFlow.declareAndClose({
      testInfo,
      url: BASE_URL,
      consignmentOverrides: {
        isPreLodged: false,
        typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_UNACCOMPANIED,
      },
    });
  });
});


test.describe('GB to NI RoRo FFD H1 Standalone Declaration Process - Importer Declare by themself', () => {
  // The importer signs in as their OWN company, so there is NO representation:
  // no representTrader here, and representationType is left undefined so the flow
  // skips the "Representation information" screen.

  test.use({ authProfile: COMPANY_PROFILE.IMPORTER });

  test.beforeEach(async () => {
    await ReportLog.setFeature('GB to NI FFD Standalone Declaration Process');
  });

  test('Verify FFD Standalone - Prelodged - RoRo (Accompanied) - Trader DDA - Importer Declare by themself is created and submitted successfully (4000-000)', { tag: ['@ffd', '@regression', '@happyPath'] }, async ({ createAndSubmitFfdH1StandaloneFlow }, testInfo) => {
    await ReportLog.setStory('FFD Standalone - Prelodged - RoRo (Accompanied) - Trader DDA - Importer Declare by themself');
    await createAndSubmitFfdH1StandaloneFlow.declareAndClose({
      testInfo,
      url: BASE_URL,
      consignmentOverrides: {
        typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
        // Signed in as the importer's own company, so the app never shows the
        // representation screen. The default is DIRECT, so it must be cleared here -
        // the same override the IMMI standalone self-login test carries.
        representationType: undefined,
      },
    });
  });

  // Accompanied and unaccompanied differ by one screen: the vehicle registration
  // becomes the trailer registration. Everything after it is the same journey.
  test('Verify FFD H1 Standalone - Arrived - RoRo (Accompanied) - Inward Processing by AbD - Importer Declare by themself is created and submitted successfully (4051-1EN)', { tag: ['@ffd', '@regression', '@happyPath'] }, async ({ createAndSubmitFfdH1StandaloneFlow }, testInfo) => {
    await ReportLog.setStory('FFD H1 Standalone - Arrived - RoRo (Accompanied) - Inward Processing by AbD - Importer Declare by themself - 4051 - 1EN');
    await createAndSubmitFfdH1StandaloneFlow.declareAndClose({
      testInfo,
      url: BASE_URL,
      consignmentOverrides: {
        isPreLodged: false,
        typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
        representationType: undefined,
        locationOfGoods: inwardProcessingLocationOfGoods(IMPORTER_IPO),
        methodOfPayment: METHOD_OF_PAYMENT.IMMEDIATE_PAYMENT_BY_ELECTRONIC_TRANSFER,
      },
      goodsItemOverrides: ffdH1InwardProcessingAbdGoodsItem(),
      expectedStatusKey: 'status.awaitingImmediatePayment',
    });
  });
});


test.describe('GB to NI RoRo FFD H1 Standalone Declaration Process - Cancellation', () => {
  test.use({ authProfile: COMPANY_PROFILE.AGENT });

  test.beforeEach(async ({ representTraderFlow }) => {
    await ReportLog.setFeature('GB to NI FFD H1 Standalone Declaration Process');
    await representTraderFlow.representTrader(IMPORTER_COMPANY_NAME);
  });

  test('Verify a "Draft" FFD H1 standalone consignment can be cancelled', { tag: ['@ffd', '@regression', '@cancellation'] }, async ({
    createDraftFfdH1StandaloneFlow, cancelConsignmentFlow,
  }, testInfo) => {
    await ReportLog.setStory('FFD H1 Standalone - cancel the consignment while it is still a draft');

    await createDraftFfdH1StandaloneFlow.createDraftFfdH1Standalone({
      testInfo,
      url: BASE_URL,
    });

    await cancelConsignmentFlow.cancelConsignmentAndVerifyItIsCancelled(CANCELLATION_REASON);
  });

  test('Verify an FFD H1 standalone consignment in "Trader Input Required" can be cancelled instead of corrected', { tag: ['@ffd', '@regression', '@cancellation'] }, async ({
    createAndSubmitFfdH1StandaloneFlow, cancelConsignmentFlow,
  }, testInfo) => {
    await ReportLog.setStory('FFD H1 Standalone - CDS hands it back, and the trader cancels rather than correcting');

    await ReportLog.step('Declare a standalone FFD H1 CDS will refuse', () =>
      createAndSubmitFfdH1StandaloneFlow.completeFfdH1StandaloneFlow({
        testInfo,
        url: BASE_URL,
        consignmentOverrides: {
          holdersOfAuthorisation: [ffdH1StandaloneRejectedByCds()],
        },
        expectedStatusKey: 'status.traderInputRequired',
        expectsTir: true,
      })
    );

    await cancelConsignmentFlow.cancelConsignmentAndVerifyItIsCancelled(CANCELLATION_REASON);
  });
});


test.describe('GB to NI RoRo FFD H1 Standalone Declaration Process - Resubmission after CDS refuses it', () => {
  test.use({ authProfile: COMPANY_PROFILE.AGENT });

  test.beforeEach(async ({ representTraderFlow }) => {
    await ReportLog.setFeature('GB to NI FFD H1 Standalone Declaration Process');
    await representTraderFlow.representTrader(IMPORTER_COMPANY_NAME);
  });

  test('Verify an FFD H1 standalone consignment in "Trader Input Required" by CDS can be corrected and resubmitted', {
    tag: ['@ffd', '@regression', '@resubmission'],
  }, async ({ createAndSubmitFfdH1StandaloneFlow, resubmitDeclarationFlow }, testInfo) => {
    await ReportLog.setStory('FFD H1 Standalone - CDS refuses an authorisation the declaration should not carry, and the trader removes it and resubmits');

    await ReportLog.step('Declare a standalone FFD H1 CDS will refuse', () =>
      createAndSubmitFfdH1StandaloneFlow.completeFfdH1StandaloneFlow({
        testInfo,
        url: BASE_URL,
        consignmentOverrides: {
          holdersOfAuthorisation: [ffdH1StandaloneRejectedByCds()],
        },
        expectedStatusKey: 'status.traderInputRequired',
        expectsTir: true,
      })
    );

    await resubmitDeclarationFlow.removeAuthorisationAndResubmitStandaloneFfdH1(
      AUTHORISATION_TYPE_CODE.EXCISE_WAREHOUSE_EXW
    );
  });
});


test.describe('GB to NI RoRo FFD H1 Standalone Declaration Process - TSS DDA', { lock: lockWhenSingleAccount(COMPANY_PROFILE.TSS_DDA) }, () => {
  test.use({ authProfile: COMPANY_PROFILE.TSS_DDA });

  test.skip(
    !isProfileConfigured(COMPANY_PROFILE.TSS_DDA),
    'No TSS_DDA login in this environment - see ON_DEMAND_PROFILES in src/auth/credentials.ts'
  );

  test.beforeEach(async () => {
    await ReportLog.setFeature('GB to NI FFD H1 Standalone Declaration Process');
  });

  test('Verify FFD H1 Standalone - Prelodged - RoRo (Accompanied) - TSS DDA is created and submitted successfully (4000-000)', { tag: ['@ffd', '@regression', '@happyPath'] }, async ({ createAndSubmitFfdH1StandaloneFlow }, testInfo) => {
    await ReportLog.setStory('FFD H1 Standalone - Prelodged - RoRo (Accompanied) - TSS DDA');
    await createAndSubmitFfdH1StandaloneFlow.declareAndClose({
      testInfo,
      url: BASE_URL,
      declaringForEori: TSS_DDA_EORI,
      consignmentOverrides: {
        typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
        representationType: undefined,
        methodOfPayment: METHOD_OF_PAYMENT.CARD_PAYMENT_THROUGH_TSS,
      },
      cardData: visaCard(),
    });
  });

});


test.describe('GB to NI RoRo FFD H1 Standalone Declaration Process - Immediate Payment - Agent Represents Trader', () => {
  test.use({ authProfile: COMPANY_PROFILE.AGENT });

  test.beforeEach(async ({ representTraderFlow }) => {
    await ReportLog.setFeature('GB to NI FFD H1 Standalone Declaration Process');
    await representTraderFlow.representTrader(IMPORTER_COMPANY_NAME);
  });

  test('Verify FFD H1 Standalone - Prelodged - RoRo (Accompanied) - Immediate Payment - Agent Represents Trader is created and submitted successfully (4000-000)', { tag: ['@ffd', '@regression', '@happyPath'] }, async ({ createAndSubmitFfdH1StandaloneFlow, triggerFinalStatusThroughCdsFlow, confirmDutyByTraderFlow }, testInfo) => {
    await ReportLog.setStory('FFD H1 Standalone - Prelodged - RoRo (Accompanied) - Immediate Payment - Agent Represents Trader');
    const ffd = await ReportLog.step('Create and submit the FFD H1 standalone declaration', () =>
      createAndSubmitFfdH1StandaloneFlow.completeFfdH1StandaloneFlow({
        testInfo,
        url: BASE_URL,
        consignmentOverrides: {
          typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
          methodOfPayment: METHOD_OF_PAYMENT.IMMEDIATE_PAYMENT_BY_ELECTRONIC_TRANSFER,
        },
        goodsItemOverrides: ffdH1StandaloneGoodsItem(),
        expectedStatusKey: 'status.awaitingArrival',
        confirmDutyByTraderFlow,
      })
    );
    await ReportLog.step('Arrive and close the FFD standalone through HMRC and CDS', () =>
      triggerFinalStatusThroughCdsFlow.arriveAndCloseStandaloneFfd(ffd, 'status.awaitingImmediatePayment')
    );
  });
});


test.describe('GB to NI RoRo FFD H1 Standalone Declaration Process - Immediate Payment - Importer Declare by themself', () => {
  test.use({ authProfile: COMPANY_PROFILE.IMPORTER });

  test.beforeEach(async () => {
    await ReportLog.setFeature('GB to NI FFD H1 Standalone Declaration Process');
  });

  test('Verify FFD H1 Standalone - Arrived - RoRo (Accompanied) - Immediate Payment - Importer Declare by themself is created and submitted successfully (4000-000)', { tag: ['@ffd', '@regression', '@happyPath'] }, async ({ createAndSubmitFfdH1StandaloneFlow }, testInfo) => {
    await ReportLog.setStory('FFD H1 Standalone - Arrived - RoRo (Accompanied) - Immediate Payment - Importer Declare by themself');
    await createAndSubmitFfdH1StandaloneFlow.declareAndClose({
      testInfo,
      url: BASE_URL,
      consignmentOverrides: {
        isPreLodged: false,
        typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
        representationType: undefined,
        methodOfPayment: METHOD_OF_PAYMENT.IMMEDIATE_PAYMENT_BY_ELECTRONIC_TRANSFER,
      },
      goodsItemOverrides: ffdH1StandaloneGoodsItem(),
      expectedStatusKey: 'status.awaitingImmediatePayment',
    });
  });
});


test.describe('GB to NI RoRo FFD H1 Standalone Declaration Process - Fiscal Hold - Importer Declare by themself', () => {
  test.use({ authProfile: COMPANY_PROFILE.FISCAL_HOLD });

  test.beforeEach(async () => {
    await ReportLog.setFeature('GB to NI FFD H1 Standalone Declaration Process');
  });

  test('Verify FFD H1 Standalone - Arrived - RoRo (Accompanied) - Fiscal Hold - Importer Declare by themself is submitted and reaches Fiscal Hold status (4000-000)', { tag: ['@ffd', '@regression', '@happyPath'] }, async ({ createAndSubmitFfdH1StandaloneFlow, triggerFinalStatusThroughCdsFlow }, testInfo) => {
    await ReportLog.setStory('FFD H1 Standalone - Arrived - RoRo (Accompanied) - Fiscal Hold - Importer Declare by themself');
    const ffd = await ReportLog.step('Create and submit the FFD H1 standalone declaration', () =>
      createAndSubmitFfdH1StandaloneFlow.completeFfdH1StandaloneFlow({
        testInfo,
        url: BASE_URL,
        declaringForEori: FISCAL_HOLD_EORI,
        consignmentOverrides: {
          isPreLodged: false,
          typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
          representationType: undefined,
        },
      })
    );

    await ReportLog.step('Trigger Fiscal Hold through CDS', () =>
      triggerFinalStatusThroughCdsFlow.triggerFiscalHold(ffd)
    );
  });
});


test.describe('GB to NI RoRo FFD H1 Standalone Declaration Process - Agent DDA', () => {
  test.use({ authProfile: COMPANY_PROFILE.AGENT });

  test.beforeEach(async ({ representTraderFlow }) => {
    await ReportLog.setFeature('GB to NI FFD H1 Standalone Declaration Process');
    await representTraderFlow.representTrader(IMPORTER_COMPANY_NAME);
  });

  test('Verify FFD H1 Standalone - Prelodged - RoRo (Accompanied) - Agent DDA is created and submitted successfully (4000-000)', { tag: ['@ffd', '@regression', '@happyPath'] }, async ({ createAndSubmitFfdH1StandaloneFlow }, testInfo) => {
    await ReportLog.setStory('FFD H1 Standalone - Prelodged - RoRo (Accompanied) - Agent DDA');
    await createAndSubmitFfdH1StandaloneFlow.declareAndClose({
      testInfo,
      url: BASE_URL,
      consignmentOverrides: {
        typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
        methodOfPayment: METHOD_OF_PAYMENT.CUSTOMS_AGENTS_DDA,
      },
      goodsItemOverrides: {},
    });
  });
});


test.describe('GB to NI RoRo FFD H1 Standalone Declaration Process - Agent Cash Account', () => {
  test.use({ authProfile: COMPANY_PROFILE.AGENT });

  test.beforeEach(async ({ representTraderFlow }) => {
    await ReportLog.setFeature('GB to NI FFD H1 Standalone Declaration Process');
    await representTraderFlow.representTrader(IMPORTER_COMPANY_NAME);
  });

  test('Verify FFD H1 Standalone - Arrived - RoRo (Accompanied) - Agent Cash Account is created and submitted successfully (4000-000)', { tag: ['@ffd', '@regression', '@happyPath'] }, async ({ createAndSubmitFfdH1StandaloneFlow }, testInfo) => {
    await ReportLog.setStory('FFD H1 Standalone - Arrived - RoRo (Accompanied) - Agent Cash Account');
    await createAndSubmitFfdH1StandaloneFlow.declareAndClose({
      testInfo,
      url: BASE_URL,
      consignmentOverrides: {
        isPreLodged: false,
        typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
        methodOfPayment: METHOD_OF_PAYMENT.AGENTS_CDS_CASH_ACCOUNT,
      },
      goodsItemOverrides: {},
    });
  });
});


test.describe('GB to NI RoRo FFD H1 Standalone Declaration Process - Agent Represents - Trader Cash Account', () => {
  test.use({ authProfile: COMPANY_PROFILE.AGENT });

  test.beforeEach(async ({ representTraderFlow }) => {
    await ReportLog.setFeature('GB to NI FFD H1 Standalone Declaration Process');
    await representTraderFlow.representTrader(IMPORTER_COMPANY_NAME);
  });

  test('Verify FFD H1 Standalone - Arrived - RoRo (Accompanied) - Agent Represents - Trader Cash Account is created and submitted successfully (4000-000)', { tag: ['@ffd', '@regression', '@happyPath'] }, async ({ createAndSubmitFfdH1StandaloneFlow }, testInfo) => {
    await ReportLog.setStory('FFD H1 Standalone - Arrived - RoRo (Accompanied) - Agent Represents - Trader Cash Account');
    await createAndSubmitFfdH1StandaloneFlow.declareAndClose({
      testInfo,
      url: BASE_URL,
      consignmentOverrides: {
        isPreLodged: false,
        typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
        methodOfPayment: METHOD_OF_PAYMENT.TRADERS_CDS_CASH_ACCOUNT,
      },
      goodsItemOverrides: {},
    });
  });
});


test.describe('GB to NI RoRo FFD H1 Standalone Declaration Process - Trader Cash Account', () => {
  test.use({ authProfile: COMPANY_PROFILE.IMPORTER });

  test.beforeEach(async () => {
    await ReportLog.setFeature('GB to NI FFD H1 Standalone Declaration Process');
  });

  test('Verify FFD H1 Standalone - Prelodged - RoRo (Accompanied) - Trader Cash Account - Importer Declare by themself is created and submitted successfully (4000-000)', { tag: ['@ffd', '@regression', '@happyPath'] }, async ({ createAndSubmitFfdH1StandaloneFlow }, testInfo) => {
    await ReportLog.setStory('FFD H1 Standalone - Prelodged - RoRo (Accompanied) - Trader Cash Account - Importer Declare by themself');
    await createAndSubmitFfdH1StandaloneFlow.declareAndClose({
      testInfo,
      url: BASE_URL,
      consignmentOverrides: {
        typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
        representationType: undefined,
        methodOfPayment: METHOD_OF_PAYMENT.TRADERS_CDS_CASH_ACCOUNT,
      },
      goodsItemOverrides: {},
    });
  });
});


test.describe('GB to NI RoRo FFD H1 Standalone Declaration Process - CSV Upload - Importer Declare by themself', () => {
  test.use({ authProfile: COMPANY_PROFILE.IMPORTER });

  test.beforeEach(async () => {
    await ReportLog.setFeature('GB to NI FFD H1 Standalone Declaration Process');
  });

  test('Verify FFD H1 Standalone - Prelodged - RoRo (Accompanied) - Trader DDA - CSV Upload - Importer Declare by themself is created and submitted successfully (4000-000)', { tag: ['@ffd', '@regression', '@happyPath', '@csvUpload'] }, async ({ createAndSubmitFfdH1StandaloneFlow, triggerFinalStatusThroughCdsFlow }, testInfo) => {
    await ReportLog.setStory('FFD H1 Standalone - Prelodged - RoRo (Accompanied) - Trader DDA - CSV Upload - Importer Declare by themself');
    const ffd = await ReportLog.step('Create and submit the FFD H1 standalone declaration with goods from CSV', () =>
      createAndSubmitFfdH1StandaloneFlow.completeFfdH1StandaloneFlowWithGoodsCsv({
        testInfo,
        url: BASE_URL,
        consignmentOverrides: {
          typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
          representationType: undefined,
        },
      }, GOODS_CSV.FFD_STANDALONE)
    );
    await ReportLog.step('Arrive and close the FFD standalone through HMRC and CDS', () =>
      triggerFinalStatusThroughCdsFlow.arriveAndCloseStandaloneFfd(ffd)
    );
  });
});


test.describe('GB to NI RoRo FFD H1 Standalone Declaration Process - Agent Represents TSS DDA', () => {
  test.use({ authProfile: COMPANY_PROFILE.AGENT });

  test.beforeEach(async ({ representTraderFlow }) => {
    await ReportLog.setFeature('GB to NI FFD H1 Standalone Declaration Process');
    await representTraderFlow.representTrader(TSS_DDA_COMPANY_NAME);
  });

  test('Verify FFD H1 Standalone - Prelodged - RoRo (Accompanied) - Agent Represents TSS DDA is created and submitted successfully (4000-000)', { tag: ['@ffd', '@regression', '@happyPath'] }, async ({ createAndSubmitFfdH1StandaloneFlow, openAs, triggerFinalStatusThroughCdsFlow }, testInfo) => {
    await ReportLog.setStory('FFD H1 Standalone - Prelodged - RoRo (Accompanied) - Agent Represents TSS DDA');

    const ffd = await ReportLog.step('Create and submit the FFD H1 standalone declaration', () =>
      createAndSubmitFfdH1StandaloneFlow.completeFfdH1StandaloneFlow({
        testInfo,
        url: BASE_URL,
        declaringForEori: TSS_DDA_EORI,
        consignmentOverrides: {
          typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
          methodOfPayment: METHOD_OF_PAYMENT.CARD_PAYMENT_THROUGH_TSS,
        },
        expectedStatusKey: 'status.pendingConfirmation',
        awaitingExternalPayment: true,
      })
    );

    const tssDda = await ReportLog.step('Sign in as the TSS DDA Importer to pay', () =>
      openAs(COMPANY_PROFILE.TSS_DDA)
    );
    await ReportLog.step('TSS DDA Trader makes payment via Payments overview', () =>
      tssDda.payment.makePendingPayment({ lrn: ffd!.lrn, card: visaCard() })
    );
    await ReportLog.step('Close the TSS DDA Importer session', () => tssDda.close());

    const ffdWithMrn = await ReportLog.step('Read MRN after Trader payment', () =>
      createAndSubmitFfdH1StandaloneFlow.readMrnAfterPayment(ffd!.lrn)
    );
    await ReportLog.step('Arrive and close the FFD standalone through HMRC and CDS', () =>
      triggerFinalStatusThroughCdsFlow.arriveAndCloseStandaloneFfd(ffdWithMrn)
    );
  });
});


test.describe("GB to NI RoRo FFD H1 Standalone - GB-NI 'At Risk' and EU CAP Safeguarding Duties - Importer Declare by themself", () => {
  test.use({ authProfile: COMPANY_PROFILE.IMPORTER });

  test.beforeEach(async () => {
    await ReportLog.setFeature('GB to NI FFD H1 Standalone Declaration Process');
  });

  test("Verify FFD H1 Standalone - Prelodged - RoRo (Accompanied) - Trader DDA - At Risk - EU CAP Safeguarding Duties - Importer Declare by themself is created and submitted successfully (4000-000)", { tag: ['@ffd', '@regression'] }, async ({ createAndSubmitFfdH1StandaloneFlow }, testInfo) => {
    await ReportLog.setStory("FFD H1 Standalone - Prelodged - RoRo (Accompanied) - Trader DDA - At Risk - EU CAP Safeguarding Duties - Importer Declare by themself");
    reportTestCaseLink(FFD_AT_RISK_EU_CAP_PRELODGED);
    await createAndSubmitFfdH1StandaloneFlow.declareAndClose({
      testInfo,
      url: BASE_URL,
      consignmentOverrides: {
        typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
        representationType: undefined,
        portOfArrival: PORT_OF_ARRIVAL.WARRENPOINT_GVMS_PORT,
        goodsDomesticStatus: CONSIGNMENT_GOODS_DOMESTIC_STATUS.NIIMP,
        unlocode: UNLOCODE.WARRENPOINT,
        deliveryPlaceUnlocode: UNLOCODE.WARRENPOINT,
        headerPreviousDocuments: [
          previousDocument355({ documentReference: 'CSPUCN123' }),
          previousDocumentDCR({ documentReference: 'CSPUCN123' }),
        ],
      },
      goodsItemOverrides: ffdH1AtRiskEuCapGoodsItem(),
    });
  });

});


test.describe("GB to NI RoRo FFD H1 Standalone - Import Pre-lodged Declaration (NIDOM) - Importer Declare by themself", () => {
  test.use({ authProfile: COMPANY_PROFILE.IMPORTER });

  test.beforeEach(async () => {
    await ReportLog.setFeature('GB to NI FFD H1 Standalone Declaration Process');
  });

  test("Verify FFD H1 Standalone - Prelodged - RoRo (Accompanied) - Trader DDA - NIDOM - Importer Declare by themself is created and submitted successfully (4000-F47)", { tag: ['@ffd', '@regression'] }, async ({ createAndSubmitFfdH1StandaloneFlow }, testInfo) => {
    await ReportLog.setStory("FFD H1 Standalone - Prelodged - RoRo (Accompanied) - Trader DDA - NIDOM - Importer Declare by themself");
    reportTestCaseLink(FFD_NIDOM_PRELODGED);
    await createAndSubmitFfdH1StandaloneFlow.declareAndClose({
      testInfo,
      url: BASE_URL,
      consignmentOverrides: {
        typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
        representationType: undefined,
        portOfArrival: PORT_OF_ARRIVAL.BELFAST_GVMS_PORT,
        goodsDomesticStatus: CONSIGNMENT_GOODS_DOMESTIC_STATUS.NIDOM,
        isSameNatureOfGoods: true,
        natureOfGoods: NATURE_OF_GOODS.TRANSFER_OF_OWNERSHIP_FOR_COMPENSATION,
        headerPreviousDocuments: [
          previousDocument355(),
          previousDocumentDCR({ documentReference: '4GB553202734852-12345' }),
        ],
      },
      goodsItemOverrides: ffdH1NidomGoodsItem(),
    });
  });

});


test.describe("GB to NI RoRo FFD H1 Standalone - GB-NI 'Not At Risk' - Importer Declare by themself", () => {
  test.use({ authProfile: COMPANY_PROFILE.IMPORTER });

  test.beforeEach(async () => {
    await ReportLog.setFeature('GB to NI FFD H1 Standalone Declaration Process');
  });

  test("Verify FFD H1 Standalone - Arrived - RoRo (Accompanied) - Trader DDA - Not At Risk - Importer Declare by themself is created and submitted successfully (4000-000)", { tag: ['@ffd', '@regression'] }, async ({ createAndSubmitFfdH1StandaloneFlow }, testInfo) => {
    await ReportLog.setStory("FFD H1 Standalone - Arrived - RoRo (Accompanied) - Trader DDA - Not At Risk - Importer Declare by themself");
    reportTestCaseLink(FFD_NOT_AT_RISK_ARRIVED);
    await createAndSubmitFfdH1StandaloneFlow.declareAndClose({
      testInfo,
      url: BASE_URL,
      consignmentOverrides: ffdH1GbNiRiskArrivedConsignment({ representationType: undefined }),
      goodsItemOverrides: ffdH1NotAtRiskGoodsItem(),
    });
  });

});


test.describe("GB to NI RoRo FFD H1 Standalone - GB-NI 'At Risk' - Importer Declare by themself", () => {
  test.use({ authProfile: COMPANY_PROFILE.IMPORTER });

  test.beforeEach(async () => {
    await ReportLog.setFeature('GB to NI FFD H1 Standalone Declaration Process');
  });

  test("Verify FFD H1 Standalone - Arrived - RoRo (Accompanied) - Trader DDA - At Risk - Importer Declare by themself is created and submitted successfully (4000-000)", { tag: ['@ffd', '@regression'] }, async ({ createAndSubmitFfdH1StandaloneFlow }, testInfo) => {
    await ReportLog.setStory("FFD H1 Standalone - Arrived - RoRo (Accompanied) - Trader DDA - At Risk - Importer Declare by themself");
    reportTestCaseLink(FFD_AT_RISK_ARRIVED);
    await createAndSubmitFfdH1StandaloneFlow.declareAndClose({
      testInfo,
      url: BASE_URL,
      consignmentOverrides: ffdH1GbNiRiskArrivedConsignment({ representationType: undefined }),
      goodsItemOverrides: ffdH1AtRiskGoodsItem(),
    });
  });

});


test.describe("GB to NI RoRo FFD H1 Standalone - GB-NI 'At Risk' - Subsidy Applied - Importer Declare by themself", () => {
  test.use({ authProfile: COMPANY_PROFILE.IMPORTER });

  test.beforeEach(async () => {
    await ReportLog.setFeature('GB to NI FFD H1 Standalone Declaration Process');
  });

  test("Verify FFD H1 Standalone - Arrived - RoRo (Accompanied) - Trader DDA - At Risk - Subsidy Applied - Importer Declare by themself is created and submitted successfully (4000-000)", { tag: ['@ffd', '@regression'] }, async ({ createAndSubmitFfdH1StandaloneFlow }, testInfo) => {
    await ReportLog.setStory("FFD H1 Standalone - Arrived - RoRo (Accompanied) - Trader DDA - At Risk - Subsidy Applied - Importer Declare by themself");
    reportTestCaseLink(FFD_AT_RISK_SUBSIDY_APPLIED_ARRIVED);
    await createAndSubmitFfdH1StandaloneFlow.declareAndClose({
      testInfo,
      url: BASE_URL,
      consignmentOverrides: ffdH1GbNiSubsidyAppliedArrivedConsignment({ representationType: undefined }),
      goodsItemOverrides: ffdH1AtRiskSubsidyAppliedGoodsItem(),
    });
  });

});


test.describe("GB to NI RoRo FFD H1 Standalone - Imports Standard Frontier Declaration - Importer Declare by themself", () => {
  test.use({ authProfile: COMPANY_PROFILE.IMPORTER });

  test.beforeEach(async () => {
    await ReportLog.setFeature('GB to NI FFD H1 Standalone Declaration Process');
  });

  test("Verify FFD H1 Standalone - Arrived - RoRo (Accompanied) - Trader DDA - Imports Standard Frontier Declaration - Importer Declare by themself is created and submitted successfully (4000-000)", { tag: ['@ffd', '@regression'] }, async ({ createAndSubmitFfdH1StandaloneFlow }, testInfo) => {
    await ReportLog.setStory("FFD H1 Standalone - Arrived - RoRo (Accompanied) - Trader DDA - Imports Standard Frontier Declaration - Importer Declare by themself");
    reportTestCaseLink(FFD_STANDARD_FRONTIER_ARRIVED);
    await createAndSubmitFfdH1StandaloneFlow.declareAndClose({
      testInfo,
      url: BASE_URL,
      consignmentOverrides: ffdH1StandardFrontierArrivedConsignment({ representationType: undefined }),
      goodsItemOverrides: ffdH1StandardFrontierGoodsItem(),
    });
  });

});


test.describe("GB to NI RoRo FFD H1 Standalone - Imports Standard Frontier Declaration with Multiple Goods Items - Importer Declare by themself", () => {
  test.use({ authProfile: COMPANY_PROFILE.IMPORTER });

  test.beforeEach(async () => {
    await ReportLog.setFeature('GB to NI FFD H1 Standalone Declaration Process');
  });

  test("Verify FFD H1 Standalone - Arrived - RoRo (Accompanied) - Trader DDA - Imports Standard Frontier Declaration with Multiple Goods Items - Importer Declare by themself is created and submitted successfully (4000-000)", { tag: ['@ffd', '@regression'] }, async ({ createAndSubmitFfdH1StandaloneFlow }, testInfo) => {
    await ReportLog.setStory("FFD H1 Standalone - Arrived - RoRo (Accompanied) - Trader DDA - Imports Standard Frontier Declaration with Multiple Goods Items - Importer Declare by themself");
    reportTestCaseLink(FFD_STANDARD_FRONTIER_MULTIPLE_GOODS_ARRIVED);
    await createAndSubmitFfdH1StandaloneFlow.declareAndClose({
      testInfo,
      url: BASE_URL,
      consignmentOverrides: ffdH1StandardFrontierMultipleGoodsArrivedConsignment({ representationType: undefined }),
      goodsItemsOverrides: ffdH1StandardFrontierMultipleGoodsItems(),
    });
  });

});
