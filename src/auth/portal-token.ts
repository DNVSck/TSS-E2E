import { request } from '@playwright/test';
import { freshTotpCode } from './totp-state';
import { UserCredentials, accountEnvKey } from './credentials';
import {
    TRADER_API_TOKEN_URL, TRADER_API_CLIENT_ID, TRADER_API_CLIENT_SECRET,
    OTP_ENABLED, ENV, assertEnvSet,
} from '../../config/environment';

const TOKEN_TIMEOUT_MS = 30_000;

const TOKEN_SCOPE = 'openid roles';
/**
 * A minted token and the moment it stops being usable.
 *
 * The expiry is reported rather than assumed: it is the server that decides how long
 * a token lives, and a caller reusing one has to know when to stop.
 */
export interface PortalToken {
    accessToken: string;
    /** Epoch milliseconds. Already past when the server did not say. */
    expiresAt: number;
}

interface TokenResponse {
    access_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
}

export async function portalToken(account: UserCredentials): Promise<PortalToken> {
    assertClientConfigured();
    assertTotpSecretPresent(account);

    const context = await request.newContext({ timeout: TOKEN_TIMEOUT_MS });

    try {
        let response = await context.post(TRADER_API_TOKEN_URL, { form: await tokenForm(account) });
        let body: TokenResponse = await response.json();

        // A code refused at a window boundary is worth exactly one more try with the
        // next one. Anything else - a wrong password, a locked account - answers the
        // same way to every attempt, so retrying it only spends the lockout budget.
        if (body.error === 'invalid_grant' && account.totpSecret) {
            response = await context.post(TRADER_API_TOKEN_URL, { form: await tokenForm(account) });
            body = await response.json();
        }

        if (!response.ok() || !body.access_token) {
            const detail = body.error_description ? `: ${body.error_description}` : '';

            throw new Error(
                `Portal token: could not get one for ${account.username} on "${ENV}" - `
                + `${response.status()} ${body.error ?? response.statusText()}`
                + `${detail}. `
                + `"unauthorized_client" means TRADER_API_CLIENT_ID / TRADER_API_CLIENT_SECRET `
                + `do not match a client with direct access grants; "invalid_grant" means the `
                + `account's own credentials were refused - check `
                + `${accountEnvKey(account, 'USER_NAME')} / ${accountEnvKey(account, 'PASSWORD')} in .env.${ENV}.`
            );
        }

        return {
            accessToken: body.access_token,
            expiresAt: Date.now() + (body.expires_in ?? 0) * 1_000,
        };
    } finally {
        await context.dispose();
    }
}

async function tokenForm(account: UserCredentials): Promise<Record<string, string>> {
    const form: Record<string, string> = {
        grant_type: 'password',
        client_id: TRADER_API_CLIENT_ID,
        client_secret: TRADER_API_CLIENT_SECRET,
        username: account.username,
        password: account.password,
        scope: TOKEN_SCOPE,
    };

    if (account.totpSecret) {
        form.totp = await freshTotpCode(account.totpSecret);
    }

    return form;
}

function assertClientConfigured(): void {
    assertEnvSet(
        { TRADER_API_CLIENT_ID, TRADER_API_CLIENT_SECRET },
        'Cannot call the portal APIs',
        "The token is minted by the portal's own Keycloak client, so nothing can be "
        + 'asked of the API without it.'
    );
}

function assertTotpSecretPresent(account: UserCredentials): void {
    if (OTP_ENABLED && !account.totpSecret) {
        throw new Error(
            `OTP_ENABLED is true but no TOTP secret is set for ${account.username}, and the `
            + `token endpoint asks for the same second factor the sign-in screen does. `
            + `Set ${accountEnvKey(account, 'TOTP_SECRET')} in .env.${ENV}.`
        );
    }
}
