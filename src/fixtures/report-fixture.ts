import { test } from '@playwright/test';
import { AllureTestManager } from '../core/report/allure-test-manager';

export type ReportFixtureType = {
    reportTestLifecycle: void;
};

type ExtendParams = Parameters<typeof test.extend<ReportFixtureType>>;

export const reportFixture: ExtendParams[0] = {
    reportTestLifecycle: [async ({}, // NOSONAR typescript:S3799
        use) => {
        AllureTestManager.recordTestStart(test.info());
        await use();
        await AllureTestManager.recordTestOutcome(test.info());
    }, { auto: true }],
};
