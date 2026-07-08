import OTPAuth from 'otpauth';

export interface TotpOptions {
    digits?: number;
    periodSeconds?: number;
    issuer?: string;
    label?: string;
}

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
        period: options.periodSeconds ?? 30,
        secret: OTPAuth.Secret.fromBase32(trimmed)
    });

    return totp.generate();
}
