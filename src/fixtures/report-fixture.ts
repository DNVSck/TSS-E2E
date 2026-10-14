import { test } from '@playwright/test';
import { AllureTestManager } from '../core/report/allure-test-manager';
import { ServiceErrorRecorder } from '../core/report/service-error-recorder';
import { BASE_URL } from '../../config/environment';
import { WorkerAuthFixtureType } from './worker-auth-fixture';

export type ReportFixtureType = {
    reportTestLifecycle: void;
    serviceErrors: ServiceErrorRecorder;
};

type ExtendParams = Parameters<typeof test.extend<ReportFixtureType & WorkerAuthFixtureType>>;

export const reportFixture: ExtendParams[0] = {
    reportTestLifecycle: [async ({}, // NOSONAR typescript:S3799
        use) => {
        const startedAt = new Date();
        AllureTestManager.recordTestStart(test.info());
        await use();
        await AllureTestManager.recordTestOutcome(test.info(), startedAt);
    }, { auto: true }],

    serviceErrors: async ({}, // NOSONAR typescript:S3799
        use, testInfo) => {
        const recorder = new ServiceErrorRecorder(new URL(BASE_URL).origin);

        await use(recorder);

        if (testInfo.status !== testInfo.expectedStatus) {
            await recorder.attachTo(testInfo);
        }
    },

    context: async ({ context, serviceErrors, authProfile }, use) => {
        serviceErrors.watch(context, authProfile ?? 'test browser');
        await use(context);
    },
};
