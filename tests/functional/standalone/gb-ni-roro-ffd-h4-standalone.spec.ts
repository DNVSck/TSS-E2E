import { ReportLog } from '../../../src/core/report/report-log';
import { test } from '../../base-test';
import { COMPANY_PROFILE } from '../../../src/auth/credentials';
import { IMPORTER_COMPANY_NAME, BASE_URL, FISCAL_HOLD_EORI } from '../../../config/environment';
import { TYPE_OF_MOVEMENT_OPTION_CODE } from '../../../src/constant/type-of-movement-code-constant';
import { ffdH4TraderDdaGoodsItem, ffdH4ImmediatePaymentGoodsItem, ffdH4AuthorisationByDeclarationWithoutC601GoodsItem, ffdH4FromCustomsWarehouseWithoutC601GoodsItem, ffdH4FiscalHoldGoodsItem, ffdH4CashAccountGoodsItem } from '../../../src/test-data/ffd-standalone-goods-item-data';
import { ffdH4ImmediatePaymentConsignment, ffdH4AuthorisationByDeclarationConsignment, ffdH4FromCustomsWarehouseConsignment, ffdH4FiscalHoldConsignment, ffdH4TraderCashAccountConsignment } from '../../../src/test-data/ffd-standalone-consignment-data';
import { METHOD_OF_PAYMENT } from '../../../src/constant/method-of-payment-constant';
import { reportTestCaseLink } from '../../../src/helper/report-helper';

const FFD_H4_ABD_WITHOUT_C601_ARRIVED = '6345';
const FFD_H4_FROM_CUSTOMS_WAREHOUSE_ABD_WITHOUT_C601_ARRIVED = '6343';


test.describe('GB to NI RoRo FFD H4 Standalone Declaration Process - Agent Represents Trader', () => {
  test.use({ authProfile: COMPANY_PROFILE.AGENT });

  test.beforeEach(async ({representTraderFlow}) => {
    await ReportLog.setFeature('GB to NI FFD H4 Standalone Declaration Process');
    await representTraderFlow.representTrader(IMPORTER_COMPANY_NAME);
  });

  test('Verify FFD H4 Standalone - Arrived - RoRo (Unaccompanied) - Trader DDA is created and submitted successfully (4000-000)', { tag: ['@ffd', '@regression', '@happyPath'] }, async ({ createAndSubmitFfdH4StandaloneFlow }, testInfo) => {
    await ReportLog.setStory('FFD H4 Standalone - Arrived - RoRo (Unaccompanied) - Trader DDA');
    await createAndSubmitFfdH4StandaloneFlow.declareAndClose({
      testInfo,
      url: BASE_URL,
      consignmentOverrides: {
        isPreLodged: false,
        typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_UNACCOMPANIED,
      },
      goodsItemOverrides: ffdH4TraderDdaGoodsItem(),
    });
  });
});


test.describe('GB to NI RoRo FFD H4 Standalone Declaration Process - Importer Declare by themself', () => {
  test.use({ authProfile: COMPANY_PROFILE.IMPORTER });

  test.beforeEach(async () => {
    await ReportLog.setFeature('GB to NI FFD H4 Standalone Declaration Process');
  });

  test('Verify FFD H4 Standalone - Prelodged - RoRo (Accompanied) - Trader DDA - Importer Declare by themself is created and submitted successfully (4000-000)', { tag: ['@ffd', '@regression', '@happyPath'] }, async ({ createAndSubmitFfdH4StandaloneFlow }, testInfo) => {
    await ReportLog.setStory('FFD H4 Standalone - Prelodged - RoRo (Accompanied) - Trader DDA - Importer Declare by themself');
    await createAndSubmitFfdH4StandaloneFlow.declareAndClose({
      testInfo,
      url: BASE_URL,
      consignmentOverrides: {
        typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
        representationType: undefined,
      },
      goodsItemOverrides: ffdH4TraderDdaGoodsItem(),
    });
  });
});


