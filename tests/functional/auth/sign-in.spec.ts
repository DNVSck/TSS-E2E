import { COMPANY_PROFILE, UserCredentials, accountFor, isProfileConfigured } from '../../../src/auth/credentials';
import { OTP_ENABLED } from '../../../config/environment';
import { test, expect, getBaseUrl } from '../../test-hooks';
import { reportTestCaseLink } from '../../../src/helper/report-helper';
import { ERROR_MESSAGE } from '../../../src/constant/error-message-constant';

const INVALID_CREDENTIAL_TEST_ID = '2536';
const INVALID_MFA_CODE_TEST_ID = '2537';
const NO_CREDENTIAL_CACHE_TEST_ID = '2551';

interface RejectedCredentialCase {
    title: string;
    description: string;
    getUsername: (account: UserCredentials) => string;
    getPassword: (account: UserCredentials) => string;
}

const REJECTED_CREDENTIAL_CASES: RejectedCredentialCase[] = [
    {
        title: 'Verify that an incorrect password is refused',
        description: 'a wrong password',
        getUsername: account => account.username,
        // Derived from the real password rather than written out, so this stays wrong
        // on the day the password is rotated.
        getPassword: account => `${account.password}-wrong`,
    },
    {
        title: 'Verify that an incorrect username is refused',
        description: 'an unknown username',
        getUsername: () => 'no.such.user.automation@example.invalid',
        getPassword: account => account.password,
    },
    {
        title: 'Verify that missing password is refused',
        description: 'a missing password',
        getUsername: account => account.username,
        getPassword: () => '',
    },
    {
        title: 'Verify that missing username is refused',
        description: 'a missing username',
        // The real password, with no username to attach it to. No account is named, so
        // nothing here counts against one.
        getUsername: () => '',
        getPassword: account => account.password,
    },
];

test.describe('TSS Portal sign-in - negative cases', () => {

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
        await signInFlow.restoreSignedInState(account, { baseUrl: getBaseUrl(), testInfo });
    });

    for (const { title, description, getUsername, getPassword } of REJECTED_CREDENTIAL_CASES) {
        test(title, { tag: ['@auth', '@negative', '@regression'] }, async ({ signInFlow }, testInfo) => {
            reportTestCaseLink(INVALID_CREDENTIAL_TEST_ID);
            await signInFlow.openSignInScreen({ baseUrl: getBaseUrl(), testInfo });

            const message = await signInFlow.submitRejectedCredentials(
                getUsername(account),
                getPassword(account),
                description
            );

            expect(message, `Sign-in error for ${description}`)
                .toBe(ERROR_MESSAGE.INVALID_SIGN_IN_CREDENTIALS);
        });
    }

    test('Verify that a wrong authenticator code is refused', { tag: ['@auth', '@negative', '@regression'] }, async ({ signInFlow }, testInfo) => {
        test.skip(!OTP_ENABLED, 'This environment does not ask for an authenticator code.');
        reportTestCaseLink(INVALID_MFA_CODE_TEST_ID);

        await signInFlow.openSignInScreen({ baseUrl: getBaseUrl(), testInfo });

        await signInFlow.submitValidCredentials(account);
        const message = await signInFlow.submitWrongAuthenticatorCode(account);

        expect(message, 'Authenticator code error')
            .toBe(ERROR_MESSAGE.INVALID_AUTHENTICATOR_CODE);

        await signInFlow.completeSignInFromAuthenticatorStep(account);
    });
});

test.describe('TSS Portal sign-in - sensitive field security (Test Case 2551)', () => {

    test.skip(
        !isProfileConfigured(COMPANY_PROFILE.AUTH_ACCOUNT),
        'AUTH_ACCOUNT_USER_NAME_1 is not configured for this environment'
    );
    test('Verify that password field is protected from browser auto-fill attacks', 
        { tag: ['@auth', '@security', '@regression'] }, 
        async ({ signInFlow }, testInfo) => {
            reportTestCaseLink(NO_CREDENTIAL_CACHE_TEST_ID);
            
            await signInFlow.openSignInScreen({ baseUrl: getBaseUrl(), testInfo });
            const passwordAutocomplete = await signInFlow.getPasswordFieldAutocomplete();
            expect(passwordAutocomplete ?? '', 
                'AC01: Password field must have autocomplete="off" or autocomplete="current-password" to prevent browser auto-fill')
                .toMatch(/^(off|current-password)$/i);
            
            const initialPasswordValue = await signInFlow.getPasswordFieldValue();
            expect(initialPasswordValue, 
                'AC01: Password field should be empty on initial load')
                .toBe('');
        });

    test('Verify that MFA code field is protected from browser auto-fill attacks', 
        { tag: ['@auth', '@security', '@regression'] }, 
        async ({ signInFlow }, testInfo) => {
            reportTestCaseLink(NO_CREDENTIAL_CACHE_TEST_ID);
            
            test.skip(!OTP_ENABLED, 'This environment does not ask for an authenticator code.');            
            const account = accountFor(COMPANY_PROFILE.AUTH_ACCOUNT, testInfo.parallelIndex);
            await signInFlow.openSignInScreen({ baseUrl: getBaseUrl(), testInfo });
            await signInFlow.submitValidCredentials(account);
    
            const otpAutocomplete = await signInFlow.getOtpFieldAutocomplete();
            expect(otpAutocomplete, 
                'AC02: MFA code field must have autocomplete="off" to prevent auto-fill of security codes')
                .toBe('one-time-code');
        
            const otpValue = await signInFlow.getOtpFieldValue();
            expect(otpValue, 
                'AC02: MFA code field must not auto-populate with previously entered codes')
                .toBe('');
            
            await signInFlow.completeSignInFromAuthenticatorStep(account);
        });
});
