import { UserCredentials } from '../../../src/auth/credentials';
import { OTP_ENABLED } from '../../../config/environment';
import { MESSAGE_CONSTANTS } from '../../../src/constant/messages-constants';
import { test, expect, getBaseUrl } from '../../test-hooks';
import { reportTestCaseLink } from '../../../src/helper/report-helper';
import { getPrimaryHolderOrSkip } from '../../../src/helper/accounts-helper';

const EMAIL_NORMALIZATION_TEST_ID = '2545';

test('Test Case 2545: Email normalization and invalid format validation',
    { tag: ['@auth', '@regression', '@email-validation'] },
    async ({ signInFlow }, testInfo) => {
        reportTestCaseLink(EMAIL_NORMALIZATION_TEST_ID);
        test.skip(!OTP_ENABLED, 'This environment does not have MFA enabled.');

        const account = getPrimaryHolderOrSkip();

        // Step 1: Navigate to TSS2 service start page
        // The login page is displayed
        await signInFlow.openSignInScreen({ baseUrl: getBaseUrl(), testInfo });

        // Step 2: Enter the email address in uppercase and valid password, then click "Sign in"
        // The system normalizes the email and authenticates the user
        // The MFA code entry screen is displayed
        const uppercaseEmailCredentials: UserCredentials = {
            ...account,
            username: account.username.toUpperCase(),
        };
        await signInFlow.submitValidCredentials(uppercaseEmailCredentials);

        // Enter the MFA code and verify login is successful
        await signInFlow.completeSignInFromAuthenticatorStep(account);
        const otpVisible = await signInFlow.isOtpFieldVisible();
        expect(otpVisible, 'MFA code field should be visible after valid sign-in').toBe(true);

        // Step 3: Log out (implicitly handled by cleanup via restoreSignedInState)

        // Step 4: Enter an invalid email format (e.g., "notanemail") in the email field and click "Sign in"
        // The system rejects the submission with an error message
        const invalidEmailError1 = await signInFlow.submitRejectedCredentials(
            'notanemail',
            'any-password',
            'invalid email format (no @ symbol)'
        );
        expect(invalidEmailError1).toBeTruthy();

        // Step 5: Enter another invalid format (e.g., "user@") in the email field and click "Sign in"
        // The system rejects the submission with the same or similar error message
        const invalidEmailError2 = await signInFlow.submitRejectedCredentials(
            'user@',
            'any-password',
            'invalid email format (incomplete domain)'
        );
        expect(invalidEmailError2).toBeTruthy();

        // Verify error messages are consistent
        expect(invalidEmailError1).toBe(invalidEmailError2);
        expect(invalidEmailError1).toBe(MESSAGE_CONSTANTS.INVALID_SIGN_IN_CREDENTIALS);

        // Cleanup: Restore signed-in state
        await signInFlow.restoreSignedInState(account, { baseUrl: getBaseUrl(), testInfo });
    }
);