test.describe('GB to NI RoRo FFD H4 Standalone Declaration Process - Immediate Payment - Agent Represents Trader', () => {
  test.use({ authProfile: COMPANY_PROFILE.AGENT });

  test.beforeEach(async ({ representTraderFlow }) => {
    await ReportLog.setFeature('GB to NI FFD H4 Standalone Declaration Process');
    await representTraderFlow.representTrader(IMPORTER_COMPANY_NAME);
  });

  test('Verify FFD H4 Standalone - Prelodged - RoRo (Accompanied) - Immediate Payment - Agent Represents Trader is created and submitted successfully (4000-000)', { tag: ['@ffd', '@regression', '@happyPath'] }, async ({ createAndSubmitFfdH4StandaloneFlow }, testInfo) => {
    await ReportLog.setStory('FFD H4 Standalone - Prelodged - RoRo (Accompanied) - Immediate Payment - Agent Represents Trader');
    await createAndSubmitFfdH4StandaloneFlow.declareAndClose({
      testInfo,
      url: BASE_URL,
      consignmentOverrides: ffdH4ImmediatePaymentConsignment({
        typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
      }),
      goodsItemOverrides: ffdH4ImmediatePaymentGoodsItem(),
    });
  });
});


test.describe('GB to NI RoRo FFD H4 Standalone Declaration Process - Immediate Payment - Importer Declare by themself', () => {
  test.use({ authProfile: COMPANY_PROFILE.IMPORTER });

  test.beforeEach(async () => {
    await ReportLog.setFeature('GB to NI FFD H4 Standalone Declaration Process');
  });

  test('Verify FFD H4 Standalone - Arrived - RoRo (Accompanied) - Immediate Payment - Importer Declare by themself is created and submitted successfully (4000-000)', { tag: ['@ffd', '@regression', '@happyPath'] }, async ({ createAndSubmitFfdH4StandaloneFlow }, testInfo) => {
    await ReportLog.setStory('FFD H4 Standalone - Arrived - RoRo (Accompanied) - Immediate Payment - Importer Declare by themself');
    await createAndSubmitFfdH4StandaloneFlow.declareAndClose({
      testInfo,
      url: BASE_URL,
      consignmentOverrides: ffdH4ImmediatePaymentConsignment({
        isPreLodged: false,
        typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
        representationType: undefined,
      }),
      goodsItemOverrides: ffdH4ImmediatePaymentGoodsItem(),
    });
  });
});


test.describe('GB to NI RoRo FFD H4 Standalone Declaration Process - Agent DDA', () => {
  test.use({ authProfile: COMPANY_PROFILE.AGENT });

  test.beforeEach(async ({ representTraderFlow }) => {
    await ReportLog.setFeature('GB to NI FFD H4 Standalone Declaration Process');
    await representTraderFlow.representTrader(IMPORTER_COMPANY_NAME);
  });

  test('Verify FFD H4 Standalone - Prelodged - RoRo (Accompanied) - Agent DDA is created and submitted successfully (4000-000)', { tag: ['@ffd', '@regression', '@happyPath'] }, async ({ createAndSubmitFfdH4StandaloneFlow }, testInfo) => {
    await ReportLog.setStory('FFD H4 Standalone - Prelodged - RoRo (Accompanied) - Agent DDA');
    await createAndSubmitFfdH4StandaloneFlow.declareAndClose({
      testInfo,
      url: BASE_URL,
      consignmentOverrides: {
        typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
        methodOfPayment: METHOD_OF_PAYMENT.CUSTOMS_AGENTS_DDA,
      },
    });
  });
});


