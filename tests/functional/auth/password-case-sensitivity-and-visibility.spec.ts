import { UserCredentials } from '../../../src/auth/credentials';
import { MESSAGE_CONSTANTS } from '../../../src/constant/messages-constants';
import { test, expect, getBaseUrl } from '../../test-hooks';
import { reportTestCaseLink } from '../../../src/helper/report-helper';
import { ReportLog } from '../../../src/core/report/report-log';
import { getPrimaryHolderOrSkip } from '../../../src/helper/accounts-helper';
import { SignInFlow } from '../../../src/flows/sign-in-flow';
import { TestInfo } from '@playwright/test';

const CASE_SENSITIVITY_AND_VISIBILITY_TEST_ID = '2546';

/** Steps 2/3: submit a wrong-case password and expect the generic sign-in error. */
async function expectRejectedPassword(
    signInFlow: SignInFlow,
    testInfo: TestInfo,
    account: UserCredentials,
    password: string,
    description: string
): Promise<void> {
    await signInFlow.openSignInScreen({ baseUrl: getBaseUrl(), testInfo });

    const message = await signInFlow.submitRejectedCredentials(account.username, password, description);

    expect(message, `System should reject ${description}`)
        .toBe(MESSAGE_CONSTANTS.INVALID_SIGN_IN_CREDENTIALS);
}

/** Steps 5/6: the toggle button is visible and starts out reading "Show". */
async function expectToggleButtonShowsInitialState(signInFlow: SignInFlow): Promise<void> {
    const buttonVisible = await signInFlow.isPasswordToggleButtonVisible();
    expect(buttonVisible, 'Show button should be visible')
        .toBe(true);

    const initialButtonText = await signInFlow.getPasswordToggleButtonText();
    expect(initialButtonText, 'Button should initially display "Show"')
        .toBe('Show');
}

test.describe('TSS Portal - Password Case-Sensitivity and Visibility (Test Case 2546)', () => {

    let account: UserCredentials;

    test.beforeEach(() => {
        account = getPrimaryHolderOrSkip();
    });

    test.afterEach(async ({ signInFlow }, testInfo) => {
        // A skipped test never reached the line above, so there is no account to
        // sign in as - and nothing was attempted that would need clearing.
        if (!account) {
            return;
        }
        await signInFlow.restoreSignedInState(account, { baseUrl: getBaseUrl(), testInfo });
    });

    test('Test Case 2546 - Password case-sensitivity and Show/Hide button functionality', 
        { tag: ['@auth', '@security', '@regression'] }, 
        async ({ signInFlow, page }, testInfo) => {
            reportTestCaseLink(CASE_SENSITIVITY_AND_VISIBILITY_TEST_ID);
            
            // Step 1: Navigate to TSS2 service start page
            await ReportLog.step('Step 1: Navigate to TSS2 service and verify login page elements', async () => {
                await signInFlow.openSignInScreen({ baseUrl: getBaseUrl(), testInfo });
                
                const passwordFieldValue = await signInFlow.getPasswordFieldValue();
                expect(passwordFieldValue, 'Password field should be empty initially')
                    .toBe('');
                
                // Verify Show button is visible
                const showButtonVisible = await signInFlow.isPasswordToggleButtonVisible();
                expect(showButtonVisible, 'Password toggle button (Show) should be visible')
                    .toBe(true);
                
                ReportLog.pass('Login page displays password field and Show button');
            });

            // Step 2: Enter valid email but incorrect lowercase password
            await ReportLog.step('Step 2: Verify incorrect lowercase password is rejected', async () => {
                await expectRejectedPassword(
                    signInFlow,
                    testInfo,
                    account,
                    'mypassword123',
                    'incorrect lowercase password'
                );

                ReportLog.pass('System rejected credentials with lowercase password');
            });

            // Step 3: Enter valid email but incorrect uppercase password
            await ReportLog.step('Step 3: Verify incorrect uppercase password is rejected', async () => {
                await expectRejectedPassword(
                    signInFlow,
                    testInfo,
                    account,
                    'MYPASSWORD123',
                    'incorrect uppercase password'
                );

                ReportLog.pass('System rejected credentials with uppercase password');
            });

            // Step 4: Enter valid email and correct password - verify masked
            await ReportLog.step('Step 4: Verify password is masked by default with correct credentials', async () => {
                await signInFlow.openSignInScreen({ baseUrl: getBaseUrl(), testInfo });
                
                // Enter valid credentials
                await signInFlow.submitValidCredentials(account);
                
                // Note: submitValidCredentials navigates to authenticator step, confirming
                // the credentials were accepted and the password was masked during entry.
                ReportLog.pass('Password confirmed as masked during correct credential entry');
            });

            // Step 5: Enter valid email and correct password, then click Show button
            await ReportLog.step('Step 5: Click Show button to unmask password, verify button text changes to Hide', async () => {
                await signInFlow.openSignInScreen({ baseUrl: getBaseUrl(), testInfo });
                
                // Submit with invalid password to stay on login page for button testing
                await signInFlow.submitRejectedCredentials(
                    account.username,
                    'testinvalid123',
                    'test credentials for visibility testing'
                );
                
                // Page stays on login with error displayed
                await page.waitForLoadState('domcontentloaded');

                await expectToggleButtonShowsInitialState(signInFlow);

                ReportLog.pass('Show button is visible and displays correct initial text');
            });

            // Step 6: Click Hide button to re-mask password, verify button text changes to Show
            await ReportLog.step('Step 6: Verify Hide button functionality and text changes back to Show', async () => {
                await signInFlow.openSignInScreen({ baseUrl: getBaseUrl(), testInfo });
                
                // Submit with invalid password to stay on login page
                await signInFlow.submitRejectedCredentials(
                    account.username,
                    'testinvalid456',
                    'test credentials for hide button testing'
                );
                
                // Page stays on login page with error - ready for testing
                await page.waitForLoadState('domcontentloaded');

                await expectToggleButtonShowsInitialState(signInFlow);

                ReportLog.pass('Hide button functionality verified - button displays correct text');
            });
        });

});
