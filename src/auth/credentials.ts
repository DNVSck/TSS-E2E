export const COMPANY_PROFILE = {
    AGENT: 'AGENT',
    IMPORTER: 'IMPORTER',
    HAULIER: 'HAULIER',
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
 * HAULIER is left out deliberately - no spec runs as one yet, and signing into an
 * account no test uses costs a login and lets an unrelated expired password block
 * the whole suite. Add a profile here the moment a spec starts using it; until
 * then the authAccount fixture fails fast and names the exact AUTH_PROFILES value.
 */
const DEFAULT_AUTH_PROFILES: CompanyProfile[] = [
    COMPANY_PROFILE.AGENT,
    COMPANY_PROFILE.IMPORTER,
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
