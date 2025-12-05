import { request, test } from '@playwright/test';
import { BrowserFixtureType, browserFixture } from '../core/fixture/browser-fixture';
import { APIFixtureType, apiFixture } from './api-fixture';
import { LocaleFixtureType, localeFixture } from './locale-fixture';
import { PageFixtureType, pageFixture } from './page-fixture';

// Combine all fixture types
type AllFixtures = BrowserFixtureType & APIFixtureType & PageFixtureType & LocaleFixtureType;

export const testMain = test.extend<AllFixtures>({
  ...browserFixture,
  ...apiFixture,
  ...pageFixture,
  ...localeFixture
});

export const requestMain = request;
export const expectMain = test.expect;