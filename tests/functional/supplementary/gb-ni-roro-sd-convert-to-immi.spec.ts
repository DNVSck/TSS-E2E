import { ReportLog } from '../../../src/core/report/report-log';
import { test } from '../../base-test';
import { BASE_URL, HAULIER_COMPANY_NAME, IMPORTER_COMPANY_NAME } from '../../../config/environment';
import { COMPANY_PROFILE } from '../../../src/auth/credentials';
import { ADDITIONAL_PROCEDURE_CODES } from '../../../src/constant/additional-procedure-codes-constant';
import { reportTestCaseLink } from '../../../src/helper/report-helper';
import {
    exciseGoodsRoRoAccompaniedSupplementaryDeclarationMovement,
    onwardSupplyReliefSupplementaryDeclarationMovement,
    importerWithoutUkimsSupplementaryDeclarationMovement,
} from '../../../src/test-data/supplementary-declaration-movement-data';
import { declaredThroughTraderApi, traderDefermentSupplementaryDeclaration } from '../../../src/test-data/supplementary-declaration-data';
import { CANCELLATION_REASON } from '../../../src/test-data/consignment-data';
import { REPRESENTATION_TYPE } from '../../../src/constant/representation-type-constant';
import { GOODS_CSV } from '../../../src/test-data/goods-csv-data';
import { TGP_RECORD } from '../../../src/test-data/tgp-record-data';
import { PROCEDURE_CODES } from '../../../src/constant/procedure-codes-constant';

const CONVERT_DRAFT_BY_IMPORTER = '4877';
const CONVERT_DRAFT_BY_AGENT = '4878';
const CONVERT_TIR_BY_IMPORTER = '4879';
const CONVERT_TIR_BY_AGENT = '4880';
const RESUBMIT_CONVERTED_BY_IMPORTER = '4884';
const RESUBMIT_CONVERTED_BY_AGENT = '4900';
const CONVERSION_BLOCKED_BY_STATUS = '4902';
const CONVERT_EXCISE_GOODS = '4910';
const CONVERSION_BLOCKED_WITHOUT_UKIMS = '4881';
const CONVERSION_BLOCKED_BY_GOODS = '4882';
const CONVERT_WITH_TGP = '4909';

const EXCISE_DUTY_SUSPENSION = ADDITIONAL_PROCEDURE_CODES.EXCISE_MOVEMENT_DUTY_SUSPENSION_F06;

