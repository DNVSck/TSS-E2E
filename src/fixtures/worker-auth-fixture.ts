import { test } from '@playwright/test';
import { CompanyProfile, accountFor } from '../core/auth/credentials';
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
};

type ExtendParams = Parameters<typeof test.extend<WorkerAuthFixtureType>>;

export const workerAuthFixture: ExtendParams[0] = {
    authProfile: [null as CompanyProfile | null, { option: true }],

    // Override Playwright's built-in storageState so it is resolved per worker:
    // each worker replays its own account's session (pool[parallelIndex]), so no
    // two concurrent workers share one session file.
    storageState: async ({ authProfile }, use, testInfo) => {
        if (!authProfile) {
            await use(undefined);
            return;
        }

        const account = accountFor(authProfile, testInfo.parallelIndex);
        await use(authStatePath(authProfile, account.accountNumber));
    },
};
