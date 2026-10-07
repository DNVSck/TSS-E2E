import { BASE_URL } from '../../../config/environment';
import { ReportLog } from '../../../src/core/report/report-log';
import { test } from '../../base-test';
import { COMPANY_PROFILE } from '../../../src/auth/credentials';
import {
    exciseGoodsSupplementaryDeclaration,
} from '../../../src/test-data/supplementary-declaration-data';
import {
    exciseGoodsRoRoAccompaniedSupplementaryDeclarationMovement,
} from '../../../src/test-data/supplementary-declaration-movement-data';
import { reportTestCaseLink } from '../../../src/helper/report-helper';

const SFD_SUPP_EXCISE = '5301';

test.describe('GB to NI RoRo Accompanied At Risk Excise Goods - Supplementary Declaration', () => {
    test.use({ authProfile: COMPANY_PROFILE.AGENT });
    test.describe.configure({ timeout: 1_200_000 });

    test.beforeEach(async () => {
        await ReportLog.setFeature('GB to NI Supplementary Declaration - At Risk - Excise Goods');
    });

    test(
        'Verify the supplementary declaration raised by RoRo Accompanied At Risk ENS-SFD with Excise Goods is completed and submitted successfully',
        { tag: ['@supplementary'] },
        async ({
            generateSdDraftFromEnsSfdFlow,
            completeAndSubmitSupplementaryDeclarationFlow,
        }, testInfo) => {
            await ReportLog.setStory('SD - GB to NI RoRo Accompanied At Risk - Excise Goods');
            reportTestCaseLink(SFD_SUPP_EXCISE);

            const { movementLrn, frontierLrn } = await ReportLog.step('Raise the supplementary declaration from an ENS-SFD movement', () =>
                generateSdDraftFromEnsSfdFlow.generateSdDraft({ testInfo, url: BASE_URL, overrides: exciseGoodsRoRoAccompaniedSupplementaryDeclarationMovement() })
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
