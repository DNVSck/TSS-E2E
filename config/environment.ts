import { LOCALES_CONSTANT } from '../src/constant/locales-constant';

export type Locale = 'all' | 'en' | 'cy';

function numberOrDefault(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function boolOrDefault(value: string | undefined, fallback = false): boolean {
  if (value === undefined) return fallback;
  return value.trim().toLowerCase() === 'true';
}

export const ENV = process.env.ENV as string;

/** Whether the environment requires the TOTP/OTP step during sign in. */
export const OTP_ENABLED = boolOrDefault(process.env.OTP_ENABLED);

/**
 * Reuse a cached session instead of signing in again.
 *
 * Off by default: every run performs exactly one real sign-in, so the login
 * journey is exercised on every run and no run can start from a stale session.
 *
 * Turn it on for a fast local edit-run loop — it skips the ~12s sign-in while a
 * cached session is still within AUTH_STATE_TTL_MINUTES.
 */
export const AUTH_REUSE_SESSION = boolOrDefault(process.env.AUTH_REUSE_SESSION);

export const LOCALE: Locale =
  (process.env.LOCALE as Locale) || LOCALES_CONSTANT.CY_GB;

export const BASE_URL = process.env.BASE_URL!;

/**
 * Company names an Agent starts representing before running a journey. These are
 * environment data (they differ per env, like the *_EORI values), matched on the
 * trader's visible name on the "Traders that you can represent" screen — never on
 * the company GUID, which changes when data is reseeded.
 */
export const HAULIER_COMPANY_NAME = process.env.HAULIER_COMPANY_NAME ?? '';
export const IMPORTER_COMPANY_NAME = process.env.IMPORTER_COMPANY_NAME ?? '';

export const DEFAULT_TIMEOUT = numberOrDefault(
  process.env.DEFAULT_TIMEOUT,
  5000
);

const MAX_WIDTH = numberOrDefault(process.env.MAX_WIDTH, 1920);
const MAX_HEIGHT = numberOrDefault(process.env.MAX_HEIGHT, 1080);

export const ENVIRONMENT_INFO = {
  currentEnv: ENV,
  currentLocale: LOCALE,
  baseUrl: BASE_URL,
  defaultTimeout: DEFAULT_TIMEOUT,
  viewport: {
    width: MAX_WIDTH,
    height: MAX_HEIGHT
  }
};