test.describe('GB to NI RoRo Supplementary Declaration - converted to an IMMI declaration by the importer', () => {
    test.use({ authProfile: COMPANY_PROFILE.IMPORTER });

    test.describe.configure({ timeout: 1_200_000 });

    test.beforeEach(async () => {
        await ReportLog.setFeature('GB to NI Supplementary Declaration Process');
    });

    test(
        'Verify a supplementary declaration from an SFD in "Draft" is converted to an IMMI declaration, completed and submitted (4000-1SG)',
        { tag: ['@regression', '@conversion'] },
        async ({
            generateSdDraftThroughApiFlow,
            completeAndSubmitSupplementaryDeclarationFlow,
            convertSupplementaryDeclarationFlow,
            triggerFinalStatusThroughCdsFlow,
        }, testInfo) => {
            await ReportLog.setStory('Supplementary Declaration - from ENS-SFD - Draft converted to IMMI (H1 to H8) by the importer');
            reportTestCaseLink(CONVERT_DRAFT_BY_IMPORTER);

            const source = await generateSdDraftThroughApiFlow.raiseSdDraft();
            const reference = await completeAndSubmitSupplementaryDeclarationFlow.openSupplementaryDeclaration({
                testInfo, url: BASE_URL, ...source,
            });

            const immiLrn = await convertSupplementaryDeclarationFlow.convertToImmi();
            const immi = await convertSupplementaryDeclarationFlow.completeConvertedImmi(immiLrn, {
                additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.SPIMM_STANDARD_GOODS_1SG,
            });
            await triggerFinalStatusThroughCdsFlow.closeStandaloneImmi(immi);
            await convertSupplementaryDeclarationFlow.verifySourceAfterConversion({
                reference, frontierLrn: source.frontierLrn,
            });
        }
    );

    test(
        'Verify a converted IMMI declaration with its goods item declared from a Trader Goods Profile is completed and submitted (4000-1SG)',
        { tag: ['@regression', '@conversion'] },
        async ({
            generateSdDraftThroughApiFlow,
            completeAndSubmitSupplementaryDeclarationFlow,
            convertSupplementaryDeclarationFlow,
            triggerFinalStatusThroughCdsFlow,
        }, testInfo) => {
            await ReportLog.setStory('Supplementary Declaration - from ENS-SFD - converted to IMMI (H1 to H8) by the importer, goods item from a Trader Goods Profile');
            reportTestCaseLink(CONVERT_WITH_TGP);

            const source = await generateSdDraftThroughApiFlow.raiseSdDraft();
            const reference = await completeAndSubmitSupplementaryDeclarationFlow.openSupplementaryDeclaration({
                testInfo, url: BASE_URL, ...source,
            });

            const immiLrn = await convertSupplementaryDeclarationFlow.convertToImmi();
            const immi = await convertSupplementaryDeclarationFlow.completeConvertedImmi(immiLrn, {
                additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.SPIMM_STANDARD_GOODS_1SG,
                tgp: { record: TGP_RECORD.MACHINERY_TGP456, procedureCode: PROCEDURE_CODES.FREE_CIRCULATION_4000 },
            });
            await triggerFinalStatusThroughCdsFlow.closeStandaloneImmi(immi);
            await convertSupplementaryDeclarationFlow.verifySourceAfterConversion({
                reference, frontierLrn: source.frontierLrn,
            });
        }
    );

    test(
        'Verify a converted IMMI declaration using NIRMS is completed and submitted (4000-1SG)',
        { tag: ['@regression', '@conversion', '@nirms'] },
        async ({
            generateSdDraftThroughApiFlow,
            completeAndSubmitSupplementaryDeclarationFlow,
            convertSupplementaryDeclarationFlow,
            triggerFinalStatusThroughCdsFlow,
        }, testInfo) => {
            await ReportLog.setStory('Supplementary Declaration - from ENS-SFD - converted to IMMI (H1 to H8) by the importer, goods moved under NIRMS');

            const source = await generateSdDraftThroughApiFlow.raiseSdDraft();
            const reference = await completeAndSubmitSupplementaryDeclarationFlow.openSupplementaryDeclaration({
                testInfo, url: BASE_URL, ...source,
            });

            const immiLrn = await convertSupplementaryDeclarationFlow.convertToImmi();
            const immi = await convertSupplementaryDeclarationFlow.completeConvertedImmi(immiLrn, {
                additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.SPIMM_STANDARD_GOODS_1SG,
                useNirms: true,
            });
            await triggerFinalStatusThroughCdsFlow.closeStandaloneImmi(immi);
            await convertSupplementaryDeclarationFlow.verifySourceAfterConversion({
                reference, frontierLrn: source.frontierLrn,
            });
        }
    );

    test(
        'Verify a supplementary declaration from an SFD in "Trader Input Required" is converted to an IMMI declaration, completed and submitted (4000-1EN)',
        { tag: ['@regression', '@conversion'] },
        async ({
            generateSdDraftThroughApiFlow,
            completeAndSubmitSupplementaryDeclarationFlow,
            convertSupplementaryDeclarationFlow,
            triggerFinalStatusThroughCdsFlow,
        }, testInfo) => {
            await ReportLog.setStory('Supplementary Declaration - from ENS-SFD - Trader Input Required converted to IMMI (H1 to H8) by the importer');
            reportTestCaseLink(CONVERT_TIR_BY_IMPORTER);

            const source = await generateSdDraftThroughApiFlow.raiseSdDraft();
            const reference = await completeAndSubmitSupplementaryDeclarationFlow.submitSupplementaryDeclarationExpectingRejection({
                testInfo, url: BASE_URL, ...source,
            });

            const immiLrn = await convertSupplementaryDeclarationFlow.convertToImmi();
            const immi = await convertSupplementaryDeclarationFlow.completeConvertedImmi(immiLrn, {
                additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.SPIMM_CATEGORY_2_EXCISE_1EN,
            });
            await triggerFinalStatusThroughCdsFlow.closeStandaloneImmi(immi);
            await convertSupplementaryDeclarationFlow.verifySourceAfterConversion({
                reference, frontierLrn: source.frontierLrn,
            });
        }
    );

    for (const additionalProcedureCode of [
        ADDITIONAL_PROCEDURE_CODES.SPIMM_CATEGORY_2_EXCISE_1EL,
        ADDITIONAL_PROCEDURE_CODES.SPIMM_CATEGORY_2_EXCISE_1EN,
    ]) {
        test(
            `Verify a supplementary declaration from an SFD with excise goods is converted to an IMMI declaration, completed and submitted (0700-${additionalProcedureCode})`,
            { tag: ['@regression', '@conversion'] },
            async ({
                generateSdDraftThroughApiFlow,
                completeAndSubmitSupplementaryDeclarationFlow,
                convertSupplementaryDeclarationFlow,
                triggerFinalStatusThroughCdsFlow,
            }, testInfo) => {
                await ReportLog.setStory(`Supplementary Declaration - from ENS-SFD - excise goods converted to IMMI (H1 to H8) - 0700-${additionalProcedureCode}`);
                reportTestCaseLink(CONVERT_EXCISE_GOODS);

                const source = await generateSdDraftThroughApiFlow.raiseSdDraft({
                    declaration: exciseGoodsRoRoAccompaniedSupplementaryDeclarationMovement(),
                });
                const reference = await completeAndSubmitSupplementaryDeclarationFlow.openSupplementaryDeclaration({
                    testInfo, url: BASE_URL, ...source,
                });

                const immiLrn = await convertSupplementaryDeclarationFlow.convertToImmi();
                const immi = await convertSupplementaryDeclarationFlow.completeConvertedImmi(immiLrn, {
                    additionalProcedureCode,
                    additionalProcedureCodes: [EXCISE_DUTY_SUSPENSION],
                });
                await triggerFinalStatusThroughCdsFlow.closeStandaloneImmi(immi);
                await convertSupplementaryDeclarationFlow.verifySourceAfterConversion({
                    reference, frontierLrn: source.frontierLrn,
                });
            }
        );
    }

    test(
        'Verify a converted IMMI declaration with extra goods uploaded by CSV is completed and submitted (0700-1EL)',
        { tag: ['@regression', '@conversion', '@csvUpload'] },
        async ({
            generateSdDraftThroughApiFlow,
            completeAndSubmitSupplementaryDeclarationFlow,
            convertSupplementaryDeclarationFlow,
            uploadGoodsCsvFlow,
            triggerFinalStatusThroughCdsFlow,
        }, testInfo) => {
            await ReportLog.setStory('Converted IMMI - further goods records uploaded by CSV, then completed and submitted');

            const source = await generateSdDraftThroughApiFlow.raiseSdDraft({
                declaration: exciseGoodsRoRoAccompaniedSupplementaryDeclarationMovement(),
            });
            const reference = await completeAndSubmitSupplementaryDeclarationFlow.openSupplementaryDeclaration({
                testInfo, url: BASE_URL, ...source,
            });

            const immiLrn = await convertSupplementaryDeclarationFlow.convertToImmi();
            await uploadGoodsCsvFlow.uploadGoodsCsv(GOODS_CSV.IMMI_STANDALONE);
            const immi = await convertSupplementaryDeclarationFlow.completeConvertedImmi(immiLrn, {
                additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.SPIMM_CATEGORY_2_EXCISE_1EL,
                additionalProcedureCodes: [EXCISE_DUTY_SUSPENSION],
            });
            await triggerFinalStatusThroughCdsFlow.closeStandaloneImmi(immi);
            await convertSupplementaryDeclarationFlow.verifySourceAfterConversion({
                reference, frontierLrn: source.frontierLrn,
            });
        }
    );

    test(
        'Verify a converted IMMI declaration refused by CDS is corrected and resubmitted by the importer (0700-1EL)',
        { tag: ['@regression', '@conversion', '@resubmission'] },
        async ({
            generateSdDraftThroughApiFlow,
            completeAndSubmitSupplementaryDeclarationFlow,
            convertSupplementaryDeclarationFlow,
            resubmitDeclarationFlow,
        }, testInfo) => {
            await ReportLog.setStory('Supplementary Declaration - converted to IMMI, refused by CDS without F06, corrected and resubmitted by the importer');
            reportTestCaseLink(RESUBMIT_CONVERTED_BY_IMPORTER);

            const source = await generateSdDraftThroughApiFlow.raiseSdDraft({
                declaration: exciseGoodsRoRoAccompaniedSupplementaryDeclarationMovement(),
            });
            await completeAndSubmitSupplementaryDeclarationFlow.openSupplementaryDeclaration({
                testInfo, url: BASE_URL, ...source,
            });

            const immiLrn = await convertSupplementaryDeclarationFlow.convertToImmi();
            await convertSupplementaryDeclarationFlow.completeConvertedImmi(
                immiLrn,
                { additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.SPIMM_CATEGORY_2_EXCISE_1EL },
                'status.traderInputRequired'
            );
            await resubmitDeclarationFlow.declareAdditionalProcedureCodesAndResubmitArrivedImmi([EXCISE_DUTY_SUSPENSION]);
        }
    );

    test(
        'Verify a supplementary declaration with goods not eligible for IMMI cannot be converted (4200-000)',
        { tag: ['@regression', '@conversion'] },
        async ({
            generateSdDraftThroughApiFlow,
            completeAndSubmitSupplementaryDeclarationFlow,
            convertSupplementaryDeclarationFlow,
        }, testInfo) => {
            await ReportLog.setStory('Supplementary Declaration - no conversion to IMMI for goods released for free circulation with onward supply relief (4200)');
            reportTestCaseLink(CONVERSION_BLOCKED_BY_GOODS);

            const source = await generateSdDraftThroughApiFlow.raiseSdDraft({
                declaration: onwardSupplyReliefSupplementaryDeclarationMovement(),
            });
            const reference = await completeAndSubmitSupplementaryDeclarationFlow.openSupplementaryDeclaration({
                testInfo, url: BASE_URL, ...source,
            });

            await convertSupplementaryDeclarationFlow.verifyConversionNotOffered(reference, 'its goods are not eligible for IMMI');
        }
    );
});


