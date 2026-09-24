import { ReportLog } from '../../../src/core/report/report-log';
import { getBaseUrl, test } from '../../test-hooks';
import { IMPORTER_COMPANY_NAME, TSS_DDA_COMPANY_NAME } from '../../../config/environment';
import { COMPANY_PROFILE } from '../../../src/auth/credentials';
import {
    declaredThroughTraderApi,
    traderDefermentSupplementaryDeclaration, tssDefermentSupplementaryDeclaration,
} from '../../../src/test-data/supplementary-declaration-data';
import {
    scdpRoRoAccompaniedSupplementaryDeclarationMovement,
    tssDdaSupplementaryDeclarationMovement,
    tssDdaTraderApiSupplementaryDeclarationMovement,
} from '../../../src/test-data/supplementary-declaration-movement-data';
import { reportTestCaseLink } from '../../../src/helper/report-helper';

const SCDP_SUPP_CASE_ID = '4699';
const SD_AGENT_REPRESENTS_TSS_DDA = '4703';
const SD_AGENT_REPRESENTS_TRADER_DDA = '4704';

/**
 * The supplementary declaration that follows an ENS-SFD movement, once by each of the
 * two routes it can be paid through.
 *
 * Every test begins by raising a declaration of its own rather than picking one off
 * the list. That is the only way to know WHICH declaration is being completed: the
 * service raises an SD for every frontier declaration that clears, the importer account
 * on SIT holds hundreds of them, and the suite adds more on every run - so a test that
 * took one from the list would be completing a record it knows nothing about, and
 * racing every other worker for it. How that is done, and why the journey changes hands
 * halfway through, is in GenerateSdDraftFromEnsSfdFlow.
 *
 * What separates the routes is a single answer - how the duty is paid - and
 * everything that answer makes true or untrue about the rest of the declaration. See
 * traderDefermentSupplementaryDeclaration and tssDefermentSupplementaryDeclaration.
 */
