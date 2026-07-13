import OTPAuth from 'otpauth';

export interface TotpOptions {
    digits?: number;
    periodSeconds?: number;
    issuer?: string;
    label?: string;
}

const DEFAULT_PERIOD_SECONDS = 30;


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