test.describe('GB to NI RoRo Supplementary Declaration - conversion blocked for an importer without UKIMS', () => {
    test.use({ authProfile: COMPANY_PROFILE.HAULIER });

    test.describe.configure({ timeout: 1_200_000 });

    test.beforeEach(async () => {
        await ReportLog.setFeature('GB to NI Supplementary Declaration Process');
    });

    test(
        'Verify an importer without UKIMS cannot convert its own supplementary declaration to an IMMI declaration',
        { tag: ['@regression', '@conversion'] },
        async ({
            generateSdDraftThroughApiFlow,
            completeAndSubmitSupplementaryDeclarationFlow,
            convertSupplementaryDeclarationFlow,
        }, testInfo) => {
            await ReportLog.setStory('Supplementary Declaration - no conversion to IMMI for an importer that holds no UKIMS, opened by the importer');
            reportTestCaseLink(CONVERSION_BLOCKED_WITHOUT_UKIMS);

            const source = await generateSdDraftThroughApiFlow.raiseSdDraft({
                declaration: importerWithoutUkimsSupplementaryDeclarationMovement(),
            });
            const reference = await completeAndSubmitSupplementaryDeclarationFlow.openSupplementaryDeclaration({
                testInfo, url: BASE_URL, ...source,
            });

            await convertSupplementaryDeclarationFlow.verifyConversionNotOffered(reference, 'its importer holds no UKIMS');
        }
    );
});


