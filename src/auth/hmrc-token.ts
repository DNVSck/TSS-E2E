import { Browser, request } from '@playwright/test';
import { AccessToken, TokenResponse, issuedToken, tokenRefusal } from './portal-token';
import { HmrcAuthorisationPage } from '../page-object/hmrc-authorisation-page';
import { StringUtil } from '../core/util/string-util';
import {
    HMRC_API_URL, HMRC_AUTHORIZE_URL, HMRC_CLIENT_ID, HMRC_CLIENT_SECRET, HMRC_REDIRECT_URI, HMRC_SCOPE,
    HMRC_TEST_USER_ID, HMRC_TEST_USER_PASSWORD, ENV, assertEnvSet,
} from '../../config/environment';

const TOKEN_TIMEOUT_MS = 30_000;

const TOKEN_PATH = 'oauth/token';

const CODE_PARAMETER = 'code';

const ERROR_PARAMETER = 'error';

export async function hmrcToken(browser: Browser): Promise<AccessToken> {
    assertConfigured();

    const code = await authorisationCode(browser);
    const context = await request.newContext({ timeout: TOKEN_TIMEOUT_MS });

    try {
        const response = await context.post(`${StringUtil.stripTrailingSlashes(HMRC_API_URL)}/${TOKEN_PATH}`, {
            form: {
                grant_type: 'authorization_code',
                code,
                client_id: HMRC_CLIENT_ID,
                client_secret: HMRC_CLIENT_SECRET,
                redirect_uri: HMRC_REDIRECT_URI,
            },
        });
        const body: TokenResponse = await response.json().catch(() => ({}));

        const token = issuedToken(response, body);
        if (!token) {
            throw new Error(
                `HMRC token: exchanging the authorisation code failed on "${ENV}" - `
                + `${tokenRefusal(response, body)}. `
                + `"invalid_client" means HMRC_CLIENT_ID / HMRC_CLIENT_SECRET were refused; `
                + `"invalid_request" or "invalid_grant" means the code or HMRC_REDIRECT_URI was - `
                + `check them in .env.${ENV}.`
            );
        }

        return token;
    } finally {
        await context.dispose();
    }
}

async function authorisationCode(browser: Browser): Promise<string> {
    const context = await browser.newContext({ storageState: undefined });

    try {
        const authorisation = new HmrcAuthorisationPage(await context.newPage());
        await authorisation.open(authorizeUrl());
        await authorisation.signIn(HMRC_TEST_USER_ID, HMRC_TEST_USER_PASSWORD);
        const redirect = await authorisation.givePermission(HMRC_REDIRECT_URI);

        const code = redirect.searchParams.get(CODE_PARAMETER);
        if (!code) {
            const error = redirect.searchParams.get(ERROR_PARAMETER) ?? 'none given';
            throw new Error(
                `HMRC sign-in: granting authority redirected without a code on "${ENV}" `
                + `(error: ${error}). `
                + `Check HMRC_TEST_USER_ID / HMRC_TEST_USER_PASSWORD and HMRC_SCOPE in .env.${ENV}.`
            );
        }

        return code;
    } finally {
        await context.close();
    }
}

function authorizeUrl(): string {
    const url = new URL(HMRC_AUTHORIZE_URL);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', HMRC_CLIENT_ID);
    url.searchParams.set('scope', HMRC_SCOPE);
    url.searchParams.set('redirect_uri', HMRC_REDIRECT_URI);
    return url.toString();
}

function assertConfigured(): void {
    assertEnvSet(
        {
            HMRC_API_URL, HMRC_AUTHORIZE_URL, HMRC_CLIENT_ID, HMRC_CLIENT_SECRET, HMRC_REDIRECT_URI, HMRC_SCOPE,
            HMRC_TEST_USER_ID, HMRC_TEST_USER_PASSWORD,
        },
        'Cannot get an HMRC API token',
        'The token is user-restricted, so the HMRC test user signs in to grant it.'
    );
}
