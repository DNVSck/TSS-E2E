import { test } from '@playwright/test';
import {
    CompanyProfile, UserCredentials, accountFor, assertProfileAuthenticated,
} from '../auth/credentials';
import { authStatePath } from '../auth/auth-state';
import { signInOnDemand, SignInScreenshotError, SIGN_IN_FAILURE_ATTACHMENT } from '../auth/ensure-auth-state';

export type WorkerAuthFixtureType = {
    /**
     * Which company profile this spec runs as — the single knob a spec sets:
     *
     *     test.use({ authProfile: COMPANY_PROFILE.AGENT });
     *
     * It picks this worker's account from the profile's pool and replays that
     * account's cached session, so no two concurrent workers share one session.
     *
     * A profile whose pool holds ONE login has no second account to hand out, so its
     * tests must not run at the same time. That is declared, not derived - the spec
     * names a lock beside the profile:
     *
     *     test.describe('...', { lock: COMPANY_PROFILE.IMPORTER }, () => {
     *         test.use({ authProfile: COMPANY_PROFILE.IMPORTER });
     *
     * The profile name IS the lock name, so there is one string to agree on and no
     * table mapping one to the other. Nothing here can check it: a lock is declared
     * when tests are collected and TestInfo does not carry it, so a spec that runs as
     * a single-login profile and forgets the lock will quietly run twice at once.
     * Giving the profile a pool removes the question rather than answering it.
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
        if (!authProfile) {
            await use(null);
            return;
        }

        assertProfileAuthenticated(authProfile, 'This spec runs as');

        // Nothing queues here. A profile whose pool holds one login cannot be run by
        // two workers at once, and a spec says so by declaring a named lock - see the
        // note on authProfile. The runner refuses to START two tests sharing a lock
        // name, so the wait happens in the scheduler instead of inside a fixture,
        // where it used to hold a worker idle long enough for its session to expire.
        await use(accountFor(authProfile, testInfo.parallelIndex));
    },

    // Override Playwright's built-in storageState so it is resolved per worker:
    // each worker replays its own account's session (pool[parallelIndex]), so no
    // two concurrent workers share one session file.
    storageState: async ({ authAccount }, use, testInfo) => {
        if (!authAccount) {
            await use(undefined);
            return;
        }

        // Renew a session that aged out mid-run, rather than replaying a dead one.
        // globalSetup signs in once at t=0 and every test replays the file it wrote,
        // so a run longer than the identity provider's idle window reaches its later
        // tests signed out - which surfaces as the portal home never offering "Start
        // a new declaration", naming a locator that was never the problem.
        //
        // Two workers must never renew ONE account at the same moment: a TOTP code is
        // bound to a 30-second window, so both would submit the same code and the
        // second is rejected. What prevents it is the lock a single-login profile's
        // spec declares - the runner will not start two such tests concurrently - so
        // the safety of this line lives in the spec, not here.
        let signInMs: number;
        try {
            signInMs = await signInOnDemand(authAccount.profile, testInfo.parallelIndex);
        } catch (error) {
            if (error instanceof SignInScreenshotError && error.screenshot) {
                await testInfo.attach(SIGN_IN_FAILURE_ATTACHMENT, { body: error.screenshot, contentType: 'image/png' });
            }
            throw error;
        }

        // Signing in must not come out of the test's own budget, for the same reason
        // queueing must not - see the note above. Nothing is added when the session
        // was still young, because nothing was spent.
        if (signInMs > 0 && testInfo.timeout > 0) {
            testInfo.setTimeout(testInfo.timeout + signInMs);
        }

        await use(authStatePath(authAccount.profile, authAccount.accountNumber));
    },
};
