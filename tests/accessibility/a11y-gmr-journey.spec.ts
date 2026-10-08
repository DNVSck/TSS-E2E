import { BASE_URL } from '../../config/environment';
import { ReportLog } from '../../src/core/report/report-log';
import { test } from '../base-test';
import { COMPANY_PROFILE } from '../../src/auth/credentials';
import { ACCESSIBILITY_JOURNEY_TIMEOUT } from '../../src/constant/timeout-constant';
import { ROUTE_ID_CONSTANT } from '../../src/constant/routeId-constant';
import { GMR_MOVEMENT, sfdGmrJourney } from '../../src/test-data/gmr-journey-data';

test.use({ trace: 'off' });

// The eligible movement is raised through the Trader API: the ENS-SFD wizard has an
// audit of its own, and walking it here would add seven minutes and no screen. The ENS
// journeys skip the GMR tab for the same reason - these screens are read here.

test.describe('GMR journey - WCAG 2.2 AA Compliance', () => {
  test.use({ authProfile: COMPANY_PROFILE.AGENT });
  test.describe.configure({ timeout: ACCESSIBILITY_JOURNEY_TIMEOUT });

  test.beforeEach(async () => {
    await ReportLog.setFeature('Accessibility - goods movement reference');
  });

  test('Every screen of the GMR should meet WCAG 2.2 AA', { tag: ['@accessibility'] }, async ({
    raiseMovementForGmrThroughApiFlow, declarationAccessFlow, auditDeclarationFlow,
    accessibilityAuditFlow
  }, testInfo) => {
    await ReportLog.setStory('GMR - raised on an ENS-SFD movement declared through the Trader API');

    const { consignmentReference } = await raiseMovementForGmrThroughApiFlow
      .raiseEligibleMovementThroughTraderApi({
        journey: sfdGmrJourney(GMR_MOVEMENT.UNACCOMPANIED),
      });

    await declarationAccessFlow.openDeclarationInPortal(
      BASE_URL, testInfo, consignmentReference
    );

    await auditDeclarationFlow.auditGmr({
      testInfo,
      audit: accessibilityAuditFlow,
      routeId: ROUTE_ID_CONSTANT.GB_TO_NI.CAIRNRYAN_BELFAST_STENA_LINE,
    });
  });
});
