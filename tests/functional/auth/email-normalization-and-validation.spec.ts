import { OTP_ENABLED } from '../../../config/environment';
import { MESSAGE_CONSTANTS } from '../../../src/constant/messages-constants';
import { test, expect, getBaseUrl } from '../../test-hooks';
import { reportTestCaseLink } from '../../../src/helper/report-helper';
import { COMPANY_PROFILE, UserCredentials, getCredentials, isProfileConfigured } from '../../../src/auth/credentials';

const EMAIL_NORMALIZATION_TEST_ID = '2545';

test.describe.configure({ mode: 'serial' });
// Decided once, when the file is read - this file has no describe, so the file itself
// is the suite the annotation lands on. See isProfileConfigured.
test.skip(
    !isProfileConfigured(COMPANY_PROFILE.PRIMARY_HOLDER),
    'PRIMARY_HOLDER_USER_NAME is not configured for this environment'
);

test('Test Case 2545: Email normalization and invalid format validation',
    { tag: ['@auth', '@regression', '@email-validation'] },
    async ({ signInFlow }, testInfo) => {
        reportTestCaseLink(EMAIL_NORMALIZATION_TEST_ID);
        test.skip(!OTP_ENABLED, 'This environment does not have MFA enabled.');

        const account = getCredentials(COMPANY_PROFILE.PRIMARY_HOLDER);

        // Step 1: Navigate to TSS2 service start page
        // The login page is displayed
        await signInFlow.openSignInScreen({ baseUrl: getBaseUrl(), testInfo });

        // Steps 4 and 5 are done FIRST, and steps 2 and 3 last.
        //
        // The test case reads: sign in with an upper-case email, log out, then submit two
        // malformed ones. Written in that order the malformed submissions arrive while the
        // browser is on the PORTAL - a signed-in session has no sign-in form to submit, so
        // they wait 30 seconds for an email field that is not there. The step that was
        // meant to separate them, "log out", was never carried out: the comment pointed at
        // restoreSignedInState, which runs at the end of the test, not in the middle.
        //
        // Which half runs first carries no meaning - one asserts that an upper-case email
        // is normalised, the other that a malformed one is refused, and neither depends on
        // the other. Doing the refusals while still signed out removes the need to log out
        // at all, and leaves the successful sign-in as the last thing the test does, which
        // is the state the cleanup wants anyway.

        // Step 4: Enter an invalid email format (e.g., "notanemail") and click "Sign in"
        // The system rejects the submission with an error message
        const invalidEmailError1 = await signInFlow.submitRejectedCredentials(
            'notanemail',
            'any-password',
            'invalid email format (no @ symbol)'
        );
        expect(invalidEmailError1).toBeTruthy();

        // Step 5: Enter another invalid format (e.g., "user@") and click "Sign in"
        // The system rejects the submission with the same or similar error message
        const invalidEmailError2 = await signInFlow.submitRejectedCredentials(
            'user@',
            'any-password',
            'invalid email format (incomplete domain)'
        );
        expect(invalidEmailError2).toBeTruthy();

        // Both malformed addresses get the SAME message. A service that answered them
        // differently would be describing its own account list to an attacker.
        expect(invalidEmailError1).toBe(invalidEmailError2);
        expect(invalidEmailError1).toBe(MESSAGE_CONSTANTS.INVALID_SIGN_IN_CREDENTIALS);

        // Step 2: Enter the email address in uppercase and valid password, then click "Sign in"
        // The system normalizes the email and authenticates the user
        // The MFA code entry screen is displayed
        const uppercaseEmailCredentials: UserCredentials = {
            ...account,
            username: account.username.toUpperCase(),
        };
        await signInFlow.openSignInScreen({ baseUrl: getBaseUrl(), testInfo });
        await signInFlow.submitValidCredentials(uppercaseEmailCredentials);

        // Asserted BEFORE the code is entered. Reaching the authenticator screen is what
        // proves the upper-case email was normalised and accepted; once the code is
        // entered the browser is on the portal and this field is necessarily gone, so
        // asserting it afterwards asks for something that cannot be true.
        const otpVisible = await signInFlow.isOtpFieldVisible();
        expect(otpVisible, 'MFA code field should be visible after valid sign-in').toBe(true);

        // Step 3: finish the sign-in. This also clears the failed-attempt counter that
        // steps 4 and 5 left behind - the account is shared, and Keycloak locks one that
        // collects enough failures without a success between them.
        await signInFlow.completeSignInFromAuthenticatorStep(account);
    }
);
