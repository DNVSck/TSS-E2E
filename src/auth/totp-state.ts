import { expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { AUTH_STATE_DIR } from './auth-state';
import { DEFAULT_PERIOD_SECONDS, generateTotpCode } from '../core/util/totp-auth';

/**
 * Which code each secret last spent, remembered across processes.
 *
 * A code is spendable once, and that is a fact about the ACCOUNT, not about the
 * process that spent it. globalSetup signs in through the browser in the main
 * process; the workers mint API tokens in their own. A module-level Map cannot be
 * seen across that boundary, so a worker starting inside the same thirty-second
 * window replayed the code globalSetup had just consumed and Keycloak refused it.
 *
 * Beside the session files rather than in core/util: generating a code is arithmetic
 * and belongs there, but remembering what an account has spent is credential state,
 * which this directory already owns.
 */
const SPENT_CODE_DIR = path.join(AUTH_STATE_DIR, '.totp');

const NEXT_WINDOW_TIMEOUT = DEFAULT_PERIOD_SECONDS * 1_000 + 15_000;

function spentCodeFile(secret: string): string {
    const key = createHash('sha256').update(secret).digest('hex').slice(0, 16);

    return path.join(SPENT_CODE_DIR, key);
}

function readSpentCode(secret: string): string | undefined {
    try {
        return fs.readFileSync(spentCodeFile(secret), 'utf8').trim() || undefined;
    } catch {
        return undefined;
    }
}

function recordSpentCode(secret: string, code: string): void {
    try {
        fs.mkdirSync(SPENT_CODE_DIR, { recursive: true });
        fs.writeFileSync(spentCodeFile(secret), code, 'utf8');
    } catch {
        // Best effort: a code that cannot be recorded costs one retry, not the run.
    }
}

/**
 * A code this estate has not already spent, waiting out the window if it has.
 */
export async function freshTotpCode(secret: string): Promise<string> {
    const spent = readSpentCode(secret);

    if (spent !== undefined) {
        await expect
            .poll(() => generateTotpCode(secret), { timeout: NEXT_WINDOW_TIMEOUT, intervals: [500] })
            .not.toBe(spent);
    }

    const code = generateTotpCode(secret);
    recordSpentCode(secret, code);

    return code;
}
