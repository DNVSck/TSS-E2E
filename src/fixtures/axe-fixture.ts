import AxeBuilder from '@axe-core/playwright';
import { Page } from '@playwright/test';

export type AxeFixtureType = {
  makeAxeBuilder: () => AxeBuilder;
};

export const axeFixture = {
  makeAxeBuilder: async (
    { page }: { page: Page },
    use: (value: () => AxeBuilder) => Promise<void>
  ) => {
    await use(() => new AxeBuilder({ page }));
  }
};
