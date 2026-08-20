export const COMPANY_PROFILE = {
    AGENT: 'AGENT',
    /** A SECOND agent company, unrelated to AGENT - see defaultAuthProfiles. */
    AGENT_B: 'AGENT_B',
    IMPORTER: 'IMPORTER',
    HAULIER: 'HAULIER',
    PRIMARY_HOLDER: 'PRIMARY_HOLDER',
    NON_PRIMARY_HOLDER: 'NON_PRIMARY_HOLDER',
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
 * Each one costs a real sign-in per run and, if its password expires, blocks the
 * whole suite rather than only the specs that use it. So a profile earns its place
 * here by being needed, and is added when a spec starts using it - not before.
 *
 * HAULIER left on 2026-08-19: an integrated declaration no longer needs the Agent to
 * act for it, and the permission rules stopped naming it, so nothing signs in as one.
 * Its EORI is still test DATA - see rejectedByCds, which uses an EORI that is simply not
 * the importer's - but no session is opened for it.
 *
 * AGENT_B is NOT here, and not by omission - see ON_DEMAND_PROFILES below.
 */
function defaultAuthProfiles(): CompanyProfile[] {
    return [
        COMPANY_PROFILE.AGENT,
        COMPANY_PROFILE.IMPORTER,
    ];
}


const ON_DEMAND_PROFILES: ReadonlySet<CompanyProfile> = new Set([
    COMPANY_PROFILE.AGENT_B,
]);

/** True when this profile is signed in on first use rather than in globalSetup. */
export function isOnDemandProfile(profile: CompanyProfile): boolean {
    return ON_DEMAND_PROFILES.has(profile);
}


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


export function isProvisioned(profile: CompanyProfile): boolean {
    return Boolean(
        process.env[`${profile}_USER_NAME`]?.trim()
        || process.env[`${profile}_USER_NAME_1`]?.trim()
    );
}

/**
 * Refuse to use a profile this run did not sign in.
 *
 * globalSetup only signs in the profiles AUTH_PROFILES asks for. Playwright loads a
 * stale or absent storageState without complaint, so a test wanting another one would
 * replay an expired session and die much later on an unexpected sign-in screen, far
 * from the real cause.
 *
 * Lives here, next to the list it guards, because there are two ways to ask for a
 * profile and both need the same answer: a spec's `test.use({ authProfile })`, and a
 * test opening a second company's session. `howAsked` is the only thing that differs -
 * it names which of the two got here, so the reader knows where to look.
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
        `If every run needs it, add it to defaultAuthProfiles() in src/auth/credentials.ts instead.`
    );
}

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
export function profilesToAuthenticate(): CompanyProfile[] {
    const raw = process.env.AUTH_PROFILES?.trim();

    if (!raw) return defaultAuthProfiles();

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
