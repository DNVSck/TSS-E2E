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


export function accountFor(profile: CompanyProfile, parallelIndex: number): UserCredentials {
    const pool = getCredentialsPool(profile);

    if (parallelIndex >= pool.length) {
        throw new Error(
            `No ${profile} account for parallel worker ${parallelIndex}: only ${pool.length} account(s) ` +
            `are defined, but more ran concurrently. Run with --workers<=${pool.length}, ` +
            `or add more ${profile}_USER_NAME_<n> accounts in .env.${process.env.ENV ?? '<env>'}.`
        );
    }

    return pool[parallelIndex];
}