test.describe('GB to NI RoRo FFD H4 Standalone Declaration Process - Agent Cash Account', () => {
  test.use({ authProfile: COMPANY_PROFILE.AGENT });

  test.beforeEach(async ({ representTraderFlow }) => {
    await ReportLog.setFeature('GB to NI FFD H4 Standalone Declaration Process');
    await representTraderFlow.representTrader(IMPORTER_COMPANY_NAME);
  });

  test('Verify FFD H4 Standalone - Prelodged - RoRo (Accompanied) - Agent Cash Account is created and submitted successfully (4000-000)', { tag: ['@ffd', '@regression', '@happyPath'] }, async ({ createAndSubmitFfdH4StandaloneFlow }, testInfo) => {
    await ReportLog.setStory('FFD H4 Standalone - Prelodged - RoRo (Accompanied) - Agent Cash Account');
    await createAndSubmitFfdH4StandaloneFlow.declareAndClose({
      testInfo,
      url: BASE_URL,
      consignmentOverrides: {
        typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
        methodOfPayment: METHOD_OF_PAYMENT.AGENTS_CDS_CASH_ACCOUNT,
      },
      goodsItemOverrides: ffdH4CashAccountGoodsItem(),
    });
  });
});


test.describe('GB to NI RoRo FFD H4 Standalone Declaration Process - Agent Represents - Trader Cash Account', () => {
  test.use({ authProfile: COMPANY_PROFILE.AGENT });

  test.beforeEach(async ({ representTraderFlow }) => {
    await ReportLog.setFeature('GB to NI FFD H4 Standalone Declaration Process');
    await representTraderFlow.representTrader(IMPORTER_COMPANY_NAME);
  });

  test('Verify FFD H4 Standalone - Prelodged - RoRo (Accompanied) - Agent Represents - Trader Cash Account is created and submitted successfully (4000-000)', { tag: ['@ffd', '@regression', '@happyPath'] }, async ({ createAndSubmitFfdH4StandaloneFlow }, testInfo) => {
    await ReportLog.setStory('FFD H4 Standalone - Prelodged - RoRo (Accompanied) - Agent Represents - Trader Cash Account');
    await createAndSubmitFfdH4StandaloneFlow.declareAndClose({
      testInfo,
      url: BASE_URL,
      consignmentOverrides: ffdH4TraderCashAccountConsignment({
        typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
      }),
      goodsItemOverrides: ffdH4CashAccountGoodsItem(),
    });
  });
});


test.describe('GB to NI RoRo FFD H4 Standalone Declaration Process - Trader Cash Account', () => {
  test.use({ authProfile: COMPANY_PROFILE.IMPORTER });

  test.beforeEach(async () => {
    await ReportLog.setFeature('GB to NI FFD H4 Standalone Declaration Process');
  });

  test('Verify FFD H4 Standalone - Arrived - RoRo (Accompanied) - Trader Cash Account - Importer Declare by themself is created and submitted successfully (4000-000)', { tag: ['@ffd', '@regression', '@happyPath'] }, async ({ createAndSubmitFfdH4StandaloneFlow }, testInfo) => {
    await ReportLog.setStory('FFD H4 Standalone - Arrived - RoRo (Accompanied) - Trader Cash Account - Importer Declare by themself');
    await createAndSubmitFfdH4StandaloneFlow.declareAndClose({
      testInfo,
      url: BASE_URL,
      consignmentOverrides: ffdH4TraderCashAccountConsignment({
        isPreLodged: false,
        typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
        representationType: undefined,
      }),
      goodsItemOverrides: ffdH4CashAccountGoodsItem(),
    });
  });
});


