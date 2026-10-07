import { BASE_URL } from '../../config/environment';
import { ReportLog } from '../../src/core/report/report-log';
import { test } from '../base-test';
import { COMPANY_PROFILE } from '../../src/auth/credentials';
import { ACCESSIBILITY_JOURNEY_TIMEOUT } from '../../src/constant/timeout-constant';
import {
  ENS_AUDIT_JOURNEYS, ENS_AUDIT_MOVEMENT,
} from '../../src/test-data/ens-audit-journey-data';

test.describe('ENS integrated journeys - WCAG 2.2 AA Compliance', () => {
  test.use({ authProfile: COMPANY_PROFILE.AGENT });
  test.describe.configure({ timeout: ACCESSIBILITY_JOURNEY_TIMEOUT });

  test.beforeEach(async () => {
    await ReportLog.setFeature('Accessibility - ENS integrated journeys');
  });

  for (const journey of ENS_AUDIT_JOURNEYS) {
    test(`Every screen of the ${journey.name} declaration should meet WCAG 2.2 AA`,
      { tag: ['@accessibility'] }, async ({
        auditDeclarationFlow, accessibilityAuditFlow
      }, testInfo) => {
        await ReportLog.setStory(journey.story);

        await auditDeclarationFlow.auditEnsDeclaration({
          testInfo,
          url: BASE_URL,
          audit: accessibilityAuditFlow,
          movementOverrides: ENS_AUDIT_MOVEMENT,
          consignmentOverrides: journey.consignmentOverrides,
          goodsItemOverrides: journey.goodsItemOverrides,
        });
      });
  }
});
