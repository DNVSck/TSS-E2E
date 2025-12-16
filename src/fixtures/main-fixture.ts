import { test } from '@playwright/test';
import { APIFixtureType, apiFixture } from './api-fixture';
import { AxeFixtureType, axeFixture } from './axe-fixture';
import { LocaleFixtureType, localeFixture } from './locale-fixture';
import { PageFixtureType, pageFixture } from './page-fixture';

type AllFixtures =
  APIFixtureType &
  PageFixtureType &
  LocaleFixtureType &
  AxeFixtureType;

export const testMain = test.extend<AllFixtures>({
  ...apiFixture,
  ...pageFixture,
  ...localeFixture,
  ...axeFixture
});
