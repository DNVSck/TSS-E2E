import { BASE_URL } from '../../config/environment';
import { ReportLog } from '../../src/core/report/report-log';
import { test } from '../base-test';
import { COMPANY_PROFILE } from '../../src/auth/credentials';
import { ACCESSIBILITY_JOURNEY_TIMEOUT } from '../../src/constant/timeout-constant';
import { ADDITIONAL_PROCEDURE_CODES } from '../../src/constant/additional-procedure-codes-constant';
import { PROCEDURE_CODES } from '../../src/constant/procedure-codes-constant';
import {
  IMMI_STANDALONE_MAX_SCREEN_COVERAGE,
} from '../../src/test-data/immi-standalone-consignment-data';
import { immiStandaloneGoodsItem } from '../../src/test-data/immi-standalone-goods-item-data';

test.use({ trace: 'off' });

// Declared without a Trader Goods Profile on purpose: a TGP item skips the commodity
// and country-of-origin screens outright, which would cost this audit two screens.

test.describe('IMMI standalone journey - WCAG 2.2 AA Compliance', () => {
  test.use({ authProfile: COMPANY_PROFILE.AGENT });
  test.describe.configure({ timeout: ACCESSIBILITY_JOURNEY_TIMEOUT });

  test.beforeEach(async () => {
    await ReportLog.setFeature('Accessibility - standalone journeys');
  });

  test('Every screen of the IMMI standalone declaration should meet WCAG 2.2 AA', { tag: ['@accessibility'] }, async ({
    auditDeclarationFlow, accessibilityAuditFlow
  }, testInfo) => {
    await ReportLog.setStory('IMMI Standalone - Prelodged, RoRo Accompanied, without TGP');

    await auditDeclarationFlow.auditImmiStandalone({
      testInfo,
      url: BASE_URL,
      audit: accessibilityAuditFlow,
      consignmentOverrides: IMMI_STANDALONE_MAX_SCREEN_COVERAGE,
      goodsItemOverrides: immiStandaloneGoodsItem({
        procedureCode: PROCEDURE_CODES.FREE_CIRCULATION_4000,
        additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.SPIMM_STANDARD_GOODS_1SG,
      }),
    });
  });
});