test.describe('GB to NI RoRo Supplementary Declaration - converted to an IMMI declaration by an agent representing the importer', () => {
    test.use({ authProfile: COMPANY_PROFILE.AGENT });

    test.describe.configure({ timeout: 1_200_000 });

    test.beforeEach(async () => {
        await ReportLog.setFeature('GB to NI Supplementary Declaration Process');
    });

    test(
        'Verify an agent converts a supplementary declaration from an SFD in "Draft" to an IMMI declaration, completes and submits it (4000-1EL)',
        { tag: ['@regression', '@conversion'] },
        async ({
            generateSdDraftThroughApiFlow,
            completeAndSubmitSupplementaryDeclarationFlow,
            convertSupplementaryDeclarationFlow,
            triggerFinalStatusThroughCdsFlow,
        }, testInfo) => {
            await ReportLog.setStory('Supplementary Declaration - from ENS-SFD - Draft converted to IMMI (H1 to H8) by an agent representing the importer');
            reportTestCaseLink(CONVERT_DRAFT_BY_AGENT);

            const source = await generateSdDraftThroughApiFlow.raiseSdDraft({
                representing: { companyName: IMPORTER_COMPANY_NAME, testInfo, url: BASE_URL },
            });
            const reference = await completeAndSubmitSupplementaryDeclarationFlow.openSupplementaryDeclaration({
                testInfo, url: BASE_URL, ...source,
            });

            const immiLrn = await convertSupplementaryDeclarationFlow.convertToImmi();
            const immi = await convertSupplementaryDeclarationFlow.completeConvertedImmi(immiLrn, {
                additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.SPIMM_CATEGORY_2_EXCISE_1EL,
                representationType: REPRESENTATION_TYPE.DIRECT,
            });
            await triggerFinalStatusThroughCdsFlow.closeStandaloneImmi(immi);
            await convertSupplementaryDeclarationFlow.verifySourceAfterConversion({
                reference, frontierLrn: source.frontierLrn,
            });
        }
    );

    test(
        'Verify an agent converts a supplementary declaration from an SFD in "Draft" to an IMMI declaration under indirect representation, completes and submits it (4000-1SG)',
        { tag: ['@regression', '@conversion'] },
        async ({
            generateSdDraftThroughApiFlow,
            completeAndSubmitSupplementaryDeclarationFlow,
            convertSupplementaryDeclarationFlow,
            triggerFinalStatusThroughCdsFlow,
        }, testInfo) => {
            await ReportLog.setStory('Supplementary Declaration - from ENS-SFD - Draft converted to IMMI (H1 to H8) by an agent under indirect representation');

            const source = await generateSdDraftThroughApiFlow.raiseSdDraft({
                representing: { companyName: IMPORTER_COMPANY_NAME, testInfo, url: BASE_URL },
            });
            const reference = await completeAndSubmitSupplementaryDeclarationFlow.openSupplementaryDeclaration({
                testInfo, url: BASE_URL, ...source,
            });

            const immiLrn = await convertSupplementaryDeclarationFlow.convertToImmi();
            const immi = await convertSupplementaryDeclarationFlow.completeConvertedImmi(immiLrn, {
                additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.SPIMM_STANDARD_GOODS_1SG,
                representationType: REPRESENTATION_TYPE.INDIRECT,
            });
            await triggerFinalStatusThroughCdsFlow.closeStandaloneImmi(immi);
            await convertSupplementaryDeclarationFlow.verifySourceAfterConversion({
                reference, frontierLrn: source.frontierLrn,
            });
        }
    );

    test(
        'Verify an agent converts a supplementary declaration from an SFD in "Trader Input Required" to an IMMI declaration, completes and submits it (4000-1LG)',
        { tag: ['@regression', '@conversion'] },
        async ({
            generateSdDraftThroughApiFlow,
            completeAndSubmitSupplementaryDeclarationFlow,
            convertSupplementaryDeclarationFlow,
            triggerFinalStatusThroughCdsFlow,
        }, testInfo) => {
            await ReportLog.setStory('Supplementary Declaration - from ENS-SFD - Trader Input Required converted to IMMI (H1 to H8) by an agent representing the importer');
            reportTestCaseLink(CONVERT_TIR_BY_AGENT);

            const source = await generateSdDraftThroughApiFlow.raiseSdDraft({
                representing: { companyName: IMPORTER_COMPANY_NAME, testInfo, url: BASE_URL },
            });
            const reference = await completeAndSubmitSupplementaryDeclarationFlow.submitSupplementaryDeclarationExpectingRejection({
                testInfo, url: BASE_URL, ...source,
            });

            const immiLrn = await convertSupplementaryDeclarationFlow.convertToImmi();
            const immi = await convertSupplementaryDeclarationFlow.completeConvertedImmi(immiLrn, {
                additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.SPIMM_CATEGORY_2_NON_EXCISE_1LG,
                representationType: REPRESENTATION_TYPE.DIRECT,
            });
            await triggerFinalStatusThroughCdsFlow.closeStandaloneImmi(immi);
            await convertSupplementaryDeclarationFlow.verifySourceAfterConversion({
                reference, frontierLrn: source.frontierLrn,
            });
        }
    );

    test(
        'Verify an agent representing an importer without UKIMS cannot convert its supplementary declaration to an IMMI declaration',
        { tag: ['@regression', '@conversion'] },
        async ({
            generateSdDraftThroughApiFlow,
            completeAndSubmitSupplementaryDeclarationFlow,
            convertSupplementaryDeclarationFlow,
        }, testInfo) => {
            await ReportLog.setStory('Supplementary Declaration - no conversion to IMMI for an importer that holds no UKIMS, opened by an agent representing it');
            reportTestCaseLink(CONVERSION_BLOCKED_WITHOUT_UKIMS);

            const source = await generateSdDraftThroughApiFlow.raiseSdDraft({
                declaration: importerWithoutUkimsSupplementaryDeclarationMovement(),
                representing: { companyName: HAULIER_COMPANY_NAME, testInfo, url: BASE_URL },
            });
            const reference = await completeAndSubmitSupplementaryDeclarationFlow.openSupplementaryDeclaration({
                testInfo, url: BASE_URL, ...source,
            });

            await convertSupplementaryDeclarationFlow.verifyConversionNotOffered(reference, 'its importer holds no UKIMS');
        }
    );

    test(
        'Verify a converted IMMI declaration refused by CDS is corrected and resubmitted by an agent (0700-1EN)',
        { tag: ['@regression', '@conversion', '@resubmission'] },
        async ({
            generateSdDraftThroughApiFlow,
            completeAndSubmitSupplementaryDeclarationFlow,
            convertSupplementaryDeclarationFlow,
            resubmitDeclarationFlow,
        }, testInfo) => {
            await ReportLog.setStory('Supplementary Declaration - converted to IMMI, refused by CDS without F06, corrected and resubmitted by an agent');
            reportTestCaseLink(RESUBMIT_CONVERTED_BY_AGENT);

            const source = await generateSdDraftThroughApiFlow.raiseSdDraft({
                declaration: exciseGoodsRoRoAccompaniedSupplementaryDeclarationMovement(),
                representing: { companyName: IMPORTER_COMPANY_NAME, testInfo, url: BASE_URL },
            });
            await completeAndSubmitSupplementaryDeclarationFlow.openSupplementaryDeclaration({
                testInfo, url: BASE_URL, ...source,
            });

            const immiLrn = await convertSupplementaryDeclarationFlow.convertToImmi();
            await convertSupplementaryDeclarationFlow.completeConvertedImmi(
                immiLrn,
                {
                    additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.SPIMM_CATEGORY_2_EXCISE_1EN,
                    representationType: REPRESENTATION_TYPE.DIRECT,
                },
                'status.traderInputRequired'
            );
            await resubmitDeclarationFlow.declareAdditionalProcedureCodesAndResubmitArrivedImmi([EXCISE_DUTY_SUSPENSION]);
        }
    );
});


