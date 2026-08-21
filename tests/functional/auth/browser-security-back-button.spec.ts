import { test, expect, getBaseUrl } from '../../test-hooks';
import { COMPANY_PROFILE, UserCredentials, accountFor, isProfileConfigured } from '../../../src/auth/credentials';
import { OTP_ENABLED } from '../../../config/environment';
import { reportTestCaseLink } from '../../../src/helper/report-helper';
import { ReportLog } from '../../../src/core/report/report-log';
import { AuthPageUrls } from '../../../src/flows/sign-in-flow';

const TEST_CASE_ID = '2549';

/**
 * Test Case 2549, steps 1 and 2 only.
 *
 * Step 3 - "no auto-login after browser closure" - is deliberately NOT automated, and
 * this is the only record of why.
 *
 * The portal issues its own session cookie `tss.sid` as a PERSISTENT cookie with a ~24
 * hour lifetime, not a session cookie. So a session surviving a browser restart is what
 * the service is built to do; confirmed by hand on sit, 2026-08-21 - closed the browser,
 * reopened, still signed in with no re-authentication. What actually ends a session is
 * idle time (~30 minutes), not closing the browser.
 *
 * So the step measures a cause that does not exist: any test of it would pass or fail on
 * how quickly the browser was reopened, which is a fact about the tester, not the
 * service. The version that was here asserted that a FRESH browser context has no
 * cookies - true by definition of a fresh context, so it could not fail for a product
 * reason, and it never closed a browser at all.
 *
 * Raised with Martin Harber: whether a persistent 24-hour cookie is the intended policy.
 * If it is not, this belongs in a defect rather than a test. If it is, the step should be
 * re-scoped to the idle timeout - which nothing here asserts today.
 */
test.describe('TSS Portal sign-in - browser security (Test Case 2549)', () => {

    // Decided once, when the file is read, so no fixture is built for a run that cannot
    // do this at all - see isProfileConfigured.
    test.skip(
        !isProfileConfigured(COMPANY_PROFILE.AUTH_ACCOUNT),
        'AUTH_ACCOUNT_USER_NAME_1 is not configured for this environment'
    );

    let account: UserCredentials;

    // No parameters, and testInfo read through test.info() - see tests/test-hooks.ts for
    // why an empty destructure and a named-but-unused fixture are both worse.
    test.beforeEach(() => {
        const testInfo = test.info();

        test.skip(!OTP_ENABLED, 'This environment does not ask for an authenticator code.');

        test.skip(
            testInfo.project.name.includes('cy'),
            'Skipping Welsh locale due to language switcher timing issues'
        );

        account = accountFor(COMPANY_PROFILE.AUTH_ACCOUNT, testInfo.parallelIndex);
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