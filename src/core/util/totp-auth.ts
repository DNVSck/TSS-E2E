import OTPAuth from 'otpauth';
import { expect } from '@playwright/test';

export interface TotpOptions {
    digits?: number;
    periodSeconds?: number;
    issuer?: string;
    label?: string;
}

const DEFAULT_PERIOD_SECONDS = 30;

const NEXT_WINDOW_TIMEOUT = DEFAULT_PERIOD_SECONDS * 1_000 + 15_000;

const spentCodes = new Map<string, string>();


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

export async function freshTotpCode(secret: string): Promise<string> {
    const spent = spentCodes.get(secret);

    if (spent !== undefined) {
        await expect
            .poll(() => generateTotpCode(secret), { timeout: NEXT_WINDOW_TIMEOUT, intervals: [500] })
            .not.toBe(spent);
    }

    const code = generateTotpCode(secret);
    spentCodes.set(secret, code);
    return code;
}

export function generateInvalidTotpCode(secret: string, options: TotpOptions = {}): string {
    const valid = generateTotpCode(secret, options);
    return `${(Number(valid[0]) + 1) % 10}${valid.slice(1)}`;
}
