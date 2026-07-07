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