test.describe('GB to NI RoRo Supplementary Declaration - conversion blocked by the declaration status', () => {
    test.use({ authProfile: COMPANY_PROFILE.IMPORTER });

    test.describe.configure({ timeout: 1_200_000 });

    test.beforeEach(async () => {
        await ReportLog.setFeature('GB to NI Supplementary Declaration Process');
    });

    test(
        'Verify a supplementary declaration in "Pending Cancellation" cannot be converted to an IMMI declaration',
        { tag: ['@regression', '@conversion'] },
        async ({
            generateSdDraftThroughApiFlow,
            completeAndSubmitSupplementaryDeclarationFlow,
            cancelSupplementaryDeclarationFlow,
            convertSupplementaryDeclarationFlow,
        }, testInfo) => {
            await ReportLog.setStory('Supplementary Declaration - no conversion to IMMI once a cancellation is requested');
            reportTestCaseLink(CONVERSION_BLOCKED_BY_STATUS);

            const source = await generateSdDraftThroughApiFlow.raiseSdDraft();
            const reference = await completeAndSubmitSupplementaryDeclarationFlow.openSupplementaryDeclaration({
                testInfo, url: BASE_URL, ...source,
            });

            await cancelSupplementaryDeclarationFlow
                .cancelSupplementaryDeclarationAndVerifyItIsPendingCancellation(CANCELLATION_REASON, source.frontierLrn);
            await convertSupplementaryDeclarationFlow.verifyConversionNotOffered(reference, 'pending cancellation');
        }
    );

    test(
        'Verify a cancelled supplementary declaration cannot be converted to an IMMI declaration',
        { tag: ['@regression', '@conversion'] },
        async ({
            generateSdDraftThroughApiFlow,
            completeAndSubmitSupplementaryDeclarationFlow,
            cancelSupplementaryDeclarationFlow,
            triggerFinalStatusThroughCdsFlow,
            convertSupplementaryDeclarationFlow,
        }, testInfo) => {
            await ReportLog.setStory('Supplementary Declaration - no conversion to IMMI once cancelled');
            reportTestCaseLink(CONVERSION_BLOCKED_BY_STATUS);

            const source = await generateSdDraftThroughApiFlow.raiseSdDraft();
            const reference = await completeAndSubmitSupplementaryDeclarationFlow.openSupplementaryDeclaration({
                testInfo, url: BASE_URL, ...source,
            });

            await cancelSupplementaryDeclarationFlow
                .cancelSupplementaryDeclarationAndVerifyItIsPendingCancellation(CANCELLATION_REASON, source.frontierLrn);
            await triggerFinalStatusThroughCdsFlow
                .acceptSupplementaryDeclarationCancellationThroughCds({ reference, frontierLrn: source.frontierLrn });
            await convertSupplementaryDeclarationFlow.verifyConversionNotOffered(reference, 'cancelled');
        }
    );

    test(
        'Verify a submitted supplementary declaration cannot be converted to an IMMI declaration',
        { tag: ['@regression', '@conversion'] },
        async ({
            generateSdDraftThroughApiFlow,
            completeAndSubmitSupplementaryDeclarationFlow,
            convertSupplementaryDeclarationFlow,
        }, testInfo) => {
            await ReportLog.setStory('Supplementary Declaration - no conversion to IMMI once submitted');
            reportTestCaseLink(CONVERSION_BLOCKED_BY_STATUS);

            const source = await generateSdDraftThroughApiFlow.raiseSdDraft();
            const reference = await completeAndSubmitSupplementaryDeclarationFlow.completeSupplementaryDeclaration({
                testInfo,
                url: BASE_URL,
                ...source,
                overrides: declaredThroughTraderApi(traderDefermentSupplementaryDeclaration()),
            });
            await convertSupplementaryDeclarationFlow.verifyConversionNotOffered(reference, 'submitted');
        }
    );
});


