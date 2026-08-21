import { expect, getBaseUrl, test } from '../../test-hooks';
import { reportTestCaseLink } from '../../../src/helper/report-helper';
import { ReportLog } from '../../../src/core/report/report-log';
import { COMPANY_PROFILE, getCredentials, isProfileConfigured } from '../../../src/auth/credentials';

const CONCURRENT_LOGIN_TEST_ID = '2550';

test.describe.configure({ mode: 'serial' });

test.describe('TSS Portal concurrent login', () => {

    // Decided once, when the file is read. Deciding it inside the test body instead
    // builds the second browser context first and then throws it away.
    test.skip(
        !isProfileConfigured(COMPANY_PROFILE.PRIMARY_HOLDER),
        'PRIMARY_HOLDER_USER_NAME is not configured for this environment'
    );

    test.beforeEach(async () => {
        await ReportLog.setFeature('Concurrent Login');
    });

    test('Verify concurrent login is allowed from two devices',
        { tag: ['@auth', '@concurrent', '@regression'] },
        async ({ concurrentLoginFlow }, testInfo) => {
            reportTestCaseLink(CONCURRENT_LOGIN_TEST_ID);
            await ReportLog.setStory('Concurrent Login from Two Devices');

            const account = getCredentials(COMPANY_PROFILE.PRIMARY_HOLDER);

            const result = await concurrentLoginFlow.signInOnBothDevices({
                credentials: account,
                baseUrl: getBaseUrl(),
                testInfo,
            });

            expect(result.deviceASignedIn, 'Device A should be authenticated after sign-in')
                .toBe(true);

            expect(result.deviceBSignedIn, 'Device B should also be authenticated - concurrent logins are allowed')
                .toBe(true);
        });
});
