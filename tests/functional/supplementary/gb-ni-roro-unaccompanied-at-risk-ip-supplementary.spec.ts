import { BASE_URL } from '../../../config/environment';
import { ReportLog } from '../../../src/core/report/report-log';
import { test } from '../../base-test';
import { COMPANY_PROFILE } from '../../../src/auth/credentials';
import {
    inwardProcessingSfdSupplementaryDeclaration,
} from '../../../src/test-data/supplementary-declaration-data';
import {
    inwardProcessingSfdSupplementaryDeclarationMovement,
} from '../../../src/test-data/supplementary-declaration-movement-data';
import { reportTestCaseLink } from '../../../src/helper/report-helper';

const SFD_SUPP_IP = '4769';

test.describe('GB to NI RoRo Unaccompanied At Risk Inward Processing - Supplementary Declaration', () => {
    test.use({ authProfile: COMPANY_PROFILE.AGENT });

    // Affected by defect id 829
    test.describe.configure({ timeout: 900_000 });

    test.beforeEach(async () => {
        await ReportLog.setFeature('GB to NI Supplementary Declaration - At Risk - Inward Processing');
    });

    test(
        'Verify the supplementary declaration raised by RoRo Unaccompanied At Risk ENS-SFD with Entry to Inward Processing is completed and submitted successfully (5100)',
        { tag: ['@supplementary'] },
        async ({
            generateSdDraftFromEnsSfdFlow,
            completeAndSubmitSupplementaryDeclarationFlow,
        }, testInfo) => {
            await ReportLog.setStory('SD - GB to NI RoRo Unaccompanied At Risk - Inward Processing');
            reportTestCaseLink(SFD_SUPP_IP);

            const { movementLrn, frontierLrn } = await ReportLog.step('Raise the supplementary declaration from an ENS-SFD movement', () =>
                generateSdDraftFromEnsSfdFlow.generateSdDraft({ testInfo, url: BASE_URL, overrides: inwardProcessingSfdSupplementaryDeclarationMovement() })
            );

            await completeAndSubmitSupplementaryDeclarationFlow
                .completeSupplementaryDeclaration({
                    testInfo,
                    url: BASE_URL,
                    movementLrn,
                    frontierLrn,
                    overrides: inwardProcessingSfdSupplementaryDeclaration(),
                });
        }
    );
});
