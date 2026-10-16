import { ReportLog } from '../../../src/core/report/report-log';
import { test } from '../../base-test';
import { COMPANY_PROFILE, CompanyProfile } from '../../../src/auth/credentials';
import { reportTestCaseLink } from '../../../src/helper/report-helper';
import {
  byMaritime, ensEidrDeclaration, ensImmiDeclaration, ensOnlyDeclaration, ensSfdDeclaration,
} from '../../../src/test-data/ens-declaration-data';

interface MaritimeEnsCases {
  who: string;
  profile: CompanyProfile;
  ensOnly?: string;
  ensSfd?: string;
  ensImmi?: string;
  ensEidr?: string;
}

const DECLARANTS: MaritimeEnsCases[] = [
  { who: 'Agent Represents Trader', profile: COMPANY_PROFILE.AGENT, ensSfd: '6556' },
  { who: 'Trader (Haulier)', profile: COMPANY_PROFILE.HAULIER, ensOnly: '6560', ensSfd: '6555', ensImmi: '6557', ensEidr: '6559' },
];

const linkCase = (id?: string) => {
  if (id) reportTestCaseLink(id);
};

for (const declarant of DECLARANTS) {
  test.describe(`GB to NI Maritime ENS Declaration Process - ${declarant.who}`, () => {
    test.use({ authProfile: declarant.profile });

    test.beforeEach(async () => {
      await ReportLog.setFeature('GB to NI Maritime ENS Declaration Process');
    });

    test('Verify ENS Only - Maritime is created and submitted successfully', { tag: ['@maritime', '@regression', '@happyPath'] }, async ({ createAndSubmitEnsDeclarationFlow }, testInfo) => {
      await ReportLog.setStory(`ENS-only - GB to NI Maritime - ${declarant.who}`);
      linkCase(declarant.ensOnly);
      await ReportLog.step('Create and submit the ENS declaration', () =>
        createAndSubmitEnsDeclarationFlow.completeEnsDeclarationFlow(byMaritime(ensOnlyDeclaration(testInfo, {})))
      );
    });

    test('Verify ENS-SFD - Maritime is created and submitted successfully (4000-000)', { tag: ['@maritime', '@regression', '@happyPath'] }, async ({ createAndSubmitEnsDeclarationFlow, triggerFinalStatusThroughCdsFlow }, testInfo) => {
      await ReportLog.setStory(`ENS SFD - GB to NI Maritime Simplified Customs Declaration - ${declarant.who}`);
      linkCase(declarant.ensSfd);
      const { generatedConsignment: sfd } = await ReportLog.step('Create and submit the ENS declaration', () =>
        createAndSubmitEnsDeclarationFlow.completeEnsDeclarationFlow(byMaritime(ensSfdDeclaration(testInfo, {})))
      );

      await ReportLog.step('Arrive the SFD consignment through CDS', () =>
        triggerFinalStatusThroughCdsFlow.arriveSfdConsignment(sfd)
      );
    });

    test('Verify ENS-IMMI - Maritime without TGP is created and submitted successfully (4000-1SG)', { tag: ['@maritime', '@regression', '@happyPath'] }, async ({ createAndSubmitEnsDeclarationFlow, triggerFinalStatusThroughCdsFlow }, testInfo) => {
      await ReportLog.setStory(`IMMI Pre-movement - GB to NI Maritime IMMI without TGP - ${declarant.who}`);
      linkCase(declarant.ensImmi);
      const { generatedConsignment: immi } = await ReportLog.step('Create and submit the ENS declaration', () =>
        createAndSubmitEnsDeclarationFlow.completeEnsDeclarationFlow(byMaritime(ensImmiDeclaration(testInfo)))
      );

      await ReportLog.step('Close the IMMI consignment through CDS', () =>
        triggerFinalStatusThroughCdsFlow.closeImmiConsignment(immi)
      );
    });

    test('Verify ENS-EIDR - Maritime is created and submitted successfully (4000-000)', { tag: ['@maritime', '@regression', '@happyPath'] }, async ({ createAndSubmitEnsDeclarationFlow, ics2NotificationFlow }, testInfo) => {
      await ReportLog.setStory(`EIDR - GB to NI Maritime (controlled goods = No) - ${declarant.who}`);
      linkCase(declarant.ensEidr);
      const { transportDocumentNumber, ensMrn } = await ReportLog.step('Create and submit the ENS declaration', () =>
        createAndSubmitEnsDeclarationFlow.completeEnsDeclarationFlow(byMaritime(ensEidrDeclaration(testInfo)))
      );

      await ReportLog.step('Authorise the movement through ICS2', () =>
        ics2NotificationFlow.authoriseForMovementUnlessMocked(ensMrn, transportDocumentNumber)
      );
    });
  });
}
