import type { AxeResults } from 'axe-core';
import type { TestInfo } from '@playwright/test';
import { attachViolationDetailsToReport } from '../report/accessibility-report';

type AccessibilityCheckOptions = {
  makeAxeBuilder: () => any;
  testInfo: TestInfo;
  step: string;
  rules?: string[];
  include?: string | string[];
};

export async function runAccessibilityCheck({
  makeAxeBuilder,
  testInfo,
  step,
  rules,
  include
}: AccessibilityCheckOptions): Promise<void> {
  const builder = makeAxeBuilder();

  if (rules?.length) {
    builder.withRules(rules);
  }

  if (include) {
    builder.include(include);
  }

  const results: AxeResults = await builder.analyze();

  if (results.violations.length > 0) {
    await attachViolationDetailsToReport(results, step, testInfo);
  }
}
