import { expect, getBaseUrl, test } from '../../test-hooks';
import { reportTestCaseLink } from '../../../src/helper/report-helper';
import { ReportLog } from '../../../src/core/report/report-log';
import { getPrimaryHolderOrSkip } from '../../../src/helper/accounts-helper';

const CONCURRENT_LOGIN_TEST_ID = '2550';

test.describe.configure({ mode: 'serial' });

test.describe('TSS Portal concurrent login', () => {

    test.beforeEach(async () => {
        await ReportLog.setFeature('Concurrent Login');
    });

    test('Verify concurrent login is allowed from two devices',
        { tag: ['@auth', '@concurrent', '@regression'] },
        async ({ concurrentLoginFlow }, testInfo) => {
            reportTestCaseLink(CONCURRENT_LOGIN_TEST_ID);
            await ReportLog.setStory('Concurrent Login from Two Devices');

            const account = getPrimaryHolderOrSkip();

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
