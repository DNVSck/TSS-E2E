import { test as base, TestInfo } from '@playwright/test';
import { LOCALES_CONSTANT } from '../constant/locales-constant';
import { ReportLog } from '../core/report/report-log';
import fs from 'node:fs';
import path from 'node:path';

type DotPaths<T> = {
  [K in keyof T & string]: T[K] extends Record<string, unknown>
    ? `${K}.${DotPaths<T[K]>}`
    : K;
}[keyof T & string];

/**
 * en.json is the source of truth for the key set. cy.json is kept in sync by
 * the locale-consistency guard test, so typing against en alone is safe.
 * Type-only import: no runtime JSON load, no import assertion needed.
 */
export type TranslationKey = DotPaths<typeof import('../../locales/en.json')>;

// Translation function type. Keys are validated at compile time.
export type TFunction = (key: TranslationKey) => string;

// Fixture type for proper TypeScript inference
export type LocaleFixtureType = {
  t: TFunction;
};

// Paths to locale files
const localeEnPath = './locales/en.json';
const localeCyPath = './locales/cy.json';

// Check if locale files exist
if (!fs.existsSync(localeEnPath) || !fs.existsSync(localeCyPath)) {
  throw new Error('Missing locales files. Make sure en.json and cy.json exist in /locales directory');
}

/**
 * Locale fixture that provides t function for translations
 * Usage in test: test('my test', async ({ t }) => { expect(page.locator('h1')).toContainText(t('portal.title')) })
 */
export const localeFixture = {
  t: async ({}, use: (t: TFunction) => Promise<void>,
    testInfo: TestInfo
  ) =>  {

    const currentLocale = localeForProject(testInfo.project);

    // A parameter, not a step: which locale a test ran under is a FACT about the test,
    // not a unit of work it performed. As steps these were three lines on every test's
    // timeline saying the same thing, and the two "Loaded ... locale" ones only repeated
    // what the locale itself already says. As a parameter it sits beside the other facts
    // in the report, where anyone reading a failure would look for it.
    ReportLog.setParameter('Locale', currentLocale);

    await use(createTranslator(currentLocale));
  },
};

/**
 * Which language a project runs in, taken from the locale it declares.
 *
 * The declared option rather than the project's name: the name is a label, and
 * matching "cy" inside it makes any future project whose name happens to contain
 * those letters silently Welsh. `use.locale` is the same value the browser is given,
 * so the strings a test expects cannot drift from the language it is served.
 *
 * Exported because two callers need the same answer and must not disagree: the
 * translator picks the strings a test expects, and BasePage puts the portal into the
 * language those strings are written in.
 *
 * English when a project declares nothing, which is what the service serves anyway.
 */
export function localeForProject(project: TestInfo['project']): string {
    return project.use.locale ?? LOCALES_CONSTANT.EN_GB;
}

/**
 * A translator outside the fixture, for code that runs before any test exists.
 *
 * globalSetup signs in through the same page object the specs use, and that page
 * object reads its labels from the locale files - but a fixture needs a TestInfo to
 * pick the locale from, and globalSetup has none.
 */
export function createTranslator(locale: string): TFunction {
  const messagesPath = path.resolve(
    process.cwd(), locale === LOCALES_CONSTANT.CY_GB ? localeCyPath : localeEnPath
  );
  const messages: Record<string, any> = require(messagesPath);

  return (key: string): string => {
    let value: any = messages;

    for (const k of key.split('.')) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        throw new TypeError(`Translation key not found: ${key} for locale: ${locale}`);
      }
    }

    if (typeof value !== 'string') {
      throw new TypeError(`Translation value is not a string: ${key} for locale: ${locale}`);
    }

    return value;
  };
}

// Export test with locale fixture
export const testLocale = base.extend<LocaleFixtureType>(localeFixture);