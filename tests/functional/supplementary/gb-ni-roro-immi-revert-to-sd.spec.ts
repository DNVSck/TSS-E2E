import { ReportLog } from '../../../src/core/report/report-log';
import { test } from '../../base-test';
import { BASE_URL, IMPORTER_COMPANY_NAME } from '../../../config/environment';
import { COMPANY_PROFILE } from '../../../src/auth/credentials';
import { ADDITIONAL_PROCEDURE_CODES } from '../../../src/constant/additional-procedure-codes-constant';
import { REPRESENTATION_TYPE } from '../../../src/constant/representation-type-constant';
import { DECLARATION_STATUS } from '../../../src/constant/trader-api/declaration-status-constant';
import { declaredThroughTraderApi, traderDefermentSupplementaryDeclaration } from '../../../src/test-data/supplementary-declaration-data';
import { reportTestCaseLink } from '../../../src/helper/report-helper';
import { exciseGoodsRoRoAccompaniedSupplementaryDeclarationMovement } from '../../../src/test-data/supplementary-declaration-movement-data';

const REVERT_DRAFT_IMMI = '4809';
const REVERT_TIR_IMMI = '4810';
const REVERSAL_BLOCKED_ONCE_ARRIVED = '4903';
const REVERT_BY_AGENT = '4923';
const REVERTED_SD_COMPLETED = '4911';

test.describe('GB to NI RoRo IMMI declaration - reverted to the supplementary declaration it was converted from', () => {
    test.use({ authProfile: COMPANY_PROFILE.IMPORTER });

    test.describe.configure({ timeout: 1_200_000 });

    test.beforeEach(async () => {
        await ReportLog.setFeature('GB to NI Supplementary Declaration Process');
    });

    test(
        'Verify a draft IMMI declaration reverts to the draft supplementary declaration it was converted from',
        { tag: ['@regression', '@reversal'] },
        async ({
            generateSdDraftThroughApiFlow,
            completeAndSubmitSupplementaryDeclarationFlow,
            convertSupplementaryDeclarationFlow,
            revertImmiDeclarationFlow,
        }, testInfo) => {
            await ReportLog.setStory('IMMI declaration - converted from a draft supplementary declaration, then reverted (H8 to H1)');
            reportTestCaseLink(REVERT_DRAFT_IMMI);

            const source = await generateSdDraftThroughApiFlow.raiseSdDraft();
            const reference = await completeAndSubmitSupplementaryDeclarationFlow.openSupplementaryDeclaration({
                testInfo, url: BASE_URL, ...source,
            });

            await convertSupplementaryDeclarationFlow.convertToImmi();
            await revertImmiDeclarationFlow.revertToSupplementaryDeclaration({
                declaration: { reference, frontierLrn: source.frontierLrn }, originalStatusKey: 'status.draft',
            });
        }
    );

    test(
        'Verify an IMMI declaration in "Trader Input Required" reverts to the supplementary declaration in "Trader Input Required" it was converted from',
        { tag: ['@regression', '@reversal'] },
        async ({
            generateSdDraftThroughApiFlow,
            completeAndSubmitSupplementaryDeclarationFlow,
            convertSupplementaryDeclarationFlow,
            revertImmiDeclarationFlow,
        }, testInfo) => {
            await ReportLog.setStory('IMMI declaration - converted from a supplementary declaration in Trader Input Required, refused by CDS, then reverted (H8 to H1)');
            reportTestCaseLink(REVERT_TIR_IMMI);

            const source = await generateSdDraftThroughApiFlow.raiseSdDraft({
                declaration: exciseGoodsRoRoAccompaniedSupplementaryDeclarationMovement(),
            });
            const reference = await completeAndSubmitSupplementaryDeclarationFlow.submitSupplementaryDeclarationExpectingRejection({
                testInfo, url: BASE_URL, ...source,
            });

            const immiLrn = await convertSupplementaryDeclarationFlow.convertToImmi();
            await convertSupplementaryDeclarationFlow.completeConvertedImmi(
                immiLrn,
                { additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.SPIMM_CATEGORY_2_EXCISE_1EL },
                'status.traderInputRequired'
            );
            await revertImmiDeclarationFlow.revertToSupplementaryDeclaration({
                declaration: { reference, frontierLrn: source.frontierLrn }, originalStatusKey: 'status.traderInputRequired',
            });
        }
    );

    test(
        'Verify an IMMI declaration submitted and arrived cannot be reverted to a supplementary declaration',
        { tag: ['@regression', '@reversal'] },
        async ({
            generateSdDraftThroughApiFlow,
            completeAndSubmitSupplementaryDeclarationFlow,
            convertSupplementaryDeclarationFlow,
            revertImmiDeclarationFlow,
        }, testInfo) => {
            await ReportLog.setStory('IMMI declaration - converted from a supplementary declaration and submitted, so no longer reversible');
            reportTestCaseLink(REVERSAL_BLOCKED_ONCE_ARRIVED);

            const source = await generateSdDraftThroughApiFlow.raiseSdDraft();
            await completeAndSubmitSupplementaryDeclarationFlow.openSupplementaryDeclaration({
                testInfo, url: BASE_URL, ...source,
            });

            const immiLrn = await convertSupplementaryDeclarationFlow.convertToImmi();
            await convertSupplementaryDeclarationFlow.completeConvertedImmi(immiLrn, {
                additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.SPIMM_STANDARD_GOODS_1SG,
            });
            await revertImmiDeclarationFlow.verifyReversalNotOffered(immiLrn, 'submitted and arrived');
        }
    );

    test(
        'Verify a draft IMMI declaration reverted to its draft supplementary declaration can still be completed and submitted as an H1 declaration',
        { tag: ['@regression', '@reversal'] },
        async ({
            generateSdDraftThroughApiFlow,
            completeAndSubmitSupplementaryDeclarationFlow,
            reclassifyThroughApiFlow,
        }, testInfo) => {
            await ReportLog.setStory('Supplementary Declaration - converted to IMMI and reverted through the Trader API, then completed and submitted as H1');
            reportTestCaseLink(REVERTED_SD_COMPLETED);

            const source = await generateSdDraftThroughApiFlow.raiseSdDraft();
            const reference = await completeAndSubmitSupplementaryDeclarationFlow.openSupplementaryDeclaration({
                testInfo, url: BASE_URL, ...source,
            });

            const immiLrn = await reclassifyThroughApiFlow.convertToImmi(reference, DECLARATION_STATUS.DRAFT);
            await reclassifyThroughApiFlow.revertToSupplementaryDeclaration(immiLrn, reference, DECLARATION_STATUS.DRAFT);

            await completeAndSubmitSupplementaryDeclarationFlow.completeSupplementaryDeclaration({
                testInfo,
                url: BASE_URL,
                ...source,
                overrides: declaredThroughTraderApi(traderDefermentSupplementaryDeclaration()),
            });
        }
    );
});


