import { test } from '@playwright/test';
import { AllureTestManager } from '../core/report/allure-test-manager';
import {
    ServiceErrorRecorder, explainPageLoadError, recordFailedAttempt, refuseRetryUnlessServiceOutage,
} from '../core/report/service-error-recorder';
import { BASE_URL } from '../../config/environment';
import { WorkerAuthFixtureType } from './worker-auth-fixture';

export type ReportFixtureType = {
    reportTestLifecycle: void;
    retryOnlyAfterServiceOutage: void;
    serviceErrors: ServiceErrorRecorder;
};

type ExtendParams = Parameters<typeof test.extend<ReportFixtureType & WorkerAuthFixtureType>>;

export const reportFixture: ExtendParams[0] = {
    retryOnlyAfterServiceOutage: [async ({}, // NOSONAR typescript:S3799
        use, testInfo) => {
        refuseRetryUnlessServiceOutage(testInfo);
        await use();
    }, { auto: true }],

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
            recordFailedAttempt(testInfo, recorder);
            explainPageLoadError(testInfo, recorder);
        }
    },

    context: async ({ context, serviceErrors, authProfile }, use) => {
        serviceErrors.watch(context, authProfile ?? 'test browser');
        await use(context);
    },
};
