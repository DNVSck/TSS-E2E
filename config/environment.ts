import { LOCALES_CONSTANT } from '../src/constant/locales-constant';

export type Locale = 'all' | 'en' | 'cy';

function boolOrDefault(value: string | undefined, fallback = false): boolean {
  if (value === undefined) return fallback;
  return value.trim().toLowerCase() === 'true';
}

/**
 * Read a value the suite cannot run without.
 *
 * These deliberately have NO fallback literal. A fallback looks like safety and is the
 * opposite: the run continues against a value nobody chose, and the test that fails is
 * some screen far away rather than the missing configuration. The old
 * `process.env.HAULIER_EORI ?? 'XI311281505000'` had already drifted from every
 * .env file without anyone noticing.
 *
 * Missing keys are COLLECTED rather than thrown one at a time, so an .env that predates
 * several additions reports all of them in one go instead of one per re-run.
 */
const missingEnv: string[] = [];

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    missingEnv.push(name);
    return '';
  }
  return value;
}

/**
 * Fail the whole run at config load, before a browser opens. Called once at the end of
 * this module, so the message lists everything at once and names the file to fix.
 */
function reportMissingEnv(): void {
  if (missingEnv.length === 0) return;

  throw new Error(
    `.env.${process.env.ENV ?? '<env>'} is missing ${missingEnv.length} required value(s):\n\n` +
    missingEnv.map(name => `    ${name}=`).join('\n') +
    `\n\nCopy them from .env.example, which lists every key the suite reads. These have no ` +
    `default on purpose: running with a blank identifier fails much later, on a screen ` +
    `that says nothing about the real cause.`
  );
}

export const ENV = process.env.ENV!;

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
  (process.env.LOCALE as Locale) || LOCALES_CONSTANT.EN_GB;

export const BASE_URL = process.env.BASE_URL!;

/**
 * Company names an Agent starts representing before running a journey. These are
 * environment data (they differ per env, like the *_EORI values), matched on the
 * trader's visible name on the "Traders that you can represent" screen — never on
 * the company GUID, which changes when data is reseeded.
 */
export const HAULIER_COMPANY_NAME = process.env.HAULIER_COMPANY_NAME ?? '';
export const IMPORTER_COMPANY_NAME = process.env.IMPORTER_COMPANY_NAME ?? '';

/**
 * The importer's EORI and the authorisations it holds.
 *
 * All environment data: the same declaration run against another environment cites
 * different numbers, and each appears in several places on one declaration - the
 * importer screen, a holder-of-authorisation record, a document reference, an
 * additional-information description. Reading them from here keeps those places in
 * step, where a literal repeated per test drifts silently.
 *
 * The 10200 additional information repeats the IPO number prefixed with "IP".
 */
export const IMPORTER_EORI = required('IMPORTER_EORI');
/** Inward Processing authorisation — cited on the C601 document. */
export const IMPORTER_IPO = required('IMPORTER_IPO');
/** UK Internal Market Scheme authorisation — cited on the 1UKI document. */
export const IMPORTER_UKIMS = required('IMPORTER_UKIMS');
/** Simplified Declaration Procedure authorisation — cited on the C512 document. */
export const IMPORTER_SDE = required('IMPORTER_SDE');
/** Private Customs Warehouse authorisation — cited on the C517 document. */
export const IMPORTER_CWP = required('IMPORTER_CWP');
/** Excise Warehouse authorisation. */
export const IMPORTER_EXW = required('IMPORTER_EXW');

/**
 * The counterparties a declaration names. One key per ROLE even where one company
 * currently fills them all: a role that moves to its own company then changes one
 * line of .env instead of hunting the value through the test data.
 *
 * Unlike the profiles above these are not accounts — nothing signs in as them, they
 * are only entered on a party screen, so all each has to be is an EORI TSS knows.
 */
export const BUYER_EORI = required('BUYER_EORI');
export const CONSIGNOR_EORI = required('CONSIGNOR_EORI');
export const CONSIGNEE_EORI = required('CONSIGNEE_EORI');
export const SELLER_EORI = required('SELLER_EORI');
export const EXPORTER_EORI = required('EXPORTER_EORI');

/** EORIs of the transport parties. Their accounts also sign in — see credentials. */
export const HAULIER_EORI = required('HAULIER_EORI');
export const CARRIER_EORI = required('CARRIER_EORI');

/** Declarant the ICS2 notification messages are published under. */
export const ICS2_DECLARANT_ID = required('ICS2_DECLARANT_ID');

reportMissingEnv();

/**
 * Whether this environment runs against a MOCK ICS2 server. The mock authorises a
 * movement by itself, so the suite publishes the IE3N03 message only where this is
 * false - see Ics2NotificationFlow.authoriseForMovementUnlessMocked.
 */
export const IS_ISC2_MOCK = boolOrDefault(process.env.ISC2_MOCK_SERVER);

/** RabbitMQ management API — only populated and used in SIT. */
export const RMQ_HOST     = process.env.RMQ_HOST     ?? '';
export const RMQ_USERNAME = process.env.RMQ_USERNAME ?? '';
export const RMQ_PWD      = process.env.RMQ_PWD      ?? '';

