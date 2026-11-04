import { ReportLog } from '../../../src/core/report/report-log';
import { test } from '../../base-test';
import { COMPANY_PROFILE } from '../../../src/auth/credentials';
import { IMPORTER_COMPANY_NAME, BASE_URL, FISCAL_HOLD_EORI } from '../../../config/environment';
import { TYPE_OF_MOVEMENT_OPTION_CODE } from '../../../src/constant/type-of-movement-code-constant';
import { ffdH3TraderDdaGoodsItem, ffdH3FiscalHoldGoodsItem, ffdH3TemporaryAdmissionOfPackingsGoodsItem, ffdH3ProfessionalEquipmentMultipleGoodsItems, ffdH3MedicalEquipmentWithoutC516GoodsItem } from '../../../src/test-data/ffd-standalone-goods-item-data';
import { ffdH3FiscalHoldConsignment, ffdH3TemporaryAdmissionOfPackingsConsignment, ffdH3ProfessionalEquipmentConsignment, ffdH3MedicalEquipmentWithoutC516Consignment } from '../../../src/test-data/ffd-standalone-consignment-data';
import { METHOD_OF_PAYMENT } from '../../../src/constant/method-of-payment-constant';
import { reportTestCaseLink } from '../../../src/helper/report-helper';
import { MULTIPLE_GOODS_JOURNEY_TIMEOUT } from '../../../src/constant/timeout-constant';

const FFD_H3_TEMPORARY_ADMISSION_OF_PACKINGS_ARRIVED = '6173';
const FFD_H3_PROFESSIONAL_EQUIPMENT_MULTIPLE_GOODS_ARRIVED = '6172';
const FFD_H3_ABD_WITHOUT_C516_PRELODGED = '6174';


test.describe('GB to NI RoRo FFD H3 Standalone Declaration Process - Agent Represents Trader', () => {
  test.use({ authProfile: COMPANY_PROFILE.AGENT });

  test.beforeEach(async ({representTraderFlow}) => {
    await ReportLog.setFeature('GB to NI FFD H3 Standalone Declaration Process');
    await representTraderFlow.representTrader(IMPORTER_COMPANY_NAME);
  });

  test('Verify FFD H3 Standalone - Prelodged - RoRo (Accompanied) - Trader DDA is created and submitted successfully (4000-000)', { tag: ['@ffd', '@regression', '@happyPath'] }, async ({ createAndSubmitFfdH3StandaloneFlow }, testInfo) => {
    await ReportLog.setStory('FFD H3 Standalone - Prelodged - RoRo (Accompanied) - Trader DDA');
    await createAndSubmitFfdH3StandaloneFlow.declareAndClose({
      testInfo,
      url: BASE_URL,
      consignmentOverrides: {
        typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
      },
      goodsItemOverrides: ffdH3TraderDdaGoodsItem(),
    });
  });
});


test.describe('GB to NI RoRo FFD H3 Standalone Declaration Process - Importer Declare by themself', () => {
  test.use({ authProfile: COMPANY_PROFILE.IMPORTER });

  test.beforeEach(async () => {
    await ReportLog.setFeature('GB to NI FFD H3 Standalone Declaration Process');
  });

  test('Verify FFD H3 Standalone - Arrived - RoRo (Accompanied) - Trader DDA - Importer Declare by themself is created and submitted successfully (4000-000)', { tag: ['@ffd', '@regression', '@happyPath'] }, async ({ createAndSubmitFfdH3StandaloneFlow }, testInfo) => {
    await ReportLog.setStory('FFD H3 Standalone - Arrived - RoRo (Accompanied) - Trader DDA - Importer Declare by themself');
    await createAndSubmitFfdH3StandaloneFlow.declareAndClose({
      testInfo,
      url: BASE_URL,
      consignmentOverrides: {
        isPreLodged: false,
        typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
        representationType: undefined,
      },
      goodsItemOverrides: ffdH3TraderDdaGoodsItem(),
    });
  });
});


