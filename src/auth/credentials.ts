export const COMPANY_PROFILE = {
    AGENT: 'AGENT',
    IMPORTER: 'IMPORTER',
    HAULIER: 'HAULIER',
    PRIMARY_HOLDER: 'PRIMARY_HOLDER',
    NON_PRIMARY_HOLDER: 'NON_PRIMARY_HOLDER',

    /**
     * The pool the auth suite signs in as - ordinary users of a company, held apart
     * from the profiles above because what they are FOR is different: the others say
     * what capacity a declaration is made in, this one only has to be an account that
     * can sign in.
     *
     * A pool rather than one account, and that is the whole point. Every auth test
     * signs in, several deliberately sign in WRONG, and the identity provider locks
     * an account after ten failures without a success between them - so one shared
     * account has to be driven one worker at a time. With an account per worker the
     * failures land on separate counters and the suite can run in parallel again.
     *
     * PRIMARY_HOLDER cannot be pooled: a company has exactly one account holder, so
     * there is nothing to make more of. Only the permissions spec needs that account
     * to BE the holder; every other test just needed somewhere to sign in.
     */
    AUTH_ACCOUNT: 'AUTH_ACCOUNT',

    /**
     * A SECOND agent company, unrelated to AGENT.
     *
     * The authority tests need two agents to ask their question at all: whether a
     * declaration one company made is readable, editable or invisible to another.
     * One agent can only ever be asked about its own work.
     */
    AGENT_B: 'AGENT_B',
} as const;

/**
 * The company profile a test signs in as. Multiple users can belong to the same
 * profile (e.g. several users acting as an Agent), so this identifies the
 * company/capacity, not an individual user.
 */
export type CompanyProfile = typeof COMPANY_PROFILE[keyof typeof COMPANY_PROFILE];

/** The login of one user belonging to a company profile. */
export interface UserCredentials {
    profile: CompanyProfile;
    /**
     * 1-based position in the profile's account pool (AGENT_USER_NAME_1, _2, …).
     * Undefined for a single-account profile that uses the unindexed vars. It
     * selects the account's cached-session file — see authStatePath.
     */
    accountNumber?: number;
    username: string;
    password: string;
    totpSecret?: string;
    eori?: string;
}

/**
 * The profiles signed in when AUTH_PROFILES is not set: every company the suite
 * actually runs as, so the common command (all of tests/functional) works with
 * nothing extra to remember.
 *
 *
 * AUTH_PROFILES narrows this list, so a targeted run can still leave it out.
 */
const DEFAULT_AUTH_PROFILES: CompanyProfile[] = [
    COMPANY_PROFILE.AGENT,
    COMPANY_PROFILE.IMPORTER,
    COMPANY_PROFILE.HAULIER,
];

/**
 * Which company profiles this run signs in.
 *
 * AUTH_PROFILES NARROWS the default above for a targeted run whose specs need
 * fewer companies - a @smoke run selects no IMPORTER spec, so:
 *
 *     AUTH_PROFILES=AGENT
 *
 * Lives here rather than next to the sign-in code because the test workers read
 * it too, and they must not pull a browser-launching module in just to do so.
 */
/**
 * Profiles signed in on FIRST USE rather than in globalSetup.
 *
 * Deliberately outside the default list, not missing from it. AGENT_B appears in one
 * authority test; signing it in on every run would spend a login, and an expired
 * password on it would block suites that never mention it.
 *
 * UNDER SUSPICION as of 2026-09-02: the only two tests that used this path both failed
 * waiting for the portal sign-in link in the browser it launches - HAULIER was moved to
 * the default list and stopped failing that way. AGENT_B is still here, so if its test
 * keeps failing at `a[href$='/oauth']`, the mechanism is the suspect, not the account.
 */
const ON_DEMAND_PROFILES: ReadonlySet<CompanyProfile> = new Set([
    COMPANY_PROFILE.AGENT_B,
]);

/** True when this profile is signed in on first use rather than in globalSetup. */
export function isOnDemandProfile(profile: CompanyProfile): boolean {
    return ON_DEMAND_PROFILES.has(profile);
}

/**
 * Profiles whose session can hold a representation.
 *
 * AGENT belongs here first: it is the profile every journey spec represents with, and
 * leaving it out made the reset below a no-op for exactly the tests that needed it -
 * a representation then survived into the next test on that account, which declared
 * under the wrong company and was rejected with "Declarant EORI: Not provided".
 */
const REPRESENTING_PROFILES: ReadonlySet<CompanyProfile> = new Set([
    COMPANY_PROFILE.AGENT,
    COMPANY_PROFILE.AGENT_B,
]);

/**
 * True when this profile can act on another company's behalf - i.e. its session can
 * carry a representation that outlives the test that started it.
 *
 * Read by the representation-reset fixture, which clears that state before every test.
 * An importer has no agent banner to clear, so asking here is what keeps the fixture a
 * no-op for every other profile instead of navigating pointlessly.
 */
export function canRepresentTraders(profile: CompanyProfile): boolean {
    return REPRESENTING_PROFILES.has(profile);
}

