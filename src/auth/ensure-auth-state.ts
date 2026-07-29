import { chromium } from '@playwright/test';
import { OTP_ENABLED, ENV, BASE_URL } from '../../config/environment';
import { PortalPage } from '../page-object/portal-page';
import { SignInPage } from '../page-object/sign-in-page';
import { authStatePath, isAuthStateFresh, AUTH_STATE_TTL_MINUTES } from './auth-state';
import { CompanyProfile, UserCredentials, getCredentialsPool, profilesToAuthenticate } from './credentials';

const SIGN_IN_TIMEOUT_MS = 60_000;

/**
 * Signs in one account per parallel worker (per requested profile) and caches
 * each session, so no test ever performs an interactive sign-in. `workerCount`
 * caps how many pool accounts are signed in — one no worker will use is a wasted
 * login.
 *
 * This runs in globalSetup rather than as a Playwright "setup project" so that a
 * successful sign-in does not appear as a passing test in the report. The cost:
 * no automatic trace/screenshot on failure, hence the explicit error below.
 *
 * By default every run signs in exactly once, so the login journey is exercised
 * each run. Set AUTH_REUSE_SESSION to skip it while a cached session is still
 * within its TTL — useful for a fast local edit-run loop.
 *
 * Re-running within 30 seconds is safe: SignInPage.inputTotp retries on the OTP
 * error, resubmitting once the code rolls into the next window, rather than
 * replaying a code Keycloak has already seen.
 */
export async function ensureAuthState(workerCount: number): Promise<void> {
    const accounts = selectAccounts(profilesToAuthenticate(), workerCount);
    const stale = accounts.filter(a => !isAuthStateFresh(a.profile, a.accountNumber));

    if (stale.length === 0) {
        console.log(
            `Auth: AUTH_REUSE_SESSION is on — reusing ${accounts.length} cached "${ENV}" ` +
            `session(s) (younger than ${AUTH_STATE_TTL_MINUTES} minutes).`
        );
        return;
    }

    const browser = await chromium.launch({
        headless: process.env.HEADLESS === 'true',
    });

    try {
        // Sign every account in concurrently — each in its own context. They have
        // DISTINCT TOTP secrets, so landing in the same 30-second window yields
        // different codes, not the reused code Keycloak rejects. allSettled (not
        // Promise.all) lets every account finish before we surface failures, so a
        // report names all bad credentials at once instead of just the first.
        const results = await Promise.allSettled(
            stale.map(account => signInAndSaveState(browser, account))
        );
        assertNoSignInFailures(results, stale.length);
    } finally {
        await browser.close();
    }
}

/**
 * Sign in one account per worker, capped at the profile's pool size: an account
 * no worker will use is a wasted login. A single-account profile yields a
 * one-element pool, so this reduces to today's behaviour.
 */
function selectAccounts(profiles: CompanyProfile[], workerCount: number): UserCredentials[] {
    return profiles.flatMap(profile => {
        const pool = getCredentialsPool(profile);
        const needed = Math.min(pool.length, Math.max(workerCount, 1));
        return pool.slice(0, needed);
    });
}

/** Throw if any concurrent sign-in rejected, naming every failure at once. */
function assertNoSignInFailures(results: PromiseSettledResult<void>[], attempted: number): void {
    const failures = results
        .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
        .map(r => (r.reason instanceof Error ? r.reason.message : String(r.reason)));

    if (failures.length > 0) {
        throw new Error(
            `Auth: ${failures.length} of ${attempted} sign-in(s) failed.\n\n` +
            failures.join('\n\n')
        );
    }
}

/** Human label + env-var hints for one account, indexed or not. */
function accountLabel(c: UserCredentials): string {
    return c.accountNumber === undefined ? c.profile : `${c.profile} account ${c.accountNumber}`;
}

function envKey(c: UserCredentials, field: string): string {
    return c.accountNumber === undefined
        ? `${c.profile}_${field}`
        : `${c.profile}_${field}_${c.accountNumber}`;
}

async function signInAndSaveState(
    browser: Awaited<ReturnType<typeof chromium.launch>>,
    credentials: UserCredentials
): Promise<void> {
    const label = accountLabel(credentials);
    assertTotpSecretPresent(credentials, label);

    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        const portalPage = new PortalPage(page);
        const signInPage = new SignInPage(page);

        await page.goto(BASE_URL);
        await portalPage.clickSignIn();
        await signInPage.signIn(credentials);

        if (OTP_ENABLED) {
            await signInPage.inputTotp(credentials.totpSecret!);
        }

        await portalPage.waitUntilSignedIn(SIGN_IN_TIMEOUT_MS);
        await context.storageState({ path: authStatePath(credentials.profile, credentials.accountNumber) });

        console.log(`Auth: signed in as ${credentials.username} (${label}) on "${ENV}".`);
    } catch (error) {
        throw buildSignInError(credentials, label, page.url(), error);
    } finally {
        await context.close();
    }
}

/** OTP_ENABLED requires a TOTP secret per account — fail early with the env-var hint. */
function assertTotpSecretPresent(credentials: UserCredentials, label: string): void {
    if (OTP_ENABLED && !credentials.totpSecret) {
        throw new Error(
            `OTP_ENABLED is true but no TOTP secret is set for ${label}. ` +
            `Set ${envKey(credentials, 'TOTP_SECRET')} in .env.${ENV}.`
        );
    }
}

/** The diagnostic error for a failed sign-in — points at the exact env vars to check. */
function buildSignInError(credentials: UserCredentials, label: string, url: string, error: unknown): Error {
    const reason = error instanceof Error ? error.message : String(error);
    const stuckOnAuthServer = url.includes('/realms/');
    const totpHint = OTP_ENABLED ? ` / ${envKey(credentials, 'TOTP_SECRET')}` : '';

    return new Error(
        `Auth: failed to sign in as ${label} on "${ENV}" (${url}).\n` +
        (stuckOnAuthServer
            ? 'The browser never left the identity provider, so a credential was rejected. '
            : '') +
        `Check ${envKey(credentials, 'USER_NAME')} / ${envKey(credentials, 'PASSWORD')}` +
        `${totpHint} in .env.${ENV}.\n` +
        `Underlying error: ${reason}`
    );
}