test.describe('GB to NI RoRo FFD H3 Standalone Declaration Process - Immediate Payment - Agent Represents Trader', () => {
  test.use({ authProfile: COMPANY_PROFILE.AGENT });

  test.beforeEach(async ({ representTraderFlow }) => {
    await ReportLog.setFeature('GB to NI FFD H3 Standalone Declaration Process');
    await representTraderFlow.representTrader(IMPORTER_COMPANY_NAME);
  });

  test('Verify FFD H3 Standalone - Arrived - RoRo (Accompanied) - Immediate Payment - Agent Represents Trader is created and submitted successfully (4000-000)', { tag: ['@ffd', '@regression', '@happyPath'] }, async ({ createAndSubmitFfdH3StandaloneFlow }, testInfo) => {
    await ReportLog.setStory('FFD H3 Standalone - Arrived - RoRo (Accompanied) - Immediate Payment - Agent Represents Trader');
    await createAndSubmitFfdH3StandaloneFlow.declareAndClose({
      testInfo,
      url: BASE_URL,
      consignmentOverrides: {
        isPreLodged: false,
        typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
        methodOfPayment: METHOD_OF_PAYMENT.IMMEDIATE_PAYMENT_BY_ELECTRONIC_TRANSFER,
      },
    });
  });
});


test.describe('GB to NI RoRo FFD H3 Standalone Declaration Process - Immediate Payment - Importer Declare by themself', () => {
  test.use({ authProfile: COMPANY_PROFILE.IMPORTER });

  test.beforeEach(async () => {
    await ReportLog.setFeature('GB to NI FFD H3 Standalone Declaration Process');
  });

  test('Verify FFD H3 Standalone - Prelodged - RoRo (Accompanied) - Immediate Payment - Importer Declare by themself is created and submitted successfully (4000-000)', { tag: ['@ffd', '@regression', '@happyPath'] }, async ({ createAndSubmitFfdH3StandaloneFlow }, testInfo) => {
    await ReportLog.setStory('FFD H3 Standalone - Prelodged - RoRo (Accompanied) - Immediate Payment - Importer Declare by themself');
    await createAndSubmitFfdH3StandaloneFlow.declareAndClose({
      testInfo,
      url: BASE_URL,
      consignmentOverrides: {
        typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
        representationType: undefined,
        methodOfPayment: METHOD_OF_PAYMENT.IMMEDIATE_PAYMENT_BY_ELECTRONIC_TRANSFER,
      },
      expectedStatusKey: 'status.awaitingArrival',
    });
  });
});


test.describe('GB to NI RoRo FFD H3 Standalone Declaration Process - Agent DDA', () => {
  test.use({ authProfile: COMPANY_PROFILE.AGENT });

  test.beforeEach(async ({ representTraderFlow }) => {
    await ReportLog.setFeature('GB to NI FFD H3 Standalone Declaration Process');
    await representTraderFlow.representTrader(IMPORTER_COMPANY_NAME);
  });

  test('Verify FFD H3 Standalone - Arrived - RoRo (Accompanied) - Agent DDA is created and submitted successfully (4000-000)', { tag: ['@ffd', '@regression', '@happyPath'] }, async ({ createAndSubmitFfdH3StandaloneFlow }, testInfo) => {
    await ReportLog.setStory('FFD H3 Standalone - Arrived - RoRo (Accompanied) - Agent DDA');
    await createAndSubmitFfdH3StandaloneFlow.declareAndClose({
      testInfo,
      url: BASE_URL,
      consignmentOverrides: {
        isPreLodged: false,
        typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
        methodOfPayment: METHOD_OF_PAYMENT.CUSTOMS_AGENTS_DDA,
      },
    });
  });
});


test.describe('GB to NI RoRo FFD H3 Standalone Declaration Process - Agent Cash Account', () => {
  test.use({ authProfile: COMPANY_PROFILE.AGENT });

  test.beforeEach(async ({ representTraderFlow }) => {
    await ReportLog.setFeature('GB to NI FFD H3 Standalone Declaration Process');
    await representTraderFlow.representTrader(IMPORTER_COMPANY_NAME);
  });

  test('Verify FFD H3 Standalone - Prelodged - RoRo (Accompanied) - Agent Cash Account is created and submitted successfully (4000-000)', { tag: ['@ffd', '@regression', '@happyPath'] }, async ({ createAndSubmitFfdH3StandaloneFlow }, testInfo) => {
    await ReportLog.setStory('FFD H3 Standalone - Prelodged - RoRo (Accompanied) - Agent Cash Account');
    await createAndSubmitFfdH3StandaloneFlow.declareAndClose({
      testInfo,
      url: BASE_URL,
      consignmentOverrides: {
        typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
        methodOfPayment: METHOD_OF_PAYMENT.AGENTS_CDS_CASH_ACCOUNT,
      },
    });
  });
});