test.describe('GB to NI RoRo FFD H4 Standalone Declaration Process - Fiscal Hold - Importer Declare by themself', () => {
  test.use({ authProfile: COMPANY_PROFILE.FISCAL_HOLD });

  test.beforeEach(async () => {
    await ReportLog.setFeature('GB to NI FFD H4 Standalone Declaration Process');
  });

  test('Verify FFD H4 Standalone - Arrived - RoRo (Accompanied) - Fiscal Hold - Importer Declare by themself is submitted and reaches Fiscal Hold status (5100-000)', { tag: ['@ffd', '@regression', '@happyPath'] }, async ({ createAndSubmitFfdH4StandaloneFlow, triggerFinalStatusThroughCdsFlow }, testInfo) => {
    await ReportLog.setStory('FFD H4 Standalone - Arrived - RoRo (Accompanied) - Fiscal Hold - Importer Declare by themself');
    const ffd = await ReportLog.step('Create and submit the FFD H4 standalone declaration', () =>
      createAndSubmitFfdH4StandaloneFlow.completeFfdH4StandaloneFlow({
        testInfo,
        url: BASE_URL,
        declaringForEori: FISCAL_HOLD_EORI,
        consignmentOverrides: ffdH4FiscalHoldConsignment({
          isPreLodged: false,
          typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
          representationType: undefined,
        }),
        goodsItemOverrides: ffdH4FiscalHoldGoodsItem(),
      })
    );

    await ReportLog.step('Trigger Fiscal Hold through CDS', () =>
      triggerFinalStatusThroughCdsFlow.triggerFiscalHold(ffd)
    );
  });
});


test.describe('GB to NI RoRo FFD H4 Standalone - Authorisation by Declaration without C601 - Importer Declare by themself', () => {
  test.use({ authProfile: COMPANY_PROFILE.IMPORTER });

  test.beforeEach(async () => {
    await ReportLog.setFeature('GB to NI FFD H4 Standalone Declaration Process');
  });

  test('Verify FFD H4 Standalone - Arrived - RoRo (Accompanied) - Trader DDA - Authorisation by Declaration without C601 - Importer Declare by themself is created and submitted successfully (5100-000)', { tag: ['@ffd', '@regression'] }, async ({ createAndSubmitFfdH4StandaloneFlow }, testInfo) => {
    await ReportLog.setStory('FFD H4 Standalone - Arrived - RoRo (Accompanied) - Trader DDA - Authorisation by Declaration without C601 - Importer Declare by themself');
    reportTestCaseLink(FFD_H4_ABD_WITHOUT_C601_ARRIVED);
    await createAndSubmitFfdH4StandaloneFlow.declareAndClose({
      testInfo,
      url: BASE_URL,
      consignmentOverrides: ffdH4AuthorisationByDeclarationConsignment({ representationType: undefined }),
      goodsItemOverrides: ffdH4AuthorisationByDeclarationWithoutC601GoodsItem(),
    });
  });

});


test.describe('GB to NI RoRo FFD H4 Standalone - Inward Processing from Customs Warehouse - Authorisation by Declaration without C601 - Importer Declare by themself', () => {
  test.use({ authProfile: COMPANY_PROFILE.IMPORTER });

  test.beforeEach(async () => {
    await ReportLog.setFeature('GB to NI FFD H4 Standalone Declaration Process');
  });

  test('Verify FFD H4 Standalone - Arrived - RoRo (Accompanied) - Trader DDA - Inward Processing from Customs Warehouse - Authorisation by Declaration without C601 - Importer Declare by themself is created and submitted successfully (5171-000)', { tag: ['@ffd', '@regression'] }, async ({ createAndSubmitFfdH4StandaloneFlow }, testInfo) => {
    await ReportLog.setStory('FFD H4 Standalone - Arrived - RoRo (Accompanied) - Trader DDA - Inward Processing from Customs Warehouse - Authorisation by Declaration without C601 - Importer Declare by themself');
    reportTestCaseLink(FFD_H4_FROM_CUSTOMS_WAREHOUSE_ABD_WITHOUT_C601_ARRIVED);
    await createAndSubmitFfdH4StandaloneFlow.declareAndClose({
      testInfo,
      url: BASE_URL,
      consignmentOverrides: ffdH4FromCustomsWarehouseConsignment({ representationType: undefined }),
      goodsItemOverrides: ffdH4FromCustomsWarehouseWithoutC601GoodsItem(),
    });
  });

});
