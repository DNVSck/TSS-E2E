/**
 * The wrong-case forms of a password, for testing that sign-in is case-sensitive.
 *
 * Derived from the REAL password rather than written out by hand. A hard-coded string
 * like 'mypassword123' is simply a wrong password: the service rejects it whether or
 * not it compares case, so a test built on one passes either way and can never fail
 * for the reason it exists. Changing only the case of the real password is what makes
 * the rejection evidence of case-sensitivity.
 */
export interface PasswordCaseVariant {
    /** The password with its case altered. */
    value: string;
    /** How to describe it in a report or an assertion message. */
    description: string;
}

/**
 * Every case variant that actually DIFFERS from the password given.
 *
 * The filter is not a tidy-up. A password that happens to be all lower case is its own
 * lower-case variant, so submitting it would sign the account IN - the test would then
 * be asserting that correct credentials are rejected, and fail while blaming the
 * service. Callers should treat an empty result as "this account cannot demonstrate
 * case-sensitivity" rather than as nothing to do.
 */
export const wrongCasePasswordVariants = (password: string): PasswordCaseVariant[] => [
    { value: password.toLowerCase(), description: 'the password in lower case' },
    { value: password.toUpperCase(), description: 'the password in upper case' },
].filter(variant => variant.value !== password);