test.describe('GB to NI RoRo FFD H3 Standalone Declaration Process - Agent Represents - Trader Cash Account', () => {
  test.use({ authProfile: COMPANY_PROFILE.AGENT });

  test.beforeEach(async ({ representTraderFlow }) => {
    await ReportLog.setFeature('GB to NI FFD H3 Standalone Declaration Process');
    await representTraderFlow.representTrader(IMPORTER_COMPANY_NAME);
  });

  test('Verify FFD H3 Standalone - Arrived - RoRo (Accompanied) - Agent Represents - Trader Cash Account is created and submitted successfully (4000-000)', { tag: ['@ffd', '@regression', '@happyPath'] }, async ({ createAndSubmitFfdH3StandaloneFlow }, testInfo) => {
    await ReportLog.setStory('FFD H3 Standalone - Arrived - RoRo (Accompanied) - Agent Represents - Trader Cash Account');
    await createAndSubmitFfdH3StandaloneFlow.declareAndClose({
      testInfo,
      url: BASE_URL,
      consignmentOverrides: {
        isPreLodged: false,
        typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
        methodOfPayment: METHOD_OF_PAYMENT.TRADERS_CDS_CASH_ACCOUNT,
      },
    });
  });
});


test.describe('GB to NI RoRo FFD H3 Standalone Declaration Process - Trader Cash Account', () => {
  test.use({ authProfile: COMPANY_PROFILE.IMPORTER });

  test.beforeEach(async () => {
    await ReportLog.setFeature('GB to NI FFD H3 Standalone Declaration Process');
  });

  test('Verify FFD H3 Standalone - Prelodged - RoRo (Accompanied) - Trader Cash Account - Importer Declare by themself is created and submitted successfully (4000-000)', { tag: ['@ffd', '@regression', '@happyPath'] }, async ({ createAndSubmitFfdH3StandaloneFlow }, testInfo) => {
    await ReportLog.setStory('FFD H3 Standalone - Prelodged - RoRo (Accompanied) - Trader Cash Account - Importer Declare by themself');
    await createAndSubmitFfdH3StandaloneFlow.declareAndClose({
      testInfo,
      url: BASE_URL,
      consignmentOverrides: {
        typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
        representationType: undefined,
        methodOfPayment: METHOD_OF_PAYMENT.TRADERS_CDS_CASH_ACCOUNT,
      },
    });
  });
});


test.describe('GB to NI RoRo FFD H3 Standalone Declaration Process - Fiscal Hold - Importer Declare by themself', () => {
  test.use({ authProfile: COMPANY_PROFILE.FISCAL_HOLD });

  test.beforeEach(async () => {
    await ReportLog.setFeature('GB to NI FFD H3 Standalone Declaration Process');
  });

  test('Verify FFD H3 Standalone - Prelodged - RoRo (Accompanied) - Fiscal Hold - Importer Declare by themself is submitted and reaches Fiscal Hold status (4000-000)', { tag: ['@ffd', '@regression', '@happyPath'] }, async ({ createAndSubmitFfdH3StandaloneFlow, triggerFinalStatusThroughCdsFlow }, testInfo) => {
    await ReportLog.setStory('FFD H3 Standalone - Prelodged - RoRo (Accompanied) - Fiscal Hold - Importer Declare by themself');
    const ffd = await ReportLog.step('Create and submit the FFD H3 standalone declaration', () =>
      createAndSubmitFfdH3StandaloneFlow.completeFfdH3StandaloneFlow({
        testInfo,
        url: BASE_URL,
        declaringForEori: FISCAL_HOLD_EORI,
        consignmentOverrides: ffdH3FiscalHoldConsignment({
          typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
          representationType: undefined,
        }),
        goodsItemOverrides: ffdH3FiscalHoldGoodsItem(),
      })
    );

    await ReportLog.step('Arrive and trigger Fiscal Hold through HMRC and CDS', () =>
      triggerFinalStatusThroughCdsFlow.arriveAndTriggerFiscalHold(ffd)
    );
  });
});


