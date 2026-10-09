import { chromium, expect } from '@playwright/test';
import { OTP_ENABLED, ENV, BASE_URL } from '../../config/environment';
import { PortalPage } from '../page-object/portal-page';
import { SignInPage } from '../page-object/sign-in-page';
import { createTranslator } from '../fixtures/locale-fixture';
import { LOCALES_CONSTANT } from '../constant/locales-constant';
import { authStatePath, isAuthStateFresh, isSessionYoungEnough, AUTH_STATE_TTL_MINUTES } from './auth-state';
import {
    CompanyProfile, UserCredentials, accountFor, accountEnvKey, accountOffset, getCredentialsPool,
    profilesToAuthenticate,
} from './credentials';

const SIGN_IN_TIMEOUT_MS = 60_000;

/**
 * How long the portal gets to answer when this file opens it.
 *
 * Set explicitly because nothing else sets it: playwright.config's
 * navigationTimeout lives under `use`, which reaches pages the test runner builds -
 * and globalSetup launches its own browser, so that navigation silently ran on the
 * library default of 30s, the only one in the suite that did.
 *
 * 30s is not enough here for a reason particular to this file: every profile is
 * signed in at once, so six contexts ask a cold portal for its landing page in the
 * same instant. Measured on sit 2026-09-03 - three of six timed out at 30s while
 * the other three came back.
 */
const PORTAL_OPEN_TIMEOUT_MS = 90_000;

const PORTAL_OPEN_RETRY_TIMEOUT_MS = PORTAL_OPEN_TIMEOUT_MS * 2 + 5_000;

export interface SignInFailure {
    account: string;
    message: string;
    stack: string;
    screenshot?: Buffer;
}

export const SIGN_IN_FAILURE_ATTACHMENT = 'sign-in failure';

export class SignInScreenshotError extends Error {
    constructor(message: string, readonly screenshot?: Buffer, cause?: unknown) {
        super(message, { cause });
        this.name = 'SignInScreenshotError';
    }
}

export class SignInFailedError extends Error {
    constructor(readonly failures: SignInFailure[], attempted: number) {
        super(
            `Auth: ${failures.length} of ${attempted} sign-in(s) failed.\n\n` +
            failures.map(failure => failure.message).join('\n\n')
        );
        this.name = 'SignInFailedError';
    }
}

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
        assertNoSignInFailures(results, stale);
    } finally {
        await browser.close();
    }
}

/**
 * Sign in one account per worker, starting at ACCOUNT_OFFSET and capped at the
 * profile's pool size: an account no worker will use is a wasted login, and one
 * another shard owns must not be signed in here. A single-account profile yields
 * a one-element pool, so this reduces to today's behaviour.
 */
function selectAccounts(profiles: CompanyProfile[], workerCount: number): UserCredentials[] {
    return profiles.flatMap(profile => {
        const pool = getCredentialsPool(profile);

        if (pool.length === 1) {
            return pool;
        }

        const offset = accountOffset();
        const needed = Math.min(pool.length - offset, Math.max(workerCount, 1));
        return pool.slice(offset, offset + Math.max(needed, 0));
    });
}

/** Throw if any concurrent sign-in rejected, naming every failure at once. */
function assertNoSignInFailures(
    results: PromiseSettledResult<void>[],
    accounts: UserCredentials[]
): void {
    const failures = results.flatMap((result, index) =>
        result.status === 'rejected'
            ? [{
                account: accountLabel(accounts[index]),
                message: result.reason instanceof Error
                    ? result.reason.message : String(result.reason),
                stack: result.reason instanceof Error ? result.reason.stack ?? '' : '',
                screenshot: result.reason instanceof SignInScreenshotError
                    ? result.reason.screenshot : undefined,
            }]
            : []
    );

    if (failures.length > 0) {
        throw new SignInFailedError(failures, accounts.length);
    }
}

/** Human label for one account, indexed or not. */
function accountLabel(c: UserCredentials): string {
    return c.accountNumber === undefined ? c.profile : `${c.profile} account ${c.accountNumber}`;
}

