import AxeBuilder from '@axe-core/playwright';
import type { AxeResults } from 'axe-core';
import { Page, TestInfo } from '@playwright/test';
import { ReportLog } from '../core/report/ReportLog';

export type AxeFixtureType = {
  makeAxeBuilder: () => AxeBuilder;
};

export const axeFixture = {
  makeAxeBuilder: async (
    { page }: { page: Page },
    use: (value: () => AxeBuilder) => Promise<void>,
    testInfo: TestInfo
  ) => {
    // ---------- SETUP (before accessibility test) ----------
    console.log('Setting up accessibility test environment...');

    const makeAxeBuilder = () =>
      new AxeBuilder({ page }).withTags(['wcag22aa']);

    try {
      await use(makeAxeBuilder);
    } finally {
      // ---------- TEARDOWN (after accessibility test) ----------
      console.log('Cleaning up accessibility test environment...');

      if (testInfo.status === 'failed') {
        ReportLog.addAttachment(
          'test-failure-info.json',
          JSON.stringify(
            {
              title: testInfo.title,
              status: testInfo.status,
              error: testInfo.error?.message,
              duration: testInfo.duration
            },
            null,
            2
          ),
          'application/json'
        );
      }
    }
  }
};