/**
 * Refuse to use a profile this run did not sign in.
 *
 * globalSetup only signs in the profiles AUTH_PROFILES asks for. Playwright loads a
 * stale or absent storageState without complaint, so a test wanting another one would
 * replay an expired session and die much later on an unexpected sign-in screen, far
 * from the real cause.
 *
 * `howAsked` names which of the two routes got here - a spec's test.use({ authProfile }),
 * or a test opening a second company's session - so the reader knows where to look.
 */
export function assertProfileAuthenticated(profile: CompanyProfile, howAsked: string): void {
    // An on-demand profile has no session until a test asks for one, and asking is what
    // creates it - so a missing one here is the normal case, not a stale-file hazard.
    if (isOnDemandProfile(profile)) return;

    const authenticated = profilesToAuthenticate();

    if (authenticated.includes(profile)) return;

    throw new Error(
        `${howAsked} ${profile}, but this run only signed in: ${authenticated.join(', ')}. ` +
        `Any ${profile} session on disk is left over from an earlier run and would be replayed ` +
        `expired. Include the profile:\n\n` +
        `    AUTH_PROFILES=${[...authenticated, profile].join(',')}\n\n` +
        `If every run needs it, add it to DEFAULT_AUTH_PROFILES in src/auth/credentials.ts instead.`
    );
}

export function profilesToAuthenticate(): CompanyProfile[] {
    const raw = process.env.AUTH_PROFILES?.trim();

    if (!raw) return DEFAULT_AUTH_PROFILES;

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
 * Whether this environment has an account for the profile at all.
 *
 * Asked by the specs that only apply where a profile exists - the authority and
 * permission ones, which sign in as a primary account holder that not every environment
 * has. They skip on the answer, at describe level, so nothing is built for a test that
 * will not run.
 *
 * Lives beside getCredentials because that is what already owns the convention: the
 * env key IS derived from the profile name, so nothing else has to know it and no
 * caller can pass a key that belongs to a different profile.
 *
 * Playwright-free, like the rest of this file - see profilesToAuthenticate.
 */
export function isProfileConfigured(profile: CompanyProfile): boolean {
    // Either shape counts. A pooled profile declares AUTH_ACCOUNT_USER_NAME_1 and no
    // unindexed key at all, so checking only the unindexed one would report a fully
    // configured pool as missing - and every test that guards on this would skip,
    // quietly, on an environment that can run them.
    return Boolean(
        process.env[`${profile}_USER_NAME`]?.trim()
        || process.env[`${profile}_USER_NAME_1`]?.trim()
    );
}

export function getCredentials(profile: CompanyProfile): UserCredentials {
    const username = process.env[`${profile}_USER_NAME`]?.trim();
    const password = process.env[`${profile}_PASSWORD`]?.trim();

    if (!username || !password) {
        throw new Error(
            `Missing credentials for company profile "${profile}". ` +
            `Set ${profile}_USER_NAME and ${profile}_PASSWORD in .env.${process.env.ENV ?? '<env>'}.`
        );
    }

    return {
        profile,
        username,
        password,
        totpSecret: process.env[`${profile}_TOTP_SECRET`]?.trim() || undefined,
        eori: process.env[`${profile}_EORI`]?.trim() || undefined,
    };
}


export function getCredentialsPool(profile: CompanyProfile): UserCredentials[] {
    const pool: UserCredentials[] = [];

    for (let n = 1; ; n++) {
        const username = process.env[`${profile}_USER_NAME_${n}`]?.trim();
        if (!username) break;
        pool.push(readPoolAccount(profile, n, username));
    }

    return pool.length > 0 ? pool : [getCredentials(profile)];
}

function readPoolAccount(
    profile: CompanyProfile,
    accountNumber: number,
    username: string
): UserCredentials {
    const field = (name: string): string | undefined =>
        process.env[`${profile}_${name}_${accountNumber}`]?.trim()
        || process.env[`${profile}_${name}`]?.trim()
        || undefined;

    const password = field('PASSWORD');

    if (!password) {
        throw new Error(
            `Missing password for ${profile} account ${accountNumber}. Set ` +
            `${profile}_PASSWORD_${accountNumber} (or a shared ${profile}_PASSWORD) ` +
            `in .env.${process.env.ENV ?? '<env>'}.`
        );
    }

    return {
        profile,
        accountNumber,
        username,
        password,
        totpSecret: field('TOTP_SECRET'),
        eori: field('EORI'),
    };
}


/**
 * True when the profile has a single login that every worker is handed. Its tests
 * cannot run concurrently, so they take turns on the account lock - see the
 * authAccount fixture.
 */
export function isSingleAccountProfile(profile: CompanyProfile): boolean {
    return getCredentialsPool(profile).length === 1;
}

export function accountFor(profile: CompanyProfile, parallelIndex: number): UserCredentials {
    const pool = getCredentialsPool(profile);

    if (pool.length === 1) {
        return pool[0];
    }

    if (parallelIndex >= pool.length) {
        throw new Error(
            `No ${profile} account for parallel worker ${parallelIndex}: only ${pool.length} account(s) ` +
            `are defined, but more ran concurrently. Run with --workers<=${pool.length}, ` +
            `or add more ${profile}_USER_NAME_<n> accounts in .env.${process.env.ENV ?? '<env>'}.`
        );
    }

    return pool[parallelIndex];
}
