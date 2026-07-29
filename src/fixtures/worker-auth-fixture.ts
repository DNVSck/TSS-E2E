import { test } from '@playwright/test';
import {
    CompanyProfile, UserCredentials, accountFor, profilesToAuthenticate, isSingleAccountProfile,
} from '../auth/credentials';
import { authStatePath } from '../auth/auth-state';
import { acquireAccountLock } from '../auth/account-lock';

export type WorkerAuthFixtureType = {
    /**
     * Which company profile this spec runs as — the single knob a spec sets:
     *
     *     test.use({ authProfile: COMPANY_PROFILE.AGENT });
     *
     * It picks this worker's account from the profile's pool and replays that
     * account's cached session, so no two concurrent workers share one session.
     *
     * Null (the default) means an anonymous, signed-out test — the accessibility
     * specs must run against the logged-out portal, so signed-in is opt-in.
     */
    authProfile: CompanyProfile | null;

    /**
     * The account this worker was actually assigned from authProfile's pool —
     * the single source of truth for both the replayed session (storageState)
     * and any reporting. Derived from authProfile, so a test can never run under
     * one account while reporting another. Null for an anonymous, signed-out test.
     */
    authAccount: UserCredentials | null;
};

/**
 * Fail on the spec's own profile rather than on whatever session file happens to
 * be lying around. globalSetup only signs in the profiles AUTH_PROFILES asks for;
 * a spec needing another one would replay a session from an earlier run - Playwright
 * loads a stale storageState without complaint, so the test dies much later on an
 * unexpected sign-in screen, far from the real cause.
 */
function assertProfileAuthenticated(profile: CompanyProfile): void {
    const authenticated = profilesToAuthenticate();

    if (authenticated.includes(profile)) return;

    throw new Error(
        `This spec runs as ${profile}, but this run only signed in: ${authenticated.join(', ')}. ` +
        `Any ${profile} session on disk is left over from an earlier run and would be replayed ` +
        `expired. Include the profile:\n\n` +
        `    AUTH_PROFILES=${[...authenticated, profile].join(',')}\n\n` +
        `If every run needs it, add it to DEFAULT_AUTH_PROFILES in src/auth/credentials.ts instead.`
    );
}

type ExtendParams = Parameters<typeof test.extend<WorkerAuthFixtureType>>;

export const workerAuthFixture: ExtendParams[0] = {
    authProfile: [null as CompanyProfile | null, { option: true }],

    // Resolve authProfile to this worker's assigned account once, so storageState
    // and reporting share a single source of truth (pool[parallelIndex]).
    authAccount: async ({ authProfile }, use, testInfo) => {
        if (!authProfile) {
            await use(null);
            return;
        }

        assertProfileAuthenticated(authProfile);
        const account = accountFor(authProfile, testInfo.parallelIndex);

        // A pooled profile gives this worker its own account, so nothing to serialise.
        if (!isSingleAccountProfile(authProfile)) {
            await use(account);
            return;
        }

        // One login for every worker: hold it for the whole test so tests using this
        // profile take turns, wherever they live. Other profiles keep running around it.
        const lock = await acquireAccountLock(account, testInfo.title);

        // Waiting for the turn must not come out of the test's own budget - without
        // this the queue eats the timeout and the LAST test in it fails, not the slow one.
        if (lock.waitedMs > 0) {
            testInfo.setTimeout(testInfo.timeout + lock.waitedMs);
        }

        try {
            await use(account);
        } finally {
            lock.release();
        }
    },

    // Override Playwright's built-in storageState so it is resolved per worker:
    // each worker replays its own account's session (pool[parallelIndex]), so no
    // two concurrent workers share one session file.
    storageState: async ({ authAccount }, use) => {
        if (!authAccount) {
            await use(undefined);
            return;
        }

        await use(authStatePath(authAccount.profile, authAccount.accountNumber));
    },
};
