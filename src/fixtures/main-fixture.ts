import { test } from '@playwright/test';
import { APIFixtureType, apiFixture } from './api-fixture';
import { AxeFixtureType, axeFixture } from './axe-fixture';
import { LocaleFixtureType, localeFixture } from './locale-fixture';
import { PageFixtureType, pageFixture } from './page-fixture';
import { flowFixture, FlowFixtureType } from './flow-fixture';
import { workerAuthFixture, WorkerAuthFixtureType } from './worker-auth-fixture';
import { secondDeviceFixture, SecondDeviceFixtureType } from './second-device-fixture';
import { companySessionFixture, CompanySessionFixtureType } from './company-session-fixture';
import { representationFixture, RepresentationFixtureType } from './representation-fixture';
import { reportFixture, ReportFixtureType } from './report-fixture';

type AllFixtures =
  APIFixtureType &
  PageFixtureType &
  LocaleFixtureType &
  AxeFixtureType &
  FlowFixtureType &
  WorkerAuthFixtureType &
  SecondDeviceFixtureType &
  CompanySessionFixtureType &
  RepresentationFixtureType &
  ReportFixtureType;

export const testMain = test.extend<AllFixtures>({
  ...reportFixture,
  ...apiFixture,
  ...pageFixture,
  ...localeFixture,
  ...axeFixture,
  ...secondDeviceFixture,
  ...flowFixture,
  ...workerAuthFixture,
  ...companySessionFixture,
  ...representationFixture,
});