test.describe('GB to NI RoRo IMMI declaration - reverted by an agent representing the importer', () => {
    test.use({ authProfile: COMPANY_PROFILE.AGENT });

    test.describe.configure({ timeout: 1_200_000 });

    test.beforeEach(async () => {
        await ReportLog.setFeature('GB to NI Supplementary Declaration Process');
    });

    test(
        'Verify an agent reverts a draft IMMI declaration to the supplementary declaration in "Trader Input Required" it was converted from',
        { tag: ['@regression', '@reversal'] },
        async ({
            generateSdDraftThroughApiFlow,
            completeAndSubmitSupplementaryDeclarationFlow,
            convertSupplementaryDeclarationFlow,
            revertImmiDeclarationFlow,
        }, testInfo) => {
            await ReportLog.setStory('IMMI declaration - converted by an agent from a supplementary declaration in Trader Input Required, then reverted while still a draft');
            reportTestCaseLink(REVERT_BY_AGENT);

            const source = await generateSdDraftThroughApiFlow.raiseSdDraft({
                representing: { companyName: IMPORTER_COMPANY_NAME, testInfo, url: BASE_URL },
            });
            const reference = await completeAndSubmitSupplementaryDeclarationFlow.submitSupplementaryDeclarationExpectingRejection({
                testInfo, url: BASE_URL, ...source,
            });

            await convertSupplementaryDeclarationFlow.convertToImmi();
            await revertImmiDeclarationFlow.revertToSupplementaryDeclaration({
                declaration: { reference, frontierLrn: source.frontierLrn }, originalStatusKey: 'status.traderInputRequired',
            });
        }
    );

    test(
        'Verify an agent reverts an IMMI declaration in "Trader Input Required" to the draft supplementary declaration it was converted from',
        { tag: ['@regression', '@reversal'] },
        async ({
            generateSdDraftThroughApiFlow,
            completeAndSubmitSupplementaryDeclarationFlow,
            convertSupplementaryDeclarationFlow,
            revertImmiDeclarationFlow,
        }, testInfo) => {
            await ReportLog.setStory('IMMI declaration - converted by an agent from a draft supplementary declaration, refused by CDS, then reverted');
            reportTestCaseLink(REVERT_BY_AGENT);

            const source = await generateSdDraftThroughApiFlow.raiseSdDraft({
                declaration: exciseGoodsRoRoAccompaniedSupplementaryDeclarationMovement(),
                representing: { companyName: IMPORTER_COMPANY_NAME, testInfo, url: BASE_URL },
            });
            const reference = await completeAndSubmitSupplementaryDeclarationFlow.openSupplementaryDeclaration({
                testInfo, url: BASE_URL, ...source,
            });

            const immiLrn = await convertSupplementaryDeclarationFlow.convertToImmi();
            await convertSupplementaryDeclarationFlow.completeConvertedImmi(
                immiLrn,
                {
                    additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.SPIMM_CATEGORY_2_EXCISE_1EL,
                    representationType: REPRESENTATION_TYPE.DIRECT,
                },
                'status.traderInputRequired'
            );
            await revertImmiDeclarationFlow.revertToSupplementaryDeclaration({
                declaration: { reference, frontierLrn: source.frontierLrn }, originalStatusKey: 'status.draft',
            });
        }
    );
});
