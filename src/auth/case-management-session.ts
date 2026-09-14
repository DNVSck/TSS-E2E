import { request, APIRequestContext, Cookie } from '@playwright/test';
import { formAction, hiddenFields, hasField } from '../helper/html-form-helper';
import {
    CASE_MANAGEMENT_HOST, CASE_MANAGEMENT_USER_NAME, CASE_MANAGEMENT_PASSWORD, ENV,
    assertEnvSet,
} from '../../config/environment';

const APP_PATH = '/businessapplication/';

const SIGN_IN_TIMEOUT_MS = 60_000;

const MAX_REDIRECT_FORMS = 6;

const XSRF_COOKIE = 'XSRF-TOKEN';
const SESSION_COOKIE = 'JSESSIONID';

type StorageState = Awaited<ReturnType<APIRequestContext['storageState']>>;

export interface CaseManagementSession {
    readonly storageState: StorageState;
    readonly xsrfToken: string;
}

export async function caseManagementSession(): Promise<CaseManagementSession> {
    assertCredentialsPresent();

    const context = await request.newContext({ timeout: SIGN_IN_TIMEOUT_MS });

    try {
        const storageState = await followSignIn(context);
        return { storageState, xsrfToken: readXsrfToken(storageState.cookies) };
    } finally {
        await context.dispose();
    }
}

async function followSignIn(context: APIRequestContext): Promise<StorageState> {
    const taken: string[] = [];

    let response = await context.get(`${CASE_MANAGEMENT_HOST}${APP_PATH}`);
    let html = await response.text();

    for (let step = 1; step <= MAX_REDIRECT_FORMS; step++) {
        const action = formAction(html);
        const fields = hiddenFields(html);

        if (action && hasField(html, 'password')) {
            taken.push('credentials');
            response = await context.post(action, {
                form: {
                    ...fields,
                    username: CASE_MANAGEMENT_USER_NAME,
                    password: CASE_MANAGEMENT_PASSWORD,
                },
            });
        } else if (action && (fields.SAMLRequest || fields.SAMLResponse)) {
            taken.push(fields.SAMLRequest ? 'SAMLRequest' : 'SAMLResponse');
            response = await context.post(action, { form: fields });
        } else {
            break;
        }

        html = await response.text();
    }

    const storageState = await context.storageState();

    if (!storageState.cookies.some(cookie => cookie.name === SESSION_COOKIE)) {
        throw new Error(
            `Case management: sign-in on "${ENV}" did not reach the app. Steps taken: `
            + `${taken.join(' -> ') || 'none'}. Expected SAMLRequest -> credentials -> `
            + `SAMLResponse. It stopped at ${response.status()} ${response.url()}, so the `
            + `identity provider is asking for something this does not answer - check `
            + `CASE_MANAGEMENT_USER_NAME / CASE_MANAGEMENT_PASSWORD in .env.${ENV}, and `
            + `whether the realm has added a step.`
        );
    }

    return storageState;
}

function assertCredentialsPresent(): void {
    assertEnvSet(
        { CASE_MANAGEMENT_USER_NAME, CASE_MANAGEMENT_PASSWORD },
        'Cannot sign in to case management',
        'Every call to that service is made as an administrator, so nothing can be '
        + 'asked of it without one.'
    );
}

function readXsrfToken(cookies: Cookie[]): string {
    const token = cookies.find(cookie => cookie.name === XSRF_COOKIE)?.value;

    if (!token) {
        throw new Error(
            `Case management: signed in but no ${XSRF_COOKIE} cookie was set, so no request `
            + `can be authorised. The sign-in probably did not complete.`
        );
    }

    return decodeURIComponent(token);
}
