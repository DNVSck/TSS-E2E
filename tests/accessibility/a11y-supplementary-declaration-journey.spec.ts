import { ReportLog } from '../../src/core/report/report-log';
import { getBaseUrl, test } from '../test-hooks';
import { COMPANY_PROFILE } from '../../src/auth/credentials';
import { ACCESSIBILITY_JOURNEY_TIMEOUT } from '../../src/constant/timeout-constant';
import { TSS_DDA_COMPANY_NAME } from '../../config/environment';
import {
  declaredThroughTraderApi, tssDefermentSupplementaryDeclaration,
} from '../../src/test-data/supplementary-declaration-data';
import {
  tssDdaTraderApiSupplementaryDeclarationMovement,
} from '../../src/test-data/supplementary-declaration-movement-data';

// The frontier declaration this SD hangs off is raised through the Trader API: the
// ENS-SFD wizard has an audit of its own. One payment route only - the TSS DDA fork
// changes which authorisations come off the declaration, not which screens it puts.

test.describe('Supplementary declaration journey - WCAG 2.2 AA Compliance', () => {
  test.use({ authProfile: COMPANY_PROFILE.AGENT });
  test.describe.configure({ timeout: ACCESSIBILITY_JOURNEY_TIMEOUT });

  test.beforeEach(async () => {
    await ReportLog.setFeature('Accessibility - supplementary declaration');
  });

  test('Every screen of the supplementary declaration should meet WCAG 2.2 AA', { tag: ['@accessibility'] }, async ({
    generateSdDraftThroughApiFlow, representTraderFlow, auditDeclarationFlow, accessibilityAuditFlow
  }, testInfo) => {
    await ReportLog.setStory('Supplementary Declaration - from an ENS-SFD raised through the Trader API - TSS DDA');

    const { movementLrn, frontierLrn } = await ReportLog.step(
      'Raise the supplementary declaration from a movement declared through the Trader API',
      () => generateSdDraftThroughApiFlow.generateSdDraft(
        tssDdaTraderApiSupplementaryDeclarationMovement()
      )
    );

    await representTraderFlow.openPortalAndRepresent(
      getBaseUrl(), testInfo, TSS_DDA_COMPANY_NAME
    );

    await auditDeclarationFlow.auditSupplementaryDeclaration({
      testInfo,
      url: getBaseUrl(),
      movementLrn,
      frontierLrn,
      audit: accessibilityAuditFlow,
      overrides: declaredThroughTraderApi(tssDefermentSupplementaryDeclaration()),
    });
  });
});
