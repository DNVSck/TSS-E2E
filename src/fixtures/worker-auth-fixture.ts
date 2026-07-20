import { test } from '@playwright/test';
import { CompanyProfile, UserCredentials, accountFor } from '../core/auth/credentials';
import { authStatePath } from '../core/auth/auth-state';

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

type ExtendParams = Parameters<typeof test.extend<WorkerAuthFixtureType>>;

export const workerAuthFixture: ExtendParams[0] = {
    authProfile: [null as CompanyProfile | null, { option: true }],

    // Resolve authProfile to this worker's assigned account once, so storageState
    // and reporting share a single source of truth (pool[parallelIndex]).
    authAccount: async ({ authProfile }, use, testInfo) => {
        const account = authProfile ? accountFor(authProfile, testInfo.parallelIndex) : null;
        await use(account);
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