test.describe('GB to NI RoRo IMMI declaration converted from a supplementary declaration - cancellation by the importer', () => {
    test.use({ authProfile: COMPANY_PROFILE.IMPORTER });

    test.describe.configure({ timeout: 1_200_000 });

    test.beforeEach(async () => {
        await ReportLog.setFeature('GB to NI Supplementary Declaration Process');
    });

    test(
        'Verify a draft IMMI declaration converted from a supplementary declaration can be cancelled',
        { tag: ['@regression', '@conversion', '@cancellation'] },
        async ({
            generateSdDraftThroughApiFlow,
            completeAndSubmitSupplementaryDeclarationFlow,
            convertSupplementaryDeclarationFlow,
            cancelConsignmentFlow,
        }, testInfo) => {
            await ReportLog.setStory('Converted IMMI - cancelled while still a draft, the supplementary declaration and its SFD untouched');

            const source = await generateSdDraftThroughApiFlow.raiseSdDraft();
            const reference = await completeAndSubmitSupplementaryDeclarationFlow.openSupplementaryDeclaration({
                testInfo, url: BASE_URL, ...source,
            });

            await convertSupplementaryDeclarationFlow.convertToImmi();
            await cancelConsignmentFlow.cancelConsignmentAndVerifyItIsCancelled(CANCELLATION_REASON);
            await convertSupplementaryDeclarationFlow.verifySourceAfterConversion({
                reference, frontierLrn: source.frontierLrn,
            });
        }
    );

    test(
        'Verify a converted IMMI declaration cannot be cancelled without a reason',
        { tag: ['@regression', '@conversion', '@cancellation'] },
        async ({
            generateSdDraftThroughApiFlow,
            completeAndSubmitSupplementaryDeclarationFlow,
            convertSupplementaryDeclarationFlow,
            cancelConsignmentFlow,
        }, testInfo) => {
            await ReportLog.setStory('Converted IMMI - the service refuses a cancellation with no reason');

            const source = await generateSdDraftThroughApiFlow.raiseSdDraft();
            await completeAndSubmitSupplementaryDeclarationFlow.openSupplementaryDeclaration({
                testInfo, url: BASE_URL, ...source,
            });

            await convertSupplementaryDeclarationFlow.convertToImmi();
            await cancelConsignmentFlow.verifyCancellationNeedsAReason();
        }
    );

    test(
        'Verify a converted IMMI declaration in "Trader Input Required" can be cancelled instead of corrected',
        { tag: ['@regression', '@conversion', '@cancellation'] },
        async ({
            generateSdDraftThroughApiFlow,
            completeAndSubmitSupplementaryDeclarationFlow,
            convertSupplementaryDeclarationFlow,
            cancelConsignmentFlow,
        }, testInfo) => {
            await ReportLog.setStory('Converted IMMI - refused by CDS without F06, cancelled rather than corrected, the supplementary declaration and its SFD untouched');

            const source = await generateSdDraftThroughApiFlow.raiseSdDraft({
                declaration: exciseGoodsRoRoAccompaniedSupplementaryDeclarationMovement(),
            });
            const reference = await completeAndSubmitSupplementaryDeclarationFlow.openSupplementaryDeclaration({
                testInfo, url: BASE_URL, ...source,
            });

            const immiLrn = await convertSupplementaryDeclarationFlow.convertToImmi();
            await convertSupplementaryDeclarationFlow.completeConvertedImmi(
                immiLrn,
                { additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.SPIMM_CATEGORY_2_EXCISE_1EL },
                'status.traderInputRequired'
            );
            await cancelConsignmentFlow.cancelConsignmentAndVerifyItIsCancelled(CANCELLATION_REASON);
            await convertSupplementaryDeclarationFlow.verifySourceAfterConversion({
                reference, frontierLrn: source.frontierLrn,
            });
        }
    );
});


