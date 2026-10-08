import { ReportLog } from '../../../src/core/report/report-log';
import { test } from '../../base-test';
import { IMPORTER_COMPANY_NAME, TSS_DDA_COMPANY_NAME, BASE_URL } from '../../../config/environment';
import { COMPANY_PROFILE, isProfileConfigured } from '../../../src/auth/credentials';
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
import { CANCELLATION_REASON } from '../../../src/test-data/consignment-data';

const SD_AGENT_REPRESENTS_TSS_DDA = '4703';
const SD_AGENT_REPRESENTS_TRADER_DDA = '4704';
const SD_CANCELLED = '6115';
const SD_CANCEL_DISMISSED = '6116';
const SD_IMPORTER_TRADER_DDA = '4700';
const SD_IMPORTER_TSS_DDA = '4699';
const SD_RESUBMIT = '7106';
const SD_CANCEL_NEEDS_REASON = '7108';
const SD_CANCEL_TIR = '7109';

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
                generateSdDraftFromEnsSfdFlow.generateSdDraft({ testInfo, url: BASE_URL })
            );

            // The declaration already describes this arrangement, so this route only
            // adds the deferment account number CDS wants beside the authorisation.
            await ReportLog.step('Complete and submit the supplementary declaration', () =>
                completeAndSubmitSupplementaryDeclarationFlow.completeSupplementaryDeclaration({
                    testInfo,
                    url: BASE_URL,
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
                    url: BASE_URL,
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
                    url: BASE_URL,
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
            completeAndSubmitSupplementaryDeclarationFlow,
        }, testInfo) => {
            reportTestCaseLink(SD_AGENT_REPRESENTS_TRADER_DDA);

            await ReportLog.setStory('Supplementary Declaration - from ENS-SFD declared through the Trader API - Trader DDA');

            const source = await generateSdDraftThroughApiFlow.raiseSdDraft({
                representing: { companyName: IMPORTER_COMPANY_NAME, testInfo, url: BASE_URL },
            });

            await ReportLog.step('Complete and submit the supplementary declaration', () =>
                completeAndSubmitSupplementaryDeclarationFlow.completeSupplementaryDeclaration({
                    testInfo,
                    url: BASE_URL,
                    ...source,
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
            completeAndSubmitSupplementaryDeclarationFlow,
        }, testInfo) => {
            reportTestCaseLink(SD_AGENT_REPRESENTS_TSS_DDA);

            await ReportLog.setStory('Supplementary Declaration - from ENS-SFD declared through the Trader API - TSS DDA');

            const source = await generateSdDraftThroughApiFlow.raiseSdDraft({
                declaration: tssDdaTraderApiSupplementaryDeclarationMovement(),
                representing: { companyName: TSS_DDA_COMPANY_NAME, testInfo, url: BASE_URL },
            });

            await ReportLog.step('Complete and submit the supplementary declaration', () =>
                completeAndSubmitSupplementaryDeclarationFlow.completeSupplementaryDeclaration({
                    testInfo,
                    url: BASE_URL,
                    ...source,
                    overrides: declaredThroughTraderApi(tssDefermentSupplementaryDeclaration()),
                })
            );
        }
    );

});


test.describe('GB to NI RoRo Supplementary Declaration - completed by the importer itself', () => {
    test.use({ authProfile: COMPANY_PROFILE.IMPORTER });

    test.describe.configure({ timeout: 1_200_000 });

    test.beforeEach(async () => {
        await ReportLog.setFeature('GB to NI Supplementary Declaration Process');
    });

    test(
        'Verify the importer completes and submits its own supplementary declaration raised by an ENS-SFD movement declared through the Trader API (4000-1SG) - Trader DDA',
        { tag: ['@regression', '@happyPath'] },
        async ({
            generateSdDraftThroughApiFlow,
            completeAndSubmitSupplementaryDeclarationFlow,
        }, testInfo) => {
            await ReportLog.setStory('Supplementary Declaration - from ENS-SFD declared through the Trader API - completed by the importer - Trader DDA');
            reportTestCaseLink(SD_IMPORTER_TRADER_DDA);

            const source = await generateSdDraftThroughApiFlow.raiseSdDraft();

            await ReportLog.step('Complete and submit the supplementary declaration', () =>
                completeAndSubmitSupplementaryDeclarationFlow.completeSupplementaryDeclaration({
                    testInfo,
                    url: BASE_URL,
                    ...source,
                    overrides: declaredThroughTraderApi(traderDefermentSupplementaryDeclaration()),
                })
            );
        }
    );
});