test.describe('GB to NI RoRo FFD H3 Standalone - Temporary Admission of Packings - Importer Declare by themself', () => {
  test.use({ authProfile: COMPANY_PROFILE.IMPORTER });

  test.beforeEach(async () => {
    await ReportLog.setFeature('GB to NI FFD H3 Standalone Declaration Process');
  });

  test('Verify FFD H3 Standalone - Arrived - RoRo (Accompanied) - Trader DDA - Temporary Admission of Packings - Importer Declare by themself is created and submitted successfully (5300-D15)', { tag: ['@ffd', '@regression'] }, async ({ createAndSubmitFfdH3StandaloneFlow }, testInfo) => {
    await ReportLog.setStory('FFD H3 Standalone - Arrived - RoRo (Accompanied) - Trader DDA - Temporary Admission of Packings - Importer Declare by themself');
    reportTestCaseLink(FFD_H3_TEMPORARY_ADMISSION_OF_PACKINGS_ARRIVED);
    await createAndSubmitFfdH3StandaloneFlow.declareAndClose({
      testInfo,
      url: BASE_URL,
      consignmentOverrides: ffdH3TemporaryAdmissionOfPackingsConsignment({ representationType: undefined }),
      goodsItemOverrides: ffdH3TemporaryAdmissionOfPackingsGoodsItem(),
    });
  });

});


test.describe('GB to NI RoRo FFD H3 Standalone - Temporary Admission of Multiple Goods Items - Importer Declare by themself', () => {
  test.use({ authProfile: COMPANY_PROFILE.IMPORTER });
  test.describe.configure({ timeout: MULTIPLE_GOODS_JOURNEY_TIMEOUT });

  test.beforeEach(async () => {
    await ReportLog.setFeature('GB to NI FFD H3 Standalone Declaration Process');
  });

  test('Verify FFD H3 Standalone - Arrived - RoRo (Accompanied) - Trader DDA - Temporary Admission of Multiple Goods Items - Importer Declare by themself is created and submitted successfully (5300-D12)', { tag: ['@ffd', '@regression'] }, async ({ createAndSubmitFfdH3StandaloneFlow }, testInfo) => {
    await ReportLog.setStory('FFD H3 Standalone - Arrived - RoRo (Accompanied) - Trader DDA - Temporary Admission of Multiple Goods Items - Importer Declare by themself');
    reportTestCaseLink(FFD_H3_PROFESSIONAL_EQUIPMENT_MULTIPLE_GOODS_ARRIVED);
    await createAndSubmitFfdH3StandaloneFlow.declareAndClose({
      testInfo,
      url: BASE_URL,
      consignmentOverrides: ffdH3ProfessionalEquipmentConsignment({ representationType: undefined }),
      goodsItemsOverrides: ffdH3ProfessionalEquipmentMultipleGoodsItems(),
    });
  });

});


test.describe('GB to NI RoRo FFD H3 Standalone - Authorisation by Declaration without C516 - Importer Declare by themself', () => {
  test.use({ authProfile: COMPANY_PROFILE.IMPORTER });

  test.beforeEach(async () => {
    await ReportLog.setFeature('GB to NI FFD H3 Standalone Declaration Process');
  });

  test('Verify FFD H3 Standalone - Prelodged - RoRo (Accompanied) - Trader DDA - Authorisation by Declaration without C516 - Importer Declare by themself is created and submitted successfully (5300-D07)', { tag: ['@ffd', '@regression'] }, async ({ createAndSubmitFfdH3StandaloneFlow }, testInfo) => {
    await ReportLog.setStory('FFD H3 Standalone - Prelodged - RoRo (Accompanied) - Trader DDA - Authorisation by Declaration without C516 - Importer Declare by themself');
    reportTestCaseLink(FFD_H3_ABD_WITHOUT_C516_PRELODGED);
    await createAndSubmitFfdH3StandaloneFlow.declareAndClose({
      testInfo,
      url: BASE_URL,
      consignmentOverrides: ffdH3MedicalEquipmentWithoutC516Consignment({ representationType: undefined }),
      goodsItemOverrides: ffdH3MedicalEquipmentWithoutC516GoodsItem(),
    });
  });

});
