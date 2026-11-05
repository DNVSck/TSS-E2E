import { ReportLog } from '../../../src/core/report/report-log';
import { test } from '../../base-test';
import { IMPORTER_COMPANY_NAME, TSS_DDA_COMPANY_NAME, TSS_DDA_EORI, BASE_URL } from '../../../config/environment';
import { COMPANY_PROFILE, isProfileConfigured, lockWhenSingleAccount } from '../../../src/auth/credentials';
import { REPRESENTATION_TYPE } from '../../../src/constant/representation-type-constant';
import {
    traderDefermentSupplementaryDeclaration,
    tssDefermentSupplementaryDeclaration,
    exciseGoodsSupplementaryDeclaration,
} from '../../../src/test-data/supplementary-declaration-data';
import { sfdStandaloneExciseGoodsItem } from '../../../src/test-data/sfd-standalone-goods-item-data';
import { holderEXW } from '../../../src/test-data/holder-of-authorisation-data';
import { reportTestCaseLink } from '../../../src/helper/report-helper';
import { GOODS_CSV } from '../../../src/test-data/goods-csv-data';

const SD_FROM_SFD_STANDALONE_AGENT_TRADER_DDA = '(4000-000)';
const SD_FROM_SFD_STANDALONE_IMPORTER_TRADER_DDA = '(4000-000)';
const SD_FROM_SFD_STANDALONE_IMPORTER_EXCISE = '(4000-000)';
const SD_FROM_SFD_STANDALONE_AGENT_TSS_DDA = '(4000-000)';
const SD_FROM_SFD_STANDALONE_IMPORTER_TSS_DDA = '(4000-000)';
const SD_FROM_SFD_STANDALONE_IMPORTER_TSS_DDA_RECALL = '(4000-000)';
const SD_FROM_SFD_STANDALONE_IMPORTER_GOODS_CSV = '(4000-000)';

/**
 * The supplementary declaration that follows an SFD standalone movement, by each of
 * the two parties that can complete it.
 *
 * An SFD standalone (controlled goods) is declared, arrived through CDS, and the SD
 * it raises is then completed. The SFD standalone route is always pre-lodged here
 * (the default), because only a controlled-goods movement produces an MRN and raises
 * an SD — the EIDR route is authorised outright and never triggers one.
 *
 * For the agent route, representation is established before the SFD is created
 * (in beforeEach), and it stays active through the CDS arrival trigger, so the agent
 * can go straight to completing the SD without re-representing.
 */
