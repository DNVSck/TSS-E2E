import AxeBuilder from '@axe-core/playwright';
import type { AxeResults } from 'axe-core';
import { Page } from '@playwright/test';
import { ReportLog } from '../core/report/ReportLog';

export type AxeFixtureType = {
  makeAxeBuilder: () => AxeBuilder;
};

export interface ViolationFingerprint {
  ruleId: string;
  target: string;
}

export const axeFixture = {
  makeAxeBuilder: async (
    { page }: { page: Page },
    use: (value: () => AxeBuilder) => Promise<void>
  ) => {
    const makeAxeBuilder = () =>
      new AxeBuilder({ page }).withTags(['wcag22aa']);

    await use(makeAxeBuilder);
  }
};

export function fingerprintsFromScanResults(
  results: AxeResults
): ViolationFingerprint[] {
  return results.violations
    .flatMap(violation =>
      violation.nodes.map(node => {
        const target = Array.isArray(node.target)
          ? node.target.join(' ')
          : String(node.target);

        return {
          ruleId: violation.id,
          target
        };
      })
    )
    .sort(
      (a, b) =>
        a.ruleId.localeCompare(b.ruleId) ||
        a.target.localeCompare(b.target)
    );
}

export function createFingerprint(
  ruleId: string,
  target: string
): ViolationFingerprint {
  return { ruleId, target };
}

export function attachViolationDetailsToReport(
  results: AxeResults,
  stepName: string
): void {
  if (results.violations.length === 0) return;

  const fingerprints = fingerprintsFromScanResults(results);

  const fingerprintText = fingerprints
    .map(fp => `${fp.ruleId} -> ${fp.target}`)
    .join('\n');

  const errorMessage =
    `ACCESSIBILITY VIOLATIONS in "${stepName}"\n\n` +
    `VIOLATION FINGERPRINTS\n` +
    `${fingerprintText}\n\n` +
    `Each fingerprint shows rule -> css selector`;

  ReportLog.addAttachment(
    'violation-fingerprints.txt',
    errorMessage,
    'text/plain'
  );

  const violationDetails = {
    stepName,
    timestamp: new Date().toISOString(),
    fingerprints,
    violations: results.violations.map(violation => ({
      id: violation.id,
      impact: violation.impact,
      description: violation.description,
      help: violation.help,
      helpUrl: violation.helpUrl,
      nodes: violation.nodes.map(node => ({
        html: node.html,
        target: node.target,
        failureSummary: node.failureSummary
      }))
    }))
  };

  ReportLog.addAttachment(
    'accessibility-violations-details.json',
    JSON.stringify(violationDetails, null, 2),
    'application/json'
  );
}