test.describe('GB to NI RoRo Supplementary Declaration - from ENS-SFD', () => {
    test.use({ authProfile: COMPANY_PROFILE.AGENT });

    test.describe.configure({ timeout: 1_200_000 });

    test.beforeEach(async () => {
        await ReportLog.setFeature('GB to NI Supplementary Declaration Process');
    });

    test(
        'Verify the supplementary declaration raised by an ENS-SFD movement is completed and submitted successfully (4000-1SG)- Trader DDA - No Payment through TSS',
        { tag: ['@e2e', '@happyPath'] },
        async ({
            generateSdDraftFromEnsSfdFlow,
            completeAndSubmitSupplementaryDeclarationFlow,
        }, testInfo) => {
            await ReportLog.setStory('Supplementary Declaration - from ENS-SFD - RoRo (Accompanied) - Trader DDA');
            reportTestCaseLink(SD_AGENT_REPRESENTS_TRADER_DDA);

            const { movementLrn, frontierLrn } = await ReportLog.step('Raise the supplementary declaration from an ENS-SFD movement', () =>
                generateSdDraftFromEnsSfdFlow.generateSdDraft({ testInfo, url: getBaseUrl() })
            );

            // The declaration already describes this arrangement, so this route only
            // adds the deferment account number CDS wants beside the authorisation.
            await ReportLog.step('Complete and submit the supplementary declaration', () =>
                completeAndSubmitSupplementaryDeclarationFlow.completeSupplementaryDeclaration({
                    testInfo,
                    url: getBaseUrl(),
                    movementLrn,
                    frontierLrn,
                    overrides: traderDefermentSupplementaryDeclaration(),
                })
            );
        }
    );

    test(
        'Verify the supplementary declaration raised by an ENS-SFD movement is completed and submitted successfully (4000-1SG)- TSS DDA - Payment through TSS',
        { tag: ['@e2e', '@happyPath'] },
        async ({
            generateSdDraftFromEnsSfdFlow,
            completeAndSubmitSupplementaryDeclarationFlow,
        }, testInfo) => {
            reportTestCaseLink(SD_AGENT_REPRESENTS_TSS_DDA);
            
            await ReportLog.setStory('Supplementary Declaration - from ENS-SFD - RoRo (Accompanied) - TSS DDA');

            const { movementLrn, frontierLrn } = await ReportLog.step('Raise the supplementary declaration from an ENS-SFD movement', () =>
                generateSdDraftFromEnsSfdFlow.generateSdDraft({
                    testInfo,
                    url: getBaseUrl(),
                    overrides: tssDdaSupplementaryDeclarationMovement(),
                    companyName: TSS_DDA_COMPANY_NAME,
                })
            );

            // Paying through TSS makes the trader's own deferment arrangement untrue, so
            // this route takes it off both levels instead of adding to it: the CGU and
            // DPO authorisations at consignment level, and the C506 and C505 documents
            // that cite them on the goods item.
            await ReportLog.step('Complete and submit the supplementary declaration', () =>
                completeAndSubmitSupplementaryDeclarationFlow.completeSupplementaryDeclaration({
                    testInfo,
                    url: getBaseUrl(),
                    movementLrn,
                    frontierLrn,
                    overrides: tssDefermentSupplementaryDeclaration(),
                })
            );
        }
    );

    test(
        'Verify the supplementary declaration raised by an ENS-SFD movement declared through the Trader API is completed and submitted successfully (4000-1SG) - Trader DDA',
        { tag: ['@smoke', '@regression', '@happyPath'] },
        async ({
            generateSdDraftThroughApiFlow,
            representTraderFlow,
            completeAndSubmitSupplementaryDeclarationFlow,
        }, testInfo) => {
            reportTestCaseLink(SD_AGENT_REPRESENTS_TRADER_DDA);

            await ReportLog.setStory('Supplementary Declaration - from ENS-SFD declared through the Trader API - Trader DDA');

            // ENS-SFD wizard skipped here - covered by
            // tests/functional/ens-integrated/gb-ni-roro-ens-sfd.spec.ts
            const { movementLrn, frontierLrn } = await ReportLog.step('Raise the supplementary declaration from a movement declared through the Trader API', () =>
                generateSdDraftThroughApiFlow.generateSdDraft()
            );

            await representTraderFlow.openPortalAndRepresent(
                getBaseUrl(), testInfo, IMPORTER_COMPANY_NAME
            );

            await ReportLog.step('Complete and submit the supplementary declaration', () =>
                completeAndSubmitSupplementaryDeclarationFlow.completeSupplementaryDeclaration({
                    testInfo,
                    url: getBaseUrl(),
                    movementLrn,
                    frontierLrn,
                    overrides: declaredThroughTraderApi(traderDefermentSupplementaryDeclaration()),
                })
            );
        }
    );

    test(
        'Verify the supplementary declaration raised by an ENS-SFD movement declared through the Trader API is completed and submitted successfully (4000-1SG) - TSS DDA - Payment through TSS',
        { tag: ['@regression', '@happyPath'] },
        async ({
            generateSdDraftThroughApiFlow,
            representTraderFlow,
            completeAndSubmitSupplementaryDeclarationFlow,
        }, testInfo) => {
            await ReportLog.setStory('Supplementary Declaration - from ENS-SFD declared through the Trader API - TSS DDA');

            // ENS-SFD wizard skipped here - covered by
            // tests/functional/ens-integrated/gb-ni-roro-ens-sfd.spec.ts
            const { movementLrn, frontierLrn } = await ReportLog.step('Raise the supplementary declaration from a movement declared through the Trader API', () =>
                generateSdDraftThroughApiFlow.generateSdDraft(tssDdaTraderApiSupplementaryDeclarationMovement())
            );

            await representTraderFlow.openPortalAndRepresent(
                getBaseUrl(), testInfo, TSS_DDA_COMPANY_NAME
            );

            await ReportLog.step('Complete and submit the supplementary declaration', () =>
                completeAndSubmitSupplementaryDeclarationFlow.completeSupplementaryDeclaration({
                    testInfo,
                    url: getBaseUrl(),
                    movementLrn,
                    frontierLrn,
                    overrides: declaredThroughTraderApi(tssDefermentSupplementaryDeclaration()),
                })
            );
        }
    );

    test(
        'Verify the supplementary declaration raised by an ENS-SFD movement with At Risk and SCDP authorization is completed and submitted successfully - TSS DDA - Payment through TSS',
        { tag: ['@supplementary'] },
        async ({
                   generateSdDraftFromEnsSfdFlow,
                   completeAndSubmitSupplementaryDeclarationFlow,
               }, testInfo) => {
            await ReportLog.setStory('Supplementary Declaration - from ENS-SFD - RoRo (Accompanied) - At Risk - SCDP - TSS DDA');
            reportTestCaseLink(SCDP_SUPP_CASE_ID);

            const { movementLrn, frontierLrn } = await ReportLog.step('Raise the supplementary declaration from an ENS-SFD movement with At Risk and SCDP authorization', () =>
                generateSdDraftFromEnsSfdFlow.generateSdDraft({
                    testInfo,
                    url: getBaseUrl(),
                    overrides: scdpRoRoAccompaniedSupplementaryDeclarationMovement()
                })
            );

            await ReportLog.step('Complete and submit the supplementary declaration', () =>
                completeAndSubmitSupplementaryDeclarationFlow.completeSupplementaryDeclaration({
                    testInfo,
                    url: getBaseUrl(),
                    movementLrn,
                    frontierLrn,
                    overrides: tssDefermentSupplementaryDeclaration(),
                })
            );
        }
    );
});
