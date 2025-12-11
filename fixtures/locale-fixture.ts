import { test as base, TestInfo } from '@playwright/test';
import { LOCALES_CONSTANT } from '../constant/locales-constant';
import fs from 'fs';
import path from 'path';

// Translation function type
export type TFunction = (key: string) => string;

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

    const projectName = testInfo.project.name;
    const currentLocale = projectName.includes(LOCALES_CONSTANT.CY_GB) ? LOCALES_CONSTANT.CY_GB : LOCALES_CONSTANT.EN_GB;

    console.log(`Locale fixture loading for project: ${projectName}, locale: ${currentLocale}`);

    let messages: Record<string, any> = {};

    if (currentLocale === LOCALES_CONSTANT.CY_GB) {
      const messagesPath = path.resolve(process.cwd(), localeCyPath);
      messages = require(messagesPath);
      console.log(`Loaded Welsh locale for t() function`);
    } else {
      const messagesPath = path.resolve(process.cwd(), localeEnPath);
      messages = require(messagesPath);
      console.log(`Loaded English locale for t() function`);
    }

    const t: TFunction = (key: string): string => {
      const keys = key.split('.');
      let value: any = messages;
      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k];
        } else {
          console.warn(`Translation key not found: ${key} for locale: ${currentLocale}, returning key`);
          return key;
        }
      }
      if (typeof value === 'string') {
        return value;
      } else {
        console.warn(`Translation value is not a string: ${key} for locale: ${currentLocale}, returning key`);
        return key;
      }
    };

    await use(t);
  },
};

// Export test with locale fixture
export const testLocale = base.extend<LocaleFixtureType>(localeFixture);