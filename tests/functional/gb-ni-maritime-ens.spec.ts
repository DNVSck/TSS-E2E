import { ReportLog } from '../../src/core/report/report-log';
import { test } from '../base-test';
import { COMPANY_PROFILE } from '../../src/auth/credentials';
import {
  byMaritime, ensEidrDeclaration, ensImmiDeclaration, ensOnlyDeclaration, ensSfdDeclaration,
} from '../../src/test-data/ens-declaration-data';

test.describe('GB to NI Maritime ENS Declaration Process - Agent Represents Trader', () => {
  test.use({ authProfile: COMPANY_PROFILE.AGENT });

  test.beforeEach(async () => {
    await ReportLog.setFeature('GB to NI Maritime ENS Declaration Process');
  });

  test('Verify ENS Only - Maritime is created and submitted successfully', { tag: ['@maritime', '@regression', '@happyPath'] }, async ({ createAndSubmitEnsDeclarationFlow }, testInfo) => {
    await ReportLog.setStory('ENS-only - GB to NI Maritime');
    await ReportLog.step('Create and submit the ENS declaration', () =>
      createAndSubmitEnsDeclarationFlow.completeEnsDeclarationFlow(byMaritime(ensOnlyDeclaration(testInfo, {})))
    );
  });

  test('Verify ENS-SFD - Maritime is created and submitted successfully (4000-000)', { tag: ['@maritime', '@regression', '@happyPath'] }, async ({ createAndSubmitEnsDeclarationFlow, triggerFinalStatusThroughCdsFlow }, testInfo) => {
    await ReportLog.setStory('ENS SFD - GB to NI Maritime Simplified Customs Declaration');
    const { generatedConsignment: sfd } = await ReportLog.step('Create and submit the ENS declaration', () =>
      createAndSubmitEnsDeclarationFlow.completeEnsDeclarationFlow(byMaritime(ensSfdDeclaration(testInfo, {})))
    );

    await ReportLog.step('Arrive the SFD consignment through CDS', () =>
      triggerFinalStatusThroughCdsFlow.arriveSfdConsignment(sfd)
    );
  });

  test('Verify ENS-IMMI - Maritime without TGP is created and submitted successfully (4000-1SG)', { tag: ['@maritime', '@regression', '@happyPath'] }, async ({ createAndSubmitEnsDeclarationFlow, triggerFinalStatusThroughCdsFlow }, testInfo) => {
    await ReportLog.setStory('IMMI Pre-movement - GB to NI Maritime IMMI without TGP');
    const { generatedConsignment: immi } = await ReportLog.step('Create and submit the ENS declaration', () =>
      createAndSubmitEnsDeclarationFlow.completeEnsDeclarationFlow(byMaritime(ensImmiDeclaration(testInfo)))
    );

    await ReportLog.step('Close the IMMI consignment through CDS', () =>
      triggerFinalStatusThroughCdsFlow.closeImmiConsignment(immi)
    );
  });

  test('Verify ENS-EIDR - Maritime is created and submitted successfully (4000-000)', { tag: ['@maritime', '@regression', '@happyPath'] }, async ({ createAndSubmitEnsDeclarationFlow, ics2NotificationFlow }, testInfo) => {
    await ReportLog.setStory('EIDR - GB to NI Maritime (controlled goods = No)');
    const { transportDocumentNumber, ensMrn } = await ReportLog.step('Create and submit the ENS declaration', () =>
      createAndSubmitEnsDeclarationFlow.completeEnsDeclarationFlow(byMaritime(ensEidrDeclaration(testInfo)))
    );

    await ReportLog.step('Authorise the movement through ICS2', () =>
      ics2NotificationFlow.authoriseForMovementUnlessMocked(ensMrn, transportDocumentNumber)
    );
  });
});
