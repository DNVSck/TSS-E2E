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
