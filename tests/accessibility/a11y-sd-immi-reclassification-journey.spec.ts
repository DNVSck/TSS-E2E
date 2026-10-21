import { BASE_URL } from '../../config/environment';
import { ReportLog } from '../../src/core/report/report-log';
import { test } from '../base-test';
import { COMPANY_PROFILE } from '../../src/auth/credentials';
import { ACCESSIBILITY_JOURNEY_TIMEOUT } from '../../src/constant/timeout-constant';

test.use({ trace: 'off' });

test.describe('Supplementary declaration to IMMI reclassification journey - WCAG 2.2 AA Compliance', () => {
  test.use({ authProfile: COMPANY_PROFILE.IMPORTER });
  test.describe.configure({ timeout: ACCESSIBILITY_JOURNEY_TIMEOUT });

  test.beforeEach(async () => {
    await ReportLog.setFeature('Accessibility - supplementary declaration');
  });

  test('Every screen of converting a supplementary declaration to IMMI should meet WCAG 2.2 AA', { tag: ['@accessibility'] }, async ({
    generateSdDraftThroughApiFlow, auditDeclarationFlow, accessibilityAuditFlow
  }, testInfo) => {
    await ReportLog.setStory('Supplementary Declaration - converted to IMMI (H1 to H8) and its goods item updated');

    const source = await generateSdDraftThroughApiFlow.raiseSdDraft();

    await auditDeclarationFlow.auditConversion({
      testInfo,
      url: BASE_URL,
      source,
      audit: accessibilityAuditFlow,
    });
  });

  test('Every screen of reverting a converted IMMI to its supplementary declaration should meet WCAG 2.2 AA', { tag: ['@accessibility'] }, async ({
    generateSdDraftThroughApiFlow, auditDeclarationFlow, accessibilityAuditFlow
  }, testInfo) => {
    await ReportLog.setStory('Converted IMMI - reverted to its supplementary declaration (H8 to H1)');

    const source = await generateSdDraftThroughApiFlow.raiseSdDraft();

    await auditDeclarationFlow.auditReversal({
      testInfo,
      url: BASE_URL,
      source,
      audit: accessibilityAuditFlow,
    });
  });
});
