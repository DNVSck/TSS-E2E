import { ReportLog } from '../../src/core/report/report-log';
import { test } from '../base-test';
import { BASE_URL } from '../../config/environment';
import { COMPANY_PROFILE } from '../../src/auth/credentials';
import { byMaritime } from '../../src/test-data/ens-declaration-data';
import { supplementaryDeclarationMovement } from '../../src/test-data/supplementary-declaration-movement-data';
import { traderDefermentSupplementaryDeclaration } from '../../src/test-data/supplementary-declaration-data';

test.describe('GB to NI Maritime Supplementary Declaration - from ENS-SFD', () => {
  test.use({ authProfile: COMPANY_PROFILE.AGENT });

  test.describe.configure({ timeout: 1_200_000 });

  test.beforeEach(async () => {
    await ReportLog.setFeature('GB to NI Supplementary Declaration Process');
  });

  test('Verify the supplementary declaration raised by a Maritime ENS-SFD movement is completed and submitted successfully - Trader DDA - No Payment through TSS', { tag: ['@maritime', '@regression', '@happyPath'] }, async ({ generateSdDraftFromEnsSfdFlow, completeAndSubmitSupplementaryDeclarationFlow }, testInfo) => {
    await ReportLog.setStory('Supplementary Declaration - from ENS-SFD - Maritime - Trader DDA');

    const { movementLrn, frontierLrn } = await ReportLog.step('Raise the supplementary declaration from a Maritime ENS-SFD movement', () =>
      generateSdDraftFromEnsSfdFlow.generateSdDraft({
        testInfo,
        url: BASE_URL,
        overrides: byMaritime(supplementaryDeclarationMovement()),
      })
    );

    await ReportLog.step('Complete and submit the supplementary declaration', () =>
      completeAndSubmitSupplementaryDeclarationFlow.completeSupplementaryDeclaration({
        testInfo,
        url: BASE_URL,
        movementLrn,
        frontierLrn,
        overrides: traderDefermentSupplementaryDeclaration(),
      })
    );
  });
});
