import { UserCredentials } from '../../../src/auth/credentials';
import { OTP_ENABLED } from '../../../config/environment';
import { MESSAGE_CONSTANTS } from '../../../src/constant/messages-constants';
import { test, expect, getBaseUrl } from '../../test-hooks';
import { reportTestCaseLink } from '../../../src/helper/report-helper';
import { getPrimaryHolderOrSkip } from '../../../src/helper/accounts-helper';

const INVALID_CREDENTIAL_TEST_ID = '2536';
const INVALID_MFA_CODE_TEST_ID = '2537';
const NO_CREDENTIAL_CACHE_TEST_ID = '2551';

test.describe.configure({ mode: 'serial' });

test.describe('TSS Portal sign-in - negative cases', () => {

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

    test('Verify that an incorrect password is refused', { tag: ['@auth', '@negative'] }, async ({ signInFlow }, testInfo) => {
        reportTestCaseLink(INVALID_CREDENTIAL_TEST_ID);
        await signInFlow.openSignInScreen({ baseUrl: getBaseUrl(), testInfo });

        // Derived from the real password rather than written out, so this stays wrong
        // on the day the password is rotated.
        const message = await signInFlow.submitRejectedCredentials(
            account.username,
            `${account.password}-wrong`,
            'a wrong password'
        );

        expect(message, 'Sign-in error for a wrong password')
            .toBe(MESSAGE_CONSTANTS.INVALID_SIGN_IN_CREDENTIALS);
    });

    test('Verify that an incorrect username is refused', { tag: ['@auth', '@negative'] }, async ({ signInFlow }, testInfo) => {
        reportTestCaseLink(INVALID_CREDENTIAL_TEST_ID);
        await signInFlow.openSignInScreen({ baseUrl: getBaseUrl(), testInfo });

        const message = await signInFlow.submitRejectedCredentials(
            'no.such.user.automation@example.invalid',
            account.password,
            'an unknown username'
        );

        expect(message, 'Sign-in error for an unknown username')
            .toBe(MESSAGE_CONSTANTS.INVALID_SIGN_IN_CREDENTIALS);
    });

    test('Verify that missing password is refused', { tag: ['@auth', '@negative'] }, async ({ signInFlow }, testInfo) => {
        reportTestCaseLink(INVALID_CREDENTIAL_TEST_ID);
        await signInFlow.openSignInScreen({ baseUrl: getBaseUrl(), testInfo });

        const message = await signInFlow.submitRejectedCredentials(
            account.username,
            '',
            'a missing password'
        );

        expect(message, 'Sign-in error for a missing password')
            .toBe(MESSAGE_CONSTANTS.INVALID_SIGN_IN_CREDENTIALS);
    });

    test('Verify that missing username is refused', { tag: ['@auth', '@negative'] }, async ({ signInFlow }, testInfo) => {
        reportTestCaseLink(INVALID_CREDENTIAL_TEST_ID);
        await signInFlow.openSignInScreen({ baseUrl: getBaseUrl(), testInfo });

        // The real password, with no username to attach it to. No account is named, so
        // nothing here counts against one.
        const message = await signInFlow.submitRejectedCredentials(
            '',
            account.password,
            'a missing username'
        );

        expect(message, 'Sign-in error for a missing username')
            .toBe(MESSAGE_CONSTANTS.INVALID_SIGN_IN_CREDENTIALS);
    });

    test('Verify that a wrong authenticator code is refused', { tag: ['@auth', '@negative'] }, async ({ signInFlow }, testInfo) => {
        test.skip(!OTP_ENABLED, 'This environment does not ask for an authenticator code.');
        reportTestCaseLink(INVALID_MFA_CODE_TEST_ID);

        await signInFlow.openSignInScreen({ baseUrl: getBaseUrl(), testInfo });

        await signInFlow.submitValidCredentials(account);
        const message = await signInFlow.submitWrongAuthenticatorCode(account);

        expect(message, 'Authenticator code error')
            .toBe(MESSAGE_CONSTANTS.INVALID_AUTHENTICATOR_CODE);

        await signInFlow.completeSignInFromAuthenticatorStep(account);
    });
});

test.describe('TSS Portal sign-in - sensitive field security (Test Case 2551)', () => {
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
            const account = getPrimaryHolderOrSkip();
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