test.describe('GB to NI RoRo Supplementary Declaration - completed by the importer itself - TSS DDA', { lock: COMPANY_PROFILE.TSS_DDA }, () => {
    test.use({ authProfile: COMPANY_PROFILE.TSS_DDA });

    test.describe.configure({ timeout: 1_200_000 });

    test.skip(
        !isProfileConfigured(COMPANY_PROFILE.TSS_DDA),
        'No TSS_DDA login in this environment - see ON_DEMAND_PROFILES in src/auth/credentials.ts'
    );

    test.beforeEach(async () => {
        await ReportLog.setFeature('GB to NI Supplementary Declaration Process');
    });

    test(
        'Verify the importer completes and submits its own supplementary declaration raised by an ENS-SFD movement declared through the Trader API (4000-1SG) - TSS DDA - Payment through TSS',
        { tag: ['@regression', '@happyPath'] },
        async ({
            generateSdDraftThroughApiFlow,
            completeAndSubmitSupplementaryDeclarationFlow,
        }, testInfo) => {
            await ReportLog.setStory('Supplementary Declaration - from ENS-SFD declared through the Trader API - completed by the importer - TSS DDA');
            reportTestCaseLink(SD_IMPORTER_TSS_DDA);

            const source = await generateSdDraftThroughApiFlow.raiseSdDraft({
                declaration: tssDdaTraderApiSupplementaryDeclarationMovement(),
            });

            await ReportLog.step('Complete and submit the supplementary declaration', () =>
                completeAndSubmitSupplementaryDeclarationFlow.completeSupplementaryDeclaration({
                    testInfo,
                    url: BASE_URL,
                    ...source,
                    overrides: declaredThroughTraderApi(tssDefermentSupplementaryDeclaration()),
                })
            );
        }
    );
});


test.describe('GB to NI RoRo Supplementary Declaration - resubmission after CDS hands it back', () => {
    test.use({ authProfile: COMPANY_PROFILE.IMPORTER });

    test.describe.configure({ timeout: 1_200_000 });

    test.beforeEach(async () => {
        await ReportLog.setFeature('GB to NI Supplementary Declaration Process');
    });

    test(
        'Verify a supplementary declaration in "Trader Input Required" can be completed and resubmitted',
        { tag: ['@regression', '@resubmission'] },
        async ({
            generateSdDraftThroughApiFlow,
            completeAndSubmitSupplementaryDeclarationFlow,
        }, testInfo) => {
            await ReportLog.setStory('Supplementary Declaration - submitted unanswered, handed back, then completed and resubmitted');
            reportTestCaseLink(SD_RESUBMIT);

            const source = await generateSdDraftThroughApiFlow.raiseSdDraft();

            await ReportLog.step('Submit the draft unanswered - expect it to be handed back', () =>
                completeAndSubmitSupplementaryDeclarationFlow.submitSupplementaryDeclarationExpectingRejection({
                    testInfo, url: BASE_URL, ...source,
                })
            );

            await ReportLog.step('Answer what it was missing and resubmit', () =>
                completeAndSubmitSupplementaryDeclarationFlow.completeSupplementaryDeclaration({
                    testInfo,
                    url: BASE_URL,
                    ...source,
                    overrides: declaredThroughTraderApi(traderDefermentSupplementaryDeclaration()),
                })
            );
        }
    );
});


