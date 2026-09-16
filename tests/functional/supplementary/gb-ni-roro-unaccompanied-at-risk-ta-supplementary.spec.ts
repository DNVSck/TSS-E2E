import { ReportLog } from '../../../src/core/report/report-log';
import { getBaseUrl, test } from '../../test-hooks';
import { COMPANY_PROFILE } from '../../../src/auth/credentials';
import {
        tssDefermentSupplementaryDeclaration,
} from '../../../src/test-data/supplementary-declaration-data';
import {
    tempAdmissionSupplementaryDeclarationMovement,
} from '../../../src/test-data/supplementary-declaration-movement-data';
import { reportTestCaseLink } from '../../../src/helper/report-helper';

const SFD_SUPP_TEA = '4770';

test.describe('GB to NI RoRo Unaccompanied At Risk Temporary Admission - Supplementary Declaration', () => {
    test.use({ authProfile: COMPANY_PROFILE.AGENT });
    test.describe.configure({ timeout: 1_200_000 });

    test.beforeEach(async () => {
        await ReportLog.setFeature('GB to NI Supplementary Declaration - At Risk - Temporary Admission');
    });

    test(
        'Verify the supplementary declaration raised by RoRo Unaccompanied At Risk ENS-SFD with Entry to Temporary Admission is completed and submitted successfully (5300-D12)',
        { tag: ['@supplementary'] },
        //Not yet supported by TSS
        async ({
            generateSdDraftFromEnsSfdFlow,
            completeAndSubmitSupplementaryDeclarationFlow,
        }, testInfo) => {
            await ReportLog.setStory('SD - GB to NI RoRo Unaccompanied At Risk - Temporary Admission');
            reportTestCaseLink(SFD_SUPP_TEA);
            const { movementLrn, frontierLrn } = await ReportLog.step('Raise the supplementary declaration from an ENS-SFD movement', () =>
                generateSdDraftFromEnsSfdFlow.generateSdDraft({ testInfo, url: getBaseUrl(), overrides: tempAdmissionSupplementaryDeclarationMovement() })
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
