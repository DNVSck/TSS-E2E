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

export const LOCALE: Locale =
  (process.env.LOCALE as Locale) || LOCALES_CONSTANT.CY_GB;

export const BASE_URL = process.env.BASE_URL!;
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
