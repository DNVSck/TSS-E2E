import { COMPANY_PROFILE, CompanyProfile, getCredentials, UserCredentials } from '../auth/credentials';
import { test } from '../../tests/test-hooks';

/**
 * Look up credentials for a company profile, skipping the test when the
 * environment variable that must be set for it isn't configured.
 *
 * Lives here (rather than src/auth/credentials.ts) because it needs
 * Playwright's `test.skip`, and credentials.ts deliberately stays
 * Playwright-free so test workers can read it without pulling in a
 * browser-launching module.
 */
export function credentialsOrSkip(profile: CompanyProfile, envKey: string): UserCredentials {
    test.skip(!process.env[envKey], `${envKey} is not configured for this environment`);
    return getCredentials(profile);
}

/** Shorthand for the profile every auth spec defaults to signing in as. */
export function getPrimaryHolderOrSkip(): UserCredentials {
    return credentialsOrSkip(COMPANY_PROFILE.PRIMARY_HOLDER, 'PRIMARY_HOLDER_USER_NAME');
}
