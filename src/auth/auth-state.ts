import * as fs from 'node:fs';
import * as path from 'node:path';
import { AUTH_REUSE_SESSION, ENV } from '../../config/environment';
import { CompanyProfile, accountFor, assertProfileAuthenticated } from './credentials';

/**
 * Where the signed-in browser state (cookies + localStorage) is cached.
 *
 * A TOTP code is derived from `(secret, floor(now / 30s))`, so two sign-ins of
 * the same account inside one 30-second window produce the *same* code — and
 * Keycloak rejects a reused code. Signing in once and replaying the saved state
 * avoids the collision entirely, whatever the worker count.
 *
 * These files hold live session cookies: treat them as credentials. The
 * directory is already covered by .gitignore (`/playwright/.auth/`).
 */
export const AUTH_STATE_DIR = path.join('playwright', '.auth');

/**
 * How long a cached session is trusted, when reuse is opted into via
 * AUTH_REUSE_SESSION. Kept comfortably below Keycloak's default 30-minute SSO
 * idle timeout so a run never starts with a session about to expire mid-suite.
 */
export const AUTH_STATE_TTL_MINUTES = 15;

/**
 * Sessions are cached per environment. Without this, switching `ENV=sit` to
 * `ENV=dev` inside the TTL would replay a SIT cookie against DEV: the cookie's
 * domain would not match, the request would go out unauthenticated, and the test
 * would fail on some arbitrary screen far from the real cause.
 */
export function authStatePath(profile: CompanyProfile, accountNumber?: number): string {
    // One file per account so pooled workers never share a session file. The
    // unindexed form (accountNumber undefined) keeps the legacy single-account
    // name — `AGENT.json`, not `AGENT-1.json` — so nothing else has to change.
    const name = accountNumber === undefined ? `${profile}` : `${profile}-${accountNumber}`;
    return path.join(AUTH_STATE_DIR, ENV, `${name}.json`);
}

/**
 * True when a cached session may be reused instead of signing in again.
 *
 * Always false unless AUTH_REUSE_SESSION is set: by default every run performs
 * exactly one real sign-in, so the login journey is exercised each run and no
 * run inherits a stale session.
 */
export function isAuthStateFresh(profile: CompanyProfile, accountNumber?: number): boolean {
    return AUTH_REUSE_SESSION && isSessionYoungEnough(profile, accountNumber);
}

/**
 * Whether a session file exists and is young enough to replay - WITHOUT asking whether
 * reuse was opted into.
 *
 * The distinction matters for an on-demand profile (see ON_DEMAND_PROFILES). Those are
 * signed in by the first test that needs one, not by globalSetup, so "sign in once per
 * run" cannot be arranged up front - it has to be decided at the moment of use. Every
 * later test in the same run finds the file this one wrote and replays it, which is the
 * behaviour AUTH_REUSE_SESSION exists to give the OTHER profiles. Turning that flag on
 * for the whole suite to get it here would also start reusing sessions across runs,
 * which is exactly what the default refuses to do.
 */
export function isSessionYoungEnough(profile: CompanyProfile, accountNumber?: number): boolean {
    const file = authStatePath(profile, accountNumber);

    if (!fs.existsSync(file)) return false;

    const ageMinutes = (Date.now() - fs.statSync(file).mtimeMs) / 60_000;
    return ageMinutes < AUTH_STATE_TTL_MINUTES;
}

/**
 * The session file a company profile resolves to for one worker.
 *
 * The rule every caller must obey, and the reason it lives here rather than inside a
 * fixture: a pooled profile stores a file per account (`AGENT-2.json`) while a
 * single-login profile stores one unindexed file (`HAULIER.json`), so the name cannot
 * be derived from the profile alone. Guessing it does not fail - it quietly picks up
 * whatever an earlier run left on disk, and the test dies much later on an unexpected
 * sign-in screen. That happened once, which is why this exists.
 *
 * Takes a worker index rather than a TestInfo so the rule stays free of Playwright.
 */
export function sessionFor(profile: CompanyProfile, parallelIndex: number): string {
    assertProfileAuthenticated(profile, 'This test signs in as');
    const account = accountFor(profile, parallelIndex);
    return authStatePath(account.profile, account.accountNumber);
}