test.describe('GB to NI RoRo IMMI declaration converted from a supplementary declaration - cancellation by an agent representing the importer', () => {
    test.use({ authProfile: COMPANY_PROFILE.AGENT });

    test.describe.configure({ timeout: 1_200_000 });

    test.beforeEach(async () => {
        await ReportLog.setFeature('GB to NI Supplementary Declaration Process');
    });

    test(
        'Verify an agent cancels a draft IMMI declaration converted from a supplementary declaration',
        { tag: ['@regression', '@conversion', '@cancellation'] },
        async ({
            generateSdDraftThroughApiFlow,
            completeAndSubmitSupplementaryDeclarationFlow,
            convertSupplementaryDeclarationFlow,
            cancelConsignmentFlow,
        }, testInfo) => {
            await ReportLog.setStory('Converted IMMI - cancelled by an agent while still a draft, the supplementary declaration and its SFD untouched');

            const source = await generateSdDraftThroughApiFlow.raiseSdDraft({
                representing: { companyName: IMPORTER_COMPANY_NAME, testInfo, url: BASE_URL },
            });
            const reference = await completeAndSubmitSupplementaryDeclarationFlow.openSupplementaryDeclaration({
                testInfo, url: BASE_URL, ...source,
            });

            await convertSupplementaryDeclarationFlow.convertToImmi();
            await cancelConsignmentFlow.cancelConsignmentAndVerifyItIsCancelled(CANCELLATION_REASON);
            await convertSupplementaryDeclarationFlow.verifySourceAfterConversion({
                reference, frontierLrn: source.frontierLrn,
            });
        }
    );

    test(
        'Verify an agent cancels a converted IMMI declaration in "Trader Input Required" instead of correcting it',
        { tag: ['@regression', '@conversion', '@cancellation'] },
        async ({
            generateSdDraftThroughApiFlow,
            completeAndSubmitSupplementaryDeclarationFlow,
            convertSupplementaryDeclarationFlow,
            cancelConsignmentFlow,
        }, testInfo) => {
            await ReportLog.setStory('Converted IMMI - refused by CDS without F06, cancelled by an agent rather than corrected');

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
            await cancelConsignmentFlow.cancelConsignmentAndVerifyItIsCancelled(CANCELLATION_REASON);
            await convertSupplementaryDeclarationFlow.verifySourceAfterConversion({
                reference, frontierLrn: source.frontierLrn,
            });
        }
    );
});
