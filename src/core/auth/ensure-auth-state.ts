import { chromium } from '@playwright/test';
import { OTP_ENABLED, ENV } from '../../../config/environment';
import { PortalPage } from '../../page-object/portal-page';
import { SignInPage } from '../../page-object/sign-in-page';
import { authStatePath, isAuthStateFresh, AUTH_STATE_TTL_MINUTES } from './auth-state';
import { COMPANY_PROFILE, CompanyProfile, getCredentials } from './credentials';

const SIGN_IN_TIMEOUT_MS = 60_000;

/**
 * Profiles to sign in for this run.
 *
 * Only AGENT by default: signing into an account no test uses costs time and
 * lets an unrelated expired password block the whole suite. Widen it per run
 * when a test needs another company:
 *
 *     AUTH_PROFILES=AGENT,HAULIER
 */
export function profilesToAuthenticate(): CompanyProfile[] {
    const raw = process.env.AUTH_PROFILES?.trim();

    if (!raw) return [COMPANY_PROFILE.AGENT];

    const known = Object.values(COMPANY_PROFILE) as string[];
    const requested = raw.split(',').map(p => p.trim().toUpperCase());

    const unknown = requested.filter(p => !known.includes(p));
    if (unknown.length) {
        throw new Error(
            `AUTH_PROFILES contains unknown company profile(s): ${unknown.join(', ')}. ` +
            `Valid values: ${known.join(', ')}.`
        );
    }

    return requested as CompanyProfile[];
}

/**
 * Signs in once per requested profile and caches the browser state, so no test
 * ever performs an interactive sign-in.
 *
 * This runs in globalSetup rather than as a Playwright "setup project" so that a
 * successful sign-in does not appear as a passing test in the report. The cost:
 * no automatic trace/screenshot on failure, hence the explicit error below.
 *
 * By default every run signs in exactly once, so the login journey is exercised
 * each run. Set AUTH_REUSE_SESSION to skip it while a cached session is still
 * within its TTL — useful for a fast local edit-run loop.
 *
 * Re-running within 30 seconds is safe: generateFreshTotpCode waits for the next
 * TOTP window rather than replaying a code Keycloak has already seen.
 */
export async function ensureAuthState(): Promise<void> {
    const profiles = profilesToAuthenticate();
    const stale = profiles.filter(profile => !isAuthStateFresh(profile));

    if (stale.length === 0) {
        console.log(
            `Auth: AUTH_REUSE_SESSION is on — reusing cached "${ENV}" session for ` +
            `${profiles.join(', ')} (younger than ${AUTH_STATE_TTL_MINUTES} minutes).`
        );
        return;
    }

    const browser = await chromium.launch({
        headless: process.env.HEADLESS === 'true',
    });

    try {
        // Different profiles have different TOTP secrets, so signing them in one
        // after another inside the same 30-second window is safe.
        for (const profile of stale) {
            await signInAndSaveState(browser, profile);
        }
    } finally {
        await browser.close();
    }
}

async function signInAndSaveState(
    browser: Awaited<ReturnType<typeof chromium.launch>>,
    profile: CompanyProfile
): Promise<void> {
    const credentials = getCredentials(profile);

    if (OTP_ENABLED && !credentials.totpSecret) {
        throw new Error(
            `OTP_ENABLED is true but no TOTP secret is set for profile "${profile}". ` +
            `Set ${profile}_TOTP_SECRET in .env.${ENV}.`
        );
    }

    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        const portalPage = new PortalPage(page);
        const signInPage = new SignInPage(page);

        await page.goto(process.env.BASE_URL!);
        await portalPage.clickSignIn();
        await signInPage.signIn(credentials);

        if (OTP_ENABLED) {
            await signInPage.inputTotp(credentials.totpSecret!);
        }

        await portalPage.waitUntilSignedIn(SIGN_IN_TIMEOUT_MS);
        await context.storageState({ path: authStatePath(profile) });

        console.log(`Auth: signed in as ${profile} on "${ENV}".`);
    } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        const stuckOnAuthServer = page.url().includes('/realms/');

        throw new Error(
            `Auth: failed to sign in as ${profile} on "${ENV}" (${page.url()}).\n` +
            (stuckOnAuthServer
                ? 'The browser never left the identity provider, so a credential was rejected. '
                : '') +
            `Check ${profile}_USER_NAME / ${profile}_PASSWORD` +
            `${OTP_ENABLED ? ` / ${profile}_TOTP_SECRET` : ''} in .env.${ENV}.\n` +
            `Underlying error: ${reason}`
        );
    } finally {
        await context.close();
    }
}
