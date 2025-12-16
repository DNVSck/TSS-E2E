// utils/accessibility-scanner.ts
import { AxeResults } from 'axe-core';
import { attachViolationDetailsToReport, expect } from "../../fixtures/axe-fixture";

export async function runAccessibilityCheck({
  makeAxeBuilder,
  testInfo,
  rules,
  include,
  exclude,
  step
}: {
  makeAxeBuilder: () => any;
  testInfo: any;
  rules?: string[];
  include?: string;
  exclude?: string;
  step: string;
}): Promise<AxeResults> {

  let builder = makeAxeBuilder();

  if (rules?.length) builder = builder.withRules(rules);
  if (include) builder = builder.include(include);
  if (exclude) builder = builder.exclude(exclude);

  const result = await builder.analyze();

  attachViolationDetailsToReport(result, step);

  expect(result.violations, `WCAG violations in step: ${step}`).toEqual([]);

  return result;
}