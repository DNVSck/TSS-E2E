import * as fs from 'node:fs';
import * as path from 'node:path';
import { AUTH_REUSE_SESSION, ENV } from '../../../config/environment';
import { CompanyProfile } from './credentials';

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
    if (!AUTH_REUSE_SESSION) return false;

    const file = authStatePath(profile, accountNumber);

    if (!fs.existsSync(file)) return false;

    const ageMinutes = (Date.now() - fs.statSync(file).mtimeMs) / 60_000;
    return ageMinutes < AUTH_STATE_TTL_MINUTES;
}