test.describe('GB to NI RoRo Supplementary Declaration - from SFD Standalone - Agent Represents Trader', () => {
    test.use({ authProfile: COMPANY_PROFILE.AGENT });
    test.describe.configure({ timeout: 1_200_000 });

    test.beforeEach(async ({ representTraderFlow }) => {
        await ReportLog.setFeature('GB to NI Supplementary Declaration Process');
        await representTraderFlow.representTrader(IMPORTER_COMPANY_NAME);
    });

    test(
        'Verify the supplementary declaration raised by an SFD standalone movement is completed and submitted successfully (4000-000) - Trader DDA - Agent Represents Trader',
        { tag: ['@regression', '@happyPath'] },
        async ({
            generateSdDraftFromSfdStandaloneFlow,
            completeAndSubmitSupplementaryDeclarationFlow,
        }, testInfo) => {
            await ReportLog.setStory('Supplementary Declaration - from SFD Standalone - Trader DDA - Agent Represents Trader');
            reportTestCaseLink(SD_FROM_SFD_STANDALONE_AGENT_TRADER_DDA);

            const { movementLrn, frontierLrn } = await ReportLog.step('Raise the supplementary declaration from an SFD standalone movement', () =>
                generateSdDraftFromSfdStandaloneFlow.generateSdDraft({
                    testInfo,
                    url: BASE_URL,
                    consignmentOverrides: { representationType: REPRESENTATION_TYPE.DIRECT },
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
        }
    );
});


test.describe('GB to NI RoRo Supplementary Declaration - from SFD Standalone - Importer Declare by themself', () => {
    test.use({ authProfile: COMPANY_PROFILE.IMPORTER });
    test.describe.configure({ timeout: 1_200_000 });

    test.beforeEach(async () => {
        await ReportLog.setFeature('GB to NI Supplementary Declaration Process');
    });

    test(
        'Verify the supplementary declaration raised by an SFD standalone movement is completed and submitted successfully (4000-000) - Trader DDA - Importer Declare by themself',
        { tag: ['@regression', '@happyPath'] },
        async ({
            generateSdDraftFromSfdStandaloneFlow,
            completeAndSubmitSupplementaryDeclarationFlow,
        }, testInfo) => {
            await ReportLog.setStory('Supplementary Declaration - from SFD Standalone - Trader DDA - Importer Declare by themself');
            reportTestCaseLink(SD_FROM_SFD_STANDALONE_IMPORTER_TRADER_DDA);

            const { movementLrn, frontierLrn } = await ReportLog.step('Raise the supplementary declaration from an SFD standalone movement', () =>
                generateSdDraftFromSfdStandaloneFlow.generateSdDraft({
                    testInfo,
                    url: BASE_URL,
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
        }
    );

    test(
        'Verify the supplementary declaration is completed via CSV goods upload and submitted successfully (4000-000) - Trader DDA - Goods CSV - Importer Declare by themself',
        { tag: ['@regression', '@happyPath', '@csvUpload'] },
        async ({
            generateSdDraftFromSfdStandaloneFlow,
            completeAndSubmitSupplementaryDeclarationFlow,
        }, testInfo) => {
            await ReportLog.setStory('Supplementary Declaration - from SFD Standalone - Goods CSV Upload - Trader DDA - Importer Declare by themself');
            reportTestCaseLink(SD_FROM_SFD_STANDALONE_IMPORTER_GOODS_CSV);

            const { movementLrn, frontierLrn } = await ReportLog.step('Raise the supplementary declaration from an SFD standalone movement', () =>
                generateSdDraftFromSfdStandaloneFlow.generateSdDraft({
                    testInfo,
                    url: BASE_URL,
                })
            );

            await ReportLog.step('Complete and submit the supplementary declaration via CSV goods upload', () =>
                completeAndSubmitSupplementaryDeclarationFlow.completeSupplementaryDeclarationWithGoodsCsv({
                    testInfo,
                    url: BASE_URL,
                    movementLrn,
                    frontierLrn,
                    overrides: traderDefermentSupplementaryDeclaration(),
                }, GOODS_CSV.SD)
            );
        }
    );

    test(
        'Verify the supplementary declaration raised by an SFD standalone 0700-F06 movement is completed and submitted successfully (4000-000) - Excise Goods - Importer Declare by themself',
        { tag: ['@regression', '@happyPath'] },
        async ({
            generateSdDraftFromSfdStandaloneFlow,
            completeAndSubmitSupplementaryDeclarationFlow,
        }, testInfo) => {
            await ReportLog.setStory('Supplementary Declaration - from SFD Standalone 0700-F06 - Excise Goods - Importer Declare by themself');
            reportTestCaseLink(SD_FROM_SFD_STANDALONE_IMPORTER_EXCISE);

            const { movementLrn, frontierLrn } = await ReportLog.step('Raise the supplementary declaration from an SFD standalone 0700-F06 movement', () =>
                generateSdDraftFromSfdStandaloneFlow.generateSdDraft({
                    testInfo,
                    url: BASE_URL,
                    consignmentOverrides: {
                        isControlledGoods: true,
                        holdersOfAuthorisation: [holderEXW()],
                    },
                    goodsItemOverrides: sfdStandaloneExciseGoodsItem(),
                })
            );

            await ReportLog.step('Complete and submit the supplementary declaration', () =>
                completeAndSubmitSupplementaryDeclarationFlow.completeSupplementaryDeclaration({
                    testInfo,
                    url: BASE_URL,
                    movementLrn,
                    frontierLrn,
                    overrides: exciseGoodsSupplementaryDeclaration(),
                })
            );
        }
    );
});


test.describe('GB to NI RoRo Supplementary Declaration - from SFD Standalone - Agent Represents TSS DDA', () => {
    test.use({ authProfile: COMPANY_PROFILE.AGENT });
    test.describe.configure({ timeout: 1_200_000 });

    test.beforeEach(async ({ representTraderFlow }) => {
        await ReportLog.setFeature('GB to NI Supplementary Declaration Process');
        await representTraderFlow.representTrader(TSS_DDA_COMPANY_NAME);
    });

    test(
        'Verify the supplementary declaration raised by an SFD standalone movement is completed and submitted successfully (4000-000) - TSS DDA - Agent Represents TSS DDA',
        { tag: ['@regression', '@happyPath'] },
        async ({
            generateSdDraftFromSfdStandaloneFlow,
            completeAndSubmitSupplementaryDeclarationFlow,
            triggerFinalStatusThroughCdsFlow,
            openAs,
        }, testInfo) => {
            await ReportLog.setStory('Supplementary Declaration - from SFD Standalone - TSS DDA - Agent Represents TSS DDA');
            reportTestCaseLink(SD_FROM_SFD_STANDALONE_AGENT_TSS_DDA);

            const { movementLrn, frontierLrn } = await ReportLog.step('Raise the supplementary declaration from an SFD standalone movement', () =>
                generateSdDraftFromSfdStandaloneFlow.generateSdDraft({
                    testInfo,
                    url: BASE_URL,
                    declaringForEori: TSS_DDA_EORI,
                    consignmentOverrides: { representationType: REPRESENTATION_TYPE.DIRECT },
                })
            );

            const reference = await ReportLog.step('Complete and submit the supplementary declaration', () =>
                completeAndSubmitSupplementaryDeclarationFlow.completeSupplementaryDeclaration({
                    testInfo,
                    url: BASE_URL,
                    movementLrn,
                    frontierLrn,
                    overrides: tssDefermentSupplementaryDeclaration(),
                })
            );

            const tssDda = await ReportLog.step('Sign in as the TSS DDA Importer to pay', () =>
                openAs(COMPANY_PROFILE.TSS_DDA)
            );
            const paid = await ReportLog.step('TSS DDA Trader pays the supplementary declaration through TSS', () =>
                tssDda.supplementaryDeclaration.paySupplementaryDeclaration(reference)
            );
            await ReportLog.step('Close the TSS DDA Importer session', () => tssDda.close());

            await ReportLog.step('Close the supplementary declaration through CDS', () =>
                triggerFinalStatusThroughCdsFlow.closeSupplementaryDeclaration(paid)
            );
        }
    );
});


test.describe('GB to NI RoRo Supplementary Declaration - from SFD Standalone - Importer TSS DDA', { lock: lockWhenSingleAccount(COMPANY_PROFILE.TSS_DDA) }, () => {
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
        'Verify the supplementary declaration raised by an SFD standalone movement is completed and submitted successfully (4000-000) - TSS DDA - Importer Declare by themself',
        { tag: ['@regression', '@happyPath'] },
        async ({
            generateSdDraftFromSfdStandaloneFlow,
            completeAndSubmitSupplementaryDeclarationFlow,
            triggerFinalStatusThroughCdsFlow,
        }, testInfo) => {
            await ReportLog.setStory('Supplementary Declaration - from SFD Standalone - TSS DDA - Importer Declare by themself');
            reportTestCaseLink(SD_FROM_SFD_STANDALONE_IMPORTER_TSS_DDA);

            const { movementLrn, frontierLrn } = await ReportLog.step('Raise the supplementary declaration from an SFD standalone movement', () =>
                generateSdDraftFromSfdStandaloneFlow.generateSdDraft({ testInfo, url: BASE_URL, declaringForEori: TSS_DDA_EORI })
            );

            const reference = await ReportLog.step('Complete and submit the supplementary declaration', () =>
                completeAndSubmitSupplementaryDeclarationFlow.completeSupplementaryDeclaration({
                    testInfo,
                    url: BASE_URL,
                    movementLrn,
                    frontierLrn,
                    overrides: tssDefermentSupplementaryDeclaration(),
                })
            );

            const paid = await ReportLog.step('Pay the supplementary declaration through TSS', () =>
                completeAndSubmitSupplementaryDeclarationFlow.paySupplementaryDeclaration(reference)
            );

            await ReportLog.step('Close the supplementary declaration through CDS', () =>
                triggerFinalStatusThroughCdsFlow.closeSupplementaryDeclaration(paid)
            );
        }
    );

    test(
        'Verify the supplementary declaration pending payment is recalled to draft, resubmitted and paid successfully (4000-000) - TSS DDA - Importer Declare by themself',
        { tag: ['@regression'] },
        async ({
            generateSdDraftFromSfdStandaloneFlow,
            completeAndSubmitSupplementaryDeclarationFlow,
            triggerFinalStatusThroughCdsFlow,
        }, testInfo) => {
            await ReportLog.setStory('Supplementary Declaration - from SFD Standalone - TSS DDA - Recall to draft');
            reportTestCaseLink(SD_FROM_SFD_STANDALONE_IMPORTER_TSS_DDA_RECALL);

            const { movementLrn, frontierLrn } = await ReportLog.step('Raise the supplementary declaration from an SFD standalone movement', () =>
                generateSdDraftFromSfdStandaloneFlow.generateSdDraft({ testInfo, url: BASE_URL, declaringForEori: TSS_DDA_EORI })
            );

            const reference = await ReportLog.step('Complete and submit the supplementary declaration', () =>
                completeAndSubmitSupplementaryDeclarationFlow.completeSupplementaryDeclaration({
                    testInfo,
                    url: BASE_URL,
                    movementLrn,
                    frontierLrn,
                    overrides: tssDefermentSupplementaryDeclaration(),
                })
            );

            await ReportLog.step('Recall the supplementary declaration to draft', () =>
                completeAndSubmitSupplementaryDeclarationFlow.recallSupplementaryDeclarationToDraft(reference)
            );

            await ReportLog.step('Resubmit the recalled supplementary declaration', () =>
                completeAndSubmitSupplementaryDeclarationFlow.resubmitSupplementaryDeclaration(
                    reference, tssDefermentSupplementaryDeclaration()
                )
            );

            const paid = await ReportLog.step('Pay the supplementary declaration through TSS', () =>
                completeAndSubmitSupplementaryDeclarationFlow.paySupplementaryDeclaration(reference)
            );

            await ReportLog.step('Close the supplementary declaration through CDS', () =>
                triggerFinalStatusThroughCdsFlow.closeSupplementaryDeclaration(paid)
            );
        }
    );
});