async function signInAndSaveState(
    browser: Awaited<ReturnType<typeof chromium.launch>>,
    credentials: UserCredentials
): Promise<void> {
    const label = accountLabel(credentials);
    assertTotpSecretPresent(credentials, label);

    const context = await browser.newContext();
    const page = await context.newPage();
    let reachedSignInForm = false;

    try {
        const portalPage = new PortalPage(page);
        // English: globalSetup launches a context with no locale override, so the
        // identity provider serves its default. A spec signing in under the Welsh
        // project gets its own translator from the fixture.
        const signInPage = new SignInPage(page, createTranslator(LOCALES_CONSTANT.EN_GB));

        await expect(async () => {
            await page.goto(BASE_URL, {
                waitUntil: 'domcontentloaded', timeout: PORTAL_OPEN_TIMEOUT_MS,
            });
        }).toPass({ timeout: PORTAL_OPEN_RETRY_TIMEOUT_MS, intervals: [0] });
        await portalPage.clickSignIn();
        reachedSignInForm = true;
        await signInPage.signIn(credentials);

        if (OTP_ENABLED) {
            await signInPage.waitForAuthenticatorCodeStep();
            await signInPage.inputTotp(credentials.totpSecret!);
        }

        await portalPage.waitUntilSignedIn(SIGN_IN_TIMEOUT_MS);
        await context.storageState({ path: authStatePath(credentials.profile, credentials.accountNumber) });

        console.log(`Auth: signed in as ${credentials.username} (${label}) on "${ENV}".`);
    } catch (error) {
        const screenshot = await page.screenshot().catch(() => undefined);
        throw new SignInScreenshotError(
            signInErrorMessage({ credentials, label, url: page.url(), error, reachedSignInForm }),
            screenshot,
            error
        );
    } finally {
        await context.close();
    }
}

/** OTP_ENABLED requires a TOTP secret per account — fail early with the env-var hint. */
function assertTotpSecretPresent(credentials: UserCredentials, label: string): void {
    if (OTP_ENABLED && !credentials.totpSecret) {
        throw new Error(
            `OTP_ENABLED is true but no TOTP secret is set for ${label}. ` +
            `Set ${accountEnvKey(credentials, 'TOTP_SECRET')} in .env.${ENV}.`
        );
    }
}

interface SignInAttempt {
    credentials: UserCredentials;
    label: string;
    url: string;
    error: unknown;
    reachedSignInForm: boolean;
}

/** The diagnostic message for a failed sign-in — points at the exact env vars to check. */
function signInErrorMessage(failure: SignInAttempt): string {
    const { credentials, label, url, error, reachedSignInForm } = failure;
    const reason = error instanceof Error ? error.message : String(error);

    if (!reachedSignInForm) {
        return `Auth: failed to sign in as ${label} on "${ENV}" (${url}).\n` +
            'The portal never offered Sign in, so no credential was tried - this is not a ' +
            `credential problem. Check that the portal on "${ENV}" is up and renders its ` +
            'landing page, not the values in the .env file.\n' +
            `Underlying error: ${reason}`;
    }

    const stuckOnAuthServer = url.includes('/realms/');
    const totpHint = OTP_ENABLED ? ` / ${accountEnvKey(credentials, 'TOTP_SECRET')}` : '';

    return `Auth: failed to sign in as ${label} on "${ENV}" (${url}).\n` +
        (stuckOnAuthServer
            ? 'The browser never left the identity provider, so a credential was rejected. '
            : '') +
        `Check ${accountEnvKey(credentials, 'USER_NAME')} / ${accountEnvKey(credentials, 'PASSWORD')}` +
        `${totpHint} in .env.${ENV}.\n` +
        `Underlying error: ${reason}`;
}

/**
 * Make sure this worker's account for a profile has a session young enough to use,
 * signing it in if it does not. Returns the milliseconds that cost - 0 when the
 * session was already young enough - so a caller can give exactly that much back to
 * the test's budget, the way an account lock hands back what queueing took.
 *
 * Two callers, one rule. A profile kept out of globalSetup earns its session the first
 * time a test asks for it - signing it in on every run costs a login the other suites
 * never need, and an expired password on it would block them all. A profile globalSetup
 * DID sign in comes back here later for the opposite reason: that one sign-in happens
 * at t=0 and every test replays the file it wrote, so a run longer than the identity
 * provider's idle window reaches its later tests signed out.
 *
 * isSessionYoungEnough, not isAuthStateFresh: this asks whether THIS run already signed
 * the profile in, which must hold even when session REPLAY across runs is switched off.
 * Using the replay guard here would sign in again for every test that touched the
 * profile, spending a login each time and colliding with its own TOTP window.
 *
 * Nothing here serialises anything. A caller reaching this for a profile several
 * workers share must already hold that account's lock, or two of them can sign one
 * account in inside the same 30-second TOTP window and produce the same code.
 */
export async function signInOnDemand(
    profile: CompanyProfile,
    parallelIndex: number
): Promise<number> {
    const account = accountFor(profile, parallelIndex);

    if (isSessionYoungEnough(account.profile, account.accountNumber)) {
        return 0;
    }

    const startedAt = Date.now();
    const browser = await chromium.launch({ headless: true });

    try {
        await signInAndSaveState(browser, account);
    } finally {
        await browser.close();
    }

    return Date.now() - startedAt;
}
