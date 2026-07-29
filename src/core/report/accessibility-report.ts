import type { AxeResults } from 'axe-core';
import type { TestInfo } from '@playwright/test';
import { ReportLog } from './report-log';

// Turning axe results into report attachments. Lives here, not in the axe fixture:
// it is pure reporting (results in, attachments out) with no fixture wiring, and the
// accessibility scanner needs it - a core module must never reach up into fixtures.

export interface ViolationFingerprint {
  ruleId: string;
  target: string;
}

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

export async function attachViolationDetailsToReport(
  results: AxeResults,
  stepName: string,
  testInfo: TestInfo
): Promise<void> {
  if (results.violations.length === 0) return;

  const fingerprints = fingerprintsFromScanResults(results);

  const fingerprintText = fingerprints
    .map(fp => `${fp.ruleId} -> ${fp.target}`)
    .join('\n');

  const summaryText =
    `ACCESSIBILITY VIOLATIONS in "${stepName}"\n\n` +
    `VIOLATION FINGERPRINTS\n` +
    `${fingerprintText}\n\n` +
    `Each fingerprint shows rule -> css selector`;

  // ---- Playwright HTML report ----
  await testInfo.attach('accessibility-violation-fingerprints.txt', {
    body: summaryText,
    contentType: 'text/plain'
  });

  await testInfo.attach('accessibility-violation-details.json', {
    body: JSON.stringify(
      {
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
      },
      null,
      2
    ),
    contentType: 'application/json'
  });

  // ---- Allure reporting ----
  ReportLog.addAttachment(
    'accessibility-violation-fingerprints.txt',
    summaryText,
    'text/plain'
  );

  ReportLog.addAttachment(
    'accessibility-violation-details.json',
    JSON.stringify(
      {
        stepName,
        timestamp: new Date().toISOString(),
        fingerprints
      },
      null,
      2
    ),
    'application/json'
  );
}
