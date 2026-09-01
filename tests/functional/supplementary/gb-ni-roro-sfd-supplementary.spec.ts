import { ReportLog } from '../../../src/core/report/report-log';
import { getBaseUrl, test } from '../../test-hooks';
import { COMPANY_PROFILE } from '../../../src/auth/credentials';
import {
    traderDefermentSupplementaryDeclaration, tssDefermentSupplementaryDeclaration,
} from '../../../src/test-data/supplementary-declaration-data';

/**
 * The supplementary declaration that follows an ENS-SFD movement, once by each of the
 * two routes it can be paid through.
 *
 * Both tests begin by raising a declaration of their own rather than picking one off
 * the list. That is the only way to know WHICH declaration is being completed: the
 * service raises an SD for every frontier declaration that clears, the importer account
 * on SIT holds hundreds of them, and the suite adds more on every run - so a test that
 * took one from the list would be completing a record it knows nothing about, and
 * racing every other worker for it. How that is done, and why the journey changes hands
 * halfway through, is in GenerateSdDraftFromEnsSfdFlow.
 *
 * What separates the two tests is a single answer - how the duty is paid - and
 * everything that answer makes true or untrue about the rest of the declaration. See
 * traderDefermentSupplementaryDeclaration and tssDefermentSupplementaryDeclaration.
 */
test.describe('GB to NI RoRo Supplementary Declaration - from ENS-SFD', () => {
    test.use({ authProfile: COMPANY_PROFILE.AGENT });

    /**
     * Longer than the suite's five minutes because this is two journeys end to end, and
     * most of the extra is spent waiting rather than clicking: the movement, CDS
     * clearing the SFD, the supplementary declaration's own two wizards - and finally
     * CDS again, which took about two minutes on its own to assess the duty. Measured at
     * 5.3 minutes on SIT, so five was not a margin at all.
     */
    test.describe.configure({ timeout: 900_000 });

    test.beforeEach(async () => {
        await ReportLog.setFeature('GB to NI Supplementary Declaration Process');
    });

    test(
        'Verify the supplementary declaration raised by an ENS-SFD movement is completed and submitted successfully (4000-1SG)- Trader DDA - No Payment through TSS',
        { tag: ['@regression', '@e2e', '@happyPath'] },
        async ({
            generateSdDraftFromEnsSfdFlow,
            completeAndSubmitSupplementaryDeclarationFlow,
        }, testInfo) => {
            await ReportLog.setStory('Supplementary Declaration - from ENS-SFD - RoRo (Accompanied) - Trader DDA');

            const sfdLrn = await ReportLog.step('Raise the supplementary declaration from an ENS-SFD movement', () =>
                generateSdDraftFromEnsSfdFlow.generateSdDraft({ testInfo, url: getBaseUrl() })
            );

            // The declaration already describes this arrangement, so this route only
            // adds the deferment account number CDS wants beside the authorisation.
            await ReportLog.step('Complete and submit the supplementary declaration', () =>
                completeAndSubmitSupplementaryDeclarationFlow.completeSupplementaryDeclaration({
                    testInfo,
                    url: getBaseUrl(),
                    lrn: sfdLrn,
                    overrides: traderDefermentSupplementaryDeclaration(),
                })
            );
        }
    );

    test(
        'Verify the supplementary declaration raised by an ENS-SFD movement is completed and submitted successfully (4000-1SG)- TSS DDA - Payment through TSS',
        { tag: ['@regression', '@e2e', '@happyPath'] },
        async ({
            generateSdDraftFromEnsSfdFlow,
            completeAndSubmitSupplementaryDeclarationFlow,
        }, testInfo) => {
            await ReportLog.setStory('Supplementary Declaration - from ENS-SFD - RoRo (Accompanied) - TSS DDA');

            const sfdLrn = await ReportLog.step('Raise the supplementary declaration from an ENS-SFD movement', () =>
                generateSdDraftFromEnsSfdFlow.generateSdDraft({ testInfo, url: getBaseUrl() })
            );

            // Paying through TSS makes the trader's own deferment arrangement untrue, so
            // this route takes it off both levels instead of adding to it: the CGU and
            // DPO authorisations at consignment level, and the C506 and C505 documents
            // that cite them on the goods item.
            await ReportLog.step('Complete and submit the supplementary declaration', () =>
                completeAndSubmitSupplementaryDeclarationFlow.completeSupplementaryDeclaration({
                    testInfo,
                    url: getBaseUrl(),
                    lrn: sfdLrn,
                    overrides: tssDefermentSupplementaryDeclaration(),
                })
            );
        }
    );
});
