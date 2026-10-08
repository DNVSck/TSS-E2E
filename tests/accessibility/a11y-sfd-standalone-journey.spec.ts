import { BASE_URL } from '../../config/environment';
import { ReportLog } from '../../src/core/report/report-log';
import { test } from '../base-test';
import { COMPANY_PROFILE } from '../../src/auth/credentials';
import { ACCESSIBILITY_JOURNEY_TIMEOUT } from '../../src/constant/timeout-constant';
import { ADDITIONAL_PROCEDURE_CODES } from '../../src/constant/additional-procedure-codes-constant';
import {
  SFD_STANDALONE_MAX_SCREEN_COVERAGE,
} from '../../src/test-data/sfd-standalone-consignment-data';
import { sfdStandaloneGoodsItem } from '../../src/test-data/sfd-standalone-goods-item-data';

test.use({ trace: 'off' });

// Not the ENS wizard: it splits on controlled goods into two routes that never rejoin.
// The controlled route is the longer - EIDR skips exporter, trader reference and
// invoice currency.

test.describe('SFD standalone journey - WCAG 2.2 AA Compliance', () => {
  test.use({ authProfile: COMPANY_PROFILE.AGENT });
  test.describe.configure({ timeout: ACCESSIBILITY_JOURNEY_TIMEOUT });

  test.beforeEach(async () => {
    await ReportLog.setFeature('Accessibility - standalone journeys');
  });

  test('Every screen of the SFD standalone declaration should meet WCAG 2.2 AA', { tag: ['@accessibility'] }, async ({
    auditDeclarationFlow, accessibilityAuditFlow
  }, testInfo) => {
    await ReportLog.setStory('SFD Standalone - Prelodged, controlled goods, RoRo Accompanied');

    await auditDeclarationFlow.auditSfdStandalone({
      testInfo,
      url: BASE_URL,
      audit: accessibilityAuditFlow,
      consignmentOverrides: SFD_STANDALONE_MAX_SCREEN_COVERAGE,
      goodsItemOverrides: sfdStandaloneGoodsItem({
        additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.CONTROLLED_GOODS_SIMPLIFIED_1CG,
      }),
    });
  });
});
