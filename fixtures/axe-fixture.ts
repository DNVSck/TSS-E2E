import AxeBuilder from '@axe-core/playwright';
import { test as base } from '@playwright/test';
import type { AxeResults } from 'axe-core';
import { PageUtils } from '../core/page/page-utils';
import { ReportLog } from '../core/report/ReportLog';

export type AxeFixtureType = {
  makeAxeBuilder: () => AxeBuilder;
};

// Violation fingerprint để track known issues
export interface ViolationFingerprint {
  ruleId: string;
  target: string;
}

// Extend base test by providing "makeAxeBuilder"
// This new "test" can be used in multiple test files, and each of them will get
// a consistently configured AxeBuilder instance.
export const test = base.extend<AxeFixtureType>({
  makeAxeBuilder: async ({ page }, use) => {
    const makeAxeBuilder = () => new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']);
        // .exclude('#commonly-reused-element-with-known-issue');

    await use(makeAxeBuilder);
  }
});

// Export axeFixture object để sử dụng trong main-fixture  
export const axeFixture = {
  makeAxeBuilder: async ({ }, use: (value: () => AxeBuilder) => Promise<void>) => {
    const makeAxeBuilder = () => new AxeBuilder({ page: PageUtils.page() })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']);

    await use(makeAxeBuilder);
  }
};

/**
 * Tạo violation fingerprints từ AxeResults
 * Fingerprint bao gồm ruleId và target selector
 */
export function fingerprintsFromScanResults(results: AxeResults): ViolationFingerprint[] {
  return results.violations
    .flatMap(violation => 
      violation.nodes.map(node => {
        const target = Array.isArray(node.target)
          ? node.target.join(' ')
          : String(node.target); // <-- dùng String() thay vì .toString()
        return {
          ruleId: violation.id,
          target
        };
      })
    )
    .sort((a, b) => a.ruleId.localeCompare(b.ruleId) || a.target.localeCompare(b.target));
}

/**
 * Helper để tạo expected fingerprints dễ dàng
 */
export function createFingerprint(ruleId: string, target: string): ViolationFingerprint {
  return { ruleId, target };
}

/**
 * Attach violation details to Allure report khi có lỗi
 */
export function attachViolationDetailsToReport(results: AxeResults, stepName: string): void {
  if (results.violations.length === 0) return;

  // Tạo fingerprints text đơn giản để đọc lỗi
  const fingerprints = fingerprintsFromScanResults(results);
  const fingerprintText = fingerprints
    .map(fp => `${fp.ruleId} → ${fp.target}`)
    .join('\n');
  
  const errorMessage = `🔴 ACCESSIBILITY VIOLATIONS in "${stepName}":

📍 VIOLATION FINGERPRINTS:
${fingerprintText}

💡 Each fingerprint shows: [rule] → [CSS selector]
Use these to identify specific elements causing accessibility issues.`;

  // Attach fingerprint text vào Allure report
  ReportLog.addAttachment('violation-fingerprints.txt', errorMessage, 'text/plain');
  
  // Attach detailed JSON nếu cần debug
  const violationDetails = {
    stepName,
    timestamp: new Date().toISOString(),
    fingerprints: fingerprints,
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
  
  ReportLog.addAttachment('accessibility-violations-details.json', JSON.stringify(violationDetails, null, 2), 'application/json');
  
  // Console log fingerprints để debug nhanh
  console.error(errorMessage);
}

export { expect } from '@playwright/test';

