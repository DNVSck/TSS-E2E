import { test, expect, getBaseUrl } from '../../test-hooks';
import { UserCredentials } from '../../../src/auth/credentials';
import { OTP_ENABLED } from '../../../config/environment';
import { reportTestCaseLink } from '../../../src/helper/report-helper';
import { ReportLog } from '../../../src/core/report/report-log';
import { getPrimaryHolderOrSkip } from '../../../src/helper/accounts-helper';
import { AuthPageUrls } from '../../../src/flows/sign-in-flow';

const TEST_CASE_ID = '2549';

test.describe.configure({ mode: 'serial' });

test.describe('TSS Portal sign-in - browser security (Test Case 2549)', () => {

    let account: UserCredentials;

    test.beforeEach(({ browserName: _browserName }, testInfo) => {
        test.skip(!OTP_ENABLED, 'This environment does not ask for an authenticator code.');

        test.skip(
            testInfo.project.name.includes('cy'),
            'Skipping Welsh locale due to language switcher timing issues'
        );

        account = getPrimaryHolderOrSkip();
    });

    test.afterEach(async ({ signInFlow }, testInfo) => {
        if (!account) {
            return;
        }
        await signInFlow.restoreSignedInState(account, { baseUrl: getBaseUrl(), testInfo });
    });

    test('Verify browser security: back button and history protection after MFA',
        { tag: ['@auth', '@security', '@regression'] },
        async ({ signInFlow, basePage, signInPage, portalPage }, testInfo) => {
            reportTestCaseLink(TEST_CASE_ID);

            // Captured in Step 1, consumed in Step 2. Held here rather than inside
            // signInFlow so the dependency between the two steps is visible in the
            // signature of every method that touches it, not just in what happens to
            // work if you call them in the right order.
            let authPageUrls: AuthPageUrls | undefined;

            // ========== STEP 1: Back Button Protection ==========
            await ReportLog.step('Step 1: Verify back button protection after MFA', async () => {
                await signInFlow.openSignInScreen({ baseUrl: getBaseUrl(), testInfo });

                authPageUrls = await signInFlow.submitValidCredentials(account);

                await signInFlow.completeSignInFromAuthenticatorStep(account);

                const isSignedIn = await portalPage.isSignedIn();
                expect(isSignedIn, 'User should be authenticated').toBe(true);

                const dashboardUrl = await basePage.getCurrentUrl();
                ReportLog.setParameter('Dashboard URL before back button', dashboardUrl);

                await signInFlow.clickBrowserBackButton();
                const isMfaVisible = await signInPage.isOtpScreenVisible();
                expect(isMfaVisible, 'MFA screen should NOT be visible after back button').toBe(false);
                const stillSignedIn = await portalPage.isSignedIn();
                expect(stillSignedIn, 'User should still be signed in after back button').toBe(true);

                ReportLog.setParameter('Step 1 Status', 'PASSED - Back button protection verified');
            });

            await ReportLog.step('Step 2: Verify cached pages not accessible via browser history', async () => {
                // The URLs captured in Step 1. Asserted here, at the point of use, so a
                // failure to capture them points straight at this step rather than
                // surfacing later as a generic error from inside the flow.
                const { mfaPageUrl, passwordPageUrl } = authPageUrls ?? {};

                expect(mfaPageUrl, 'MFA page URL should have been captured').toBeDefined();
                expect(passwordPageUrl, 'Password page URL should have been captured').toBeDefined();

                // Attempt direct access to MFA page. The flow reports what it saw; the
                // spec decides what "protected" means - screen not shown, or shown but
                // redirected away from the direct URL.
                const mfaAccess = await signInFlow.openMfaPageDirectly(mfaPageUrl!);
                expect.soft(mfaAccess.screenVisible, 'MFA screen served on direct access').toBe(false);
                if (mfaAccess.screenVisible) {
                    expect.soft(mfaAccess.url, 'Redirected away from the direct MFA URL').not.toBe(mfaPageUrl);
                }

                // Attempt direct access to password page - same reasoning.
                const passwordAccess = await signInFlow.openPasswordPageDirectly(passwordPageUrl!);
                expect.soft(passwordAccess.screenVisible, 'Password screen served on direct access').toBe(false);
                if (passwordAccess.screenVisible) {
                    expect.soft(passwordAccess.url, 'Redirected away from the direct password URL').not.toBe(passwordPageUrl);
                }
            });
        }
    );
});