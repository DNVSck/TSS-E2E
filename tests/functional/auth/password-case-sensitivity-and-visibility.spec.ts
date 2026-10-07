import { BASE_URL } from '../../../config/environment';
import { test, expect } from '../../base-test';
import { ERROR_MESSAGE } from '../../../src/constant/error-message-constant';
import { reportTestCaseLink } from '../../../src/helper/report-helper';
import { ReportLog } from '../../../src/core/report/report-log';
import {
    COMPANY_PROFILE,
    UserCredentials,
    accountFor,
    isProfileConfigured,
} from '../../../src/auth/credentials';
import { wrongCasePasswordVariants } from '../../../src/test-data/password-case-data';

const CASE_SENSITIVITY_AND_VISIBILITY_TEST_ID = '2546';

/** What the toggle button reads in each state - GOV.UK password-input component. */
const SHOW = 'Show';
const HIDE = 'Hide';


test.describe('TSS Portal - Password Case-Sensitivity and Visibility (Test Case 2546)', () => {

    test.skip(
        !isProfileConfigured(COMPANY_PROFILE.AUTH_ACCOUNT),
        'AUTH_ACCOUNT_USER_NAME_1 is not configured for this environment'
    );

    let account: UserCredentials;

    test.beforeEach(() => {
        account = accountFor(COMPANY_PROFILE.AUTH_ACCOUNT, test.info().parallelIndex);
    });

    test.afterEach(async ({ signInFlow }, testInfo) => {
        // A skipped test never reached the line above, so there is no account to
        // sign in as - and nothing was attempted that would need clearing.
        if (!account) {
            return;
        }
        // Steps 2 and 3 leave failed attempts against the account; a successful
        // sign-in is what clears the counter.
        await signInFlow.restoreSignedInState(account, { baseUrl: BASE_URL, testInfo });
    });

    test('Test Case 2546 - Password case-sensitivity and Show/Hide button functionality',
        { tag: ['@auth', '@security', '@regression'] },
        async ({ signInFlow }, testInfo) => {
            reportTestCaseLink(CASE_SENSITIVITY_AND_VISIBILITY_TEST_ID);

            // ---- Step 1: the sign-in screen offers an empty, masked password field ----
            await ReportLog.step('Step 1: The sign-in screen shows an empty password field and a Show button', async () => {
                await signInFlow.openSignInScreen({ baseUrl: BASE_URL, testInfo });

                expect(await signInFlow.getPasswordFieldValue(), 'Password field starts empty')
                    .toBe('');
                expect(await signInFlow.isPasswordToggleButtonVisible(), 'Password toggle button is offered')
                    .toBe(true);
            });

            // ---- Steps 2 and 3: the same password in the wrong case is refused ----
            // Derived from the real password, so a rejection is evidence about CASE and
            // not merely evidence that some other string is not the password. An account
            // whose password has no case variety cannot demonstrate this at all, which
            // is a fact about the fixture and has to fail loudly rather than pass quietly.
            const variants = wrongCasePasswordVariants(account.password);

            expect(
                variants.length,
                'AUTH_ACCOUNT password has no upper/lower case variation, so this test '
                + 'cannot demonstrate case-sensitivity - give the account a mixed-case password'
            ).toBeGreaterThan(0);

            for (const { value, description } of variants) {
                await ReportLog.step(`Steps 2-3: Sign-in is refused for ${description}`, async () => {
                    await signInFlow.openSignInScreen({ baseUrl: BASE_URL, testInfo });

                    const message = await signInFlow.submitRejectedCredentials(
                        account.username,
                        value,
                        description
                    );

                    expect(message, `System should reject ${description}`)
                        .toBe(ERROR_MESSAGE.INVALID_SIGN_IN_CREDENTIALS);
                });
            }

            // ---- Steps 4 to 6: the Show/Hide toggle, on one visit to the screen ----
            // The password is typed but NOT submitted. Masking is a property of the field
            // while the user types, so submitting would leave the only screen that can be
            // observed - and would spend a real sign-in attempt to learn nothing.
            await ReportLog.step('Step 4: The correct password is masked as it is typed', async () => {
                await signInFlow.openSignInScreen({ baseUrl: BASE_URL, testInfo });
                await signInFlow.enterPassword(account.password);

                expect(await signInFlow.isPasswordMasked(), 'Password is masked by default')
                    .toBe(true);
                expect(await signInFlow.getPasswordToggleButtonText(), 'Button offers to Show')
                    .toBe(SHOW);
            });

            await ReportLog.step('Step 5: Show reveals the password and the button becomes Hide', async () => {
                await signInFlow.togglePasswordVisibility();

                // The field type is the assertion, not the field value: reading the value
                // back would put the real password into any failure message.
                expect(await signInFlow.isPasswordMasked(), 'Show unmasks the password')
                    .toBe(false);
                expect(await signInFlow.getPasswordToggleButtonText(), 'Button now offers to Hide')
                    .toBe(HIDE);
            });

            await ReportLog.step('Step 6: Hide masks the password again and the button returns to Show', async () => {
                await signInFlow.togglePasswordVisibility();

                expect(await signInFlow.isPasswordMasked(), 'Hide re-masks the password')
                    .toBe(true);
                expect(await signInFlow.getPasswordToggleButtonText(), 'Button offers to Show again')
                    .toBe(SHOW);
            });
        });

});