test.describe('GB to NI RoRo Supplementary Declaration - cancellation', () => {
    test.use({ authProfile: COMPANY_PROFILE.IMPORTER });

    test.describe.configure({ timeout: 1_200_000 });

    test.beforeEach(async () => {
        await ReportLog.setFeature('GB to NI Supplementary Declaration Process');
    });

    test(
        'Verify a supplementary declaration still in "Draft" can be cancelled',
        { tag: ['@regression', '@cancellation'] },
        async ({
            generateSdDraftThroughApiFlow,
            completeAndSubmitSupplementaryDeclarationFlow,
            cancelSupplementaryDeclarationFlow,
            triggerFinalStatusThroughCdsFlow,
        }, testInfo) => {
            await ReportLog.setStory('Supplementary Declaration - cancelled while it is still a draft');
            reportTestCaseLink(SD_CANCELLED);

            const source = await generateSdDraftThroughApiFlow.raiseSdDraft();
            const reference = await completeAndSubmitSupplementaryDeclarationFlow.openSupplementaryDeclaration({
                testInfo, url: BASE_URL, ...source,
            });

            await cancelSupplementaryDeclarationFlow
                .cancelSupplementaryDeclarationAndVerifyItIsPendingCancellation(CANCELLATION_REASON, source.frontierLrn);
            await triggerFinalStatusThroughCdsFlow
                .acceptSupplementaryDeclarationCancellationThroughCds({ reference, frontierLrn: source.frontierLrn });
        }
    );

    test(
        'Verify a supplementary declaration cannot be cancelled without a reason',
        { tag: ['@regression', '@cancellation'] },
        async ({
            generateSdDraftThroughApiFlow,
            completeAndSubmitSupplementaryDeclarationFlow,
            cancelSupplementaryDeclarationFlow,
        }, testInfo) => {
            await ReportLog.setStory('Supplementary Declaration - the service refuses a cancellation with no reason');
            reportTestCaseLink(SD_CANCEL_NEEDS_REASON);

            const source = await generateSdDraftThroughApiFlow.raiseSdDraft();
            await completeAndSubmitSupplementaryDeclarationFlow.openSupplementaryDeclaration({
                testInfo, url: BASE_URL, ...source,
            });

            await cancelSupplementaryDeclarationFlow.verifyCancellationNeedsAReason();
        }
    );

    test(
        'Verify a supplementary declaration survives going back from its cancel screen',
        { tag: ['@regression', '@cancellation'] },
        async ({
            generateSdDraftThroughApiFlow,
            completeAndSubmitSupplementaryDeclarationFlow,
            cancelSupplementaryDeclarationFlow,
        }, testInfo) => {
            await ReportLog.setStory('Supplementary Declaration - the trader opens the cancel screen and goes back');
            reportTestCaseLink(SD_CANCEL_DISMISSED);

            const source = await generateSdDraftThroughApiFlow.raiseSdDraft();
            await completeAndSubmitSupplementaryDeclarationFlow.openSupplementaryDeclaration({
                testInfo, url: BASE_URL, ...source,
            });

            await cancelSupplementaryDeclarationFlow.verifyCancellationCanBeDismissed();
        }
    );

    test(
        'Verify a supplementary declaration in "Trader Input Required" can be cancelled instead of completed',
        { tag: ['@regression', '@cancellation'] },
        async ({
            generateSdDraftThroughApiFlow,
            completeAndSubmitSupplementaryDeclarationFlow,
            cancelSupplementaryDeclarationFlow,
            triggerFinalStatusThroughCdsFlow,
        }, testInfo) => {
            await ReportLog.setStory('Supplementary Declaration - handed back by CDS, and the trader cancels it rather than completing it');
            reportTestCaseLink(SD_CANCEL_TIR);

            const source = await generateSdDraftThroughApiFlow.raiseSdDraft();

            const reference = await ReportLog.step('Submit the draft unanswered - expect it to be handed back', () =>
                completeAndSubmitSupplementaryDeclarationFlow.submitSupplementaryDeclarationExpectingRejection({
                    testInfo, url: BASE_URL, ...source,
                })
            );

            await cancelSupplementaryDeclarationFlow
                .cancelSupplementaryDeclarationAndVerifyItIsPendingCancellation(CANCELLATION_REASON, source.frontierLrn);
            await triggerFinalStatusThroughCdsFlow
                .acceptSupplementaryDeclarationCancellationThroughCds({ reference, frontierLrn: source.frontierLrn });
        }
    );
});
