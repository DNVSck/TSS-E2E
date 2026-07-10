import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import OTPAuth from 'otpauth';

export interface TotpOptions {
    digits?: number;
    periodSeconds?: number;
    issuer?: string;
    label?: string;
}

const DEFAULT_PERIOD_SECONDS = 30;

/** A code produced with less than this left in its window can expire mid-submit. */
const MIN_REMAINING_SECONDS = 3;

/**
 * Records the last TOTP window each secret was used in, keyed by a hash of the
 * secret so the secret itself never touches disk.
 *
 * It lives outside `playwright/.auth/<ENV>/` on purpose: that directory holds
 * per-environment session state, while this file must survive across runs and
 * environments for the replay guard below to work.
 */
const USED_WINDOWS_FILE = path.join('playwright', '.auth', '.totp-windows.json');

/**
 * Generate a TOTP code from the given base32 secret.
 * The secret is passed in (not read from a global env var) so the code always
 * matches the account currently signing in.
 */
export function generateTotpCode(secret: string, options: TotpOptions = {}): string {
    const trimmed = secret?.trim();

    if (!trimmed) {
        throw new Error('A TOTP secret is required to generate a code.');
    }

    const totp = new OTPAuth.TOTP({
        issuer: options.issuer,
        label: options.label,
        algorithm: 'SHA1',
        digits: options.digits ?? 6,
        period: options.periodSeconds ?? DEFAULT_PERIOD_SECONDS,
        secret: OTPAuth.Secret.fromBase32(trimmed)
    });

    return totp.generate();
}

function currentWindow(period: number): number {
    return Math.floor(Date.now() / 1000 / period);
}

/** Seconds left before the current TOTP window rolls over. */
function secondsLeftInWindow(period: number): number {
    return period - (Math.floor(Date.now() / 1000) % period);
}

function secretKey(secret: string): string {
    return crypto.createHash('sha256').update(secret.trim()).digest('hex').slice(0, 16);
}

function readUsedWindows(): Record<string, number> {
    try {
        return JSON.parse(fs.readFileSync(USED_WINDOWS_FILE, 'utf8'));
    } catch {
        return {};
    }
}

function writeUsedWindow(key: string, window: number): void {
    const windows = readUsedWindows();
    windows[key] = window;

    fs.mkdirSync(path.dirname(USED_WINDOWS_FILE), { recursive: true });
    fs.writeFileSync(USED_WINDOWS_FILE, JSON.stringify(windows), 'utf8');
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Produce a TOTP code that Keycloak will accept.
 *
 * A code is `f(secret, floor(now / 30s))`, and Keycloak rejects a code it has
 * already seen. Two sign-ins of the same account whose codes fall in the same
 * 30-second window therefore generate the identical code, and the second one
 * hangs on the OTP screen until it times out. That is easy to hit when you
 * re-run the suite moments after the previous run.
 *
 * So this waits for the next window when either:
 *   - this secret already produced a code in the current window, or
 *   - the current window is about to roll over mid-submit.
 *
 * The wait is at most one window (30s) and only happens on a rapid re-run.
 */
export async function generateFreshTotpCode(
    secret: string,
    options: TotpOptions = {}
): Promise<string> {
    const period = options.periodSeconds ?? DEFAULT_PERIOD_SECONDS;
    const key = secretKey(secret);
    const lastUsedWindow = readUsedWindows()[key];

    const alreadyUsed = lastUsedWindow === currentWindow(period);
    const aboutToExpire = secondsLeftInWindow(period) < MIN_REMAINING_SECONDS;

    if (alreadyUsed || aboutToExpire) {
        const waitSeconds = secondsLeftInWindow(period);
        console.log(
            alreadyUsed
                ? `TOTP: this code was already used; waiting ${waitSeconds}s for the next window.`
                : `TOTP: window expires in ${waitSeconds}s; waiting for the next one.`
        );
        await sleep(waitSeconds * 1000);
    }

    writeUsedWindow(key, currentWindow(period));
    return generateTotpCode(secret, options);
}
