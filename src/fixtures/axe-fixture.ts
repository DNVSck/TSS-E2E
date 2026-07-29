import AxeBuilder from '@axe-core/playwright';
import { Page, TestInfo } from '@playwright/test';

export type AxeFixtureType = {
  makeAxeBuilder: () => AxeBuilder;
};

export const axeFixture = {
  makeAxeBuilder: async (
    { page }: { page: Page },
    use: (value: () => AxeBuilder) => Promise<void>,
    testInfo: TestInfo
  ) => {
    // ---------- SETUP ----------
    const makeAxeBuilder = () =>
      new AxeBuilder({ page }).withTags(['wcag22aa']);

    try {
      await use(makeAxeBuilder);
    } finally {
      // ---------- TEARDOWN / REPORTING ----------
      if (testInfo.status === 'failed') {
        await testInfo.attach('accessibility-test-metadata.json', {
          body: JSON.stringify(
            {
              title: testInfo.title,
              status: testInfo.status,
              error: testInfo.error?.message,
              duration: testInfo.duration
            },
            null,
            2
          ),
          contentType: 'application/json'
        });
      }
    }
  }
};
