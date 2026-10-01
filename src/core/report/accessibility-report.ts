import { writeFile } from 'node:fs/promises';
import type { AxeResults, Result } from 'axe-core';
import type { TestInfo } from '@playwright/test';

// Turning one axe scan into one report per screen. Pure formatting - the caller decides
// what a criterion means and hands the rows in, so this module stays free of the WCAG
// table and a core module never reaches up into test data or fixtures.

export type CriterionOutcome = 'MET' | 'VIOLATED' | 'NOT APPLICABLE' | 'NEEDS REVIEW';

export interface CriterionRow {
  id: string;
  name: string;
  level: string;
  outcome: CriterionOutcome;
  why: string;
  understandingUrl: string;
  violations: Result[];
  /** Rules axe ran but could not decide. The manual-audit list for this screen. */
  incomplete: Result[];
}

export interface ScreenReport {
  screen: string;
  url: string;
  rows: CriterionRow[];
  nonWcag: Result[];
  screenshot?: Buffer;
  testInfo: TestInfo;
}

export function targetsOf(node: { target: unknown }): string {
  return Array.isArray(node.target) ? node.target.join(' ') : String(node.target);
}

// axe tags a rule with the criteria it enforces, as "wcag412" for 4.1.2. Level tags
// (wcag2a, wcag21aa) carry letters and are skipped by the digit match.
export function wcagCriteriaFromTags(tags: readonly string[]): string[] {
  const criteria = tags
    .map(tag => /^wcag(\d)(\d)(\d+)$/.exec(tag))
    .filter((match): match is RegExpExecArray => match !== null)
    .map(match => `${match[1]}.${match[2]}.${match[3]}`);

  return [...new Set(criteria)].sort(
    (a, b) => a.localeCompare(b, undefined, { numeric: true })
  );
}

export function outcomeForRules(
  passes: Result[], violations: Result[], incomplete: Result[]
): CriterionOutcome {
  if (violations.length > 0) return 'VIOLATED';
  if (passes.length + violations.length + incomplete.length === 0) return 'NOT APPLICABLE';
  if (incomplete.length > 0) return 'NEEDS REVIEW';
  return 'MET';
}

export function scanOutcome(rows: readonly CriterionRow[]): CriterionOutcome {
  if (rows.some(row => row.outcome === 'VIOLATED')) return 'VIOLATED';
  if (rows.some(row => row.outcome === 'NEEDS REVIEW')) return 'NEEDS REVIEW';
  if (rows.some(row => row.outcome === 'MET')) return 'MET';
  return 'NOT APPLICABLE';
}

/** "1.3.1 Info and Relationships - list -> .selector", one per failing rule. */
export function violationSummary(rows: readonly CriterionRow[]): string[] {
  return rows
    .filter(row => row.outcome === 'VIOLATED')
    .flatMap(row => row.violations.map(violation =>
      `${row.id} ${row.name} - ${violation.id} -> `
      + violation.nodes.map(node => targetsOf(node)).join(' , ')));
}

/**
 * Trimmed AFTER the slice, because cutting to length can itself land on a separator.
 *
 * The trim is a manual scan rather than /^-+|-+$/, the same way stripTrailingSlashes
 * is: an unbounded quantifier beside an anchor backtracks once the match fails, which
 * is quadratic on a run of separators. A walk in from each end is linear.
 */
function slugOf(screen: string): string {
  const slug = screen.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-').slice(0, 60);

  let start = 0;
  let end = slug.length;

  while (start < end && slug[start] === '-') start++;
  while (end > start && slug[end - 1] === '-') end--;

  return slug.slice(start, end);
}

/** "1.3.1  Info and Relationships (A)                    MET", one per criterion. */
function criterionLine(row: CriterionRow): string {
  const named = `${row.name} (${row.level})`;

  return `  ${row.id.padEnd(7)}${named.padEnd(46)}${row.outcome}`;
}

function tallyOf(rows: readonly CriterionRow[]): Record<CriterionOutcome, number> {
  const tally: Record<CriterionOutcome, number> = {
    'MET': 0, 'VIOLATED': 0, 'NOT APPLICABLE': 0, 'NEEDS REVIEW': 0,
  };
  for (const row of rows) tally[row.outcome] += 1;
  return tally;
}

function ruleDetail(row: CriterionRow, rules: Result[]): string[] {
  const lines = [
    '',
    `${row.id} ${row.name} (${row.level})`,
    `  why     : ${row.why}`,
    `  standard: ${row.understandingUrl}`,
  ];

  for (const violation of rules) {
    lines.push(
      `  rule    : ${violation.id} (${violation.impact}) - ${violation.description}`,
      `  requires: ${violation.help}`,
      `  more    : ${violation.helpUrl}`,
    );

    for (const node of violation.nodes) {
      lines.push(
        `  selector: ${targetsOf(node)}`,
        `  html    : ${node.html}`,
        `  detail  : ${(node.failureSummary ?? '').split('\n').map(s => s.trim())
          .filter(Boolean).join(' | ')}`,
      );
    }
  }

  return lines;
}

/**
 * One text file per screen, plus its screenshot when something failed. Named for the
 * screen and its outcome so a journey's attachments read as a list of results rather
 * than the same filename repeated twenty times.
 */
export async function attachScreenReport(report: ScreenReport): Promise<void> {
  const { screen, url, rows, nonWcag, screenshot, testInfo } = report;
  const outcome = scanOutcome(rows);
  const tally = tallyOf(rows);
  const stem = `a11y-${slugOf(screen)}-${outcome.replaceAll(' ', '-')}`;

  const lines = [
    `${screen} - ${outcome}`,
    `URL: ${url}`,
    '',
    `WCAG 2.2 AA - ${rows.length} criteria axe can test automatically`,
    `  MET            ${tally.MET}`,
    `  VIOLATED       ${tally.VIOLATED}`,
    `  NOT APPLICABLE ${tally['NOT APPLICABLE']}`,
    `  NEEDS REVIEW   ${tally['NEEDS REVIEW']}`,
    '',
    'NOT APPLICABLE means nothing on this screen triggers those rules, not that the',
    'screen passed them. Automation reaches roughly a third of WCAG - a criterion',
    'absent from the list below is not assessed here and still needs a manual audit.',
    '',
    'CRITERIA',
    ...rows.map(criterionLine),
  ];

  const failed = rows.filter(row => row.outcome === 'VIOLATED');
  if (failed.length > 0) {
    lines.push('', 'VIOLATIONS', ...failed.flatMap(row => ruleDetail(row, row.violations)));
  }

  const unsure = rows.filter(row => row.outcome === 'NEEDS REVIEW');
  if (unsure.length > 0) {
    lines.push(
      '',
      'NEEDS REVIEW - axe ran these rules and could not decide. Each one is a check',
      'a person has to make by hand; none of them is a pass.',
      ...unsure.flatMap(row => ruleDetail(row, row.incomplete)),
    );
  }

  if (nonWcag.length > 0) {
    lines.push(
      '',
      'NOT WCAG - Deque best practice. Does not count towards compliance and does',
      'not fail this test, but it still affects how users move around the screen.',
    );
    for (const finding of nonWcag) {
      lines.push(`  ${finding.id} (${finding.impact}) - ${finding.help}`);
      for (const node of finding.nodes) lines.push(`      ${targetsOf(node)}`);
    }
  }

  // Written to disk rather than attached as a body, so the URL that was actually
  // scanned can be read straight off the run instead of only from the report viewer.
  const reportFile = testInfo.outputPath(`${stem}.txt`);
  await writeFile(reportFile, lines.join('\n'));
  await testInfo.attach(`${stem}.txt`, { path: reportFile, contentType: 'text/plain' });

  if (screenshot) {
    // Written to disk and attached by path, not as a body: a body-only binary
    // attachment is held in memory and no reporter here persists it, so it never
    // reaches the report.
    const file = testInfo.outputPath(`${stem}.png`);
    await writeFile(file, screenshot);

    await testInfo.attach(`${stem}.png`, { path: file, contentType: 'image/png' });
  }
}

export function scopeOf(results: AxeResults, ruleIds: readonly string[]): {
  passes: Result[]; violations: Result[]; incomplete: Result[];
} {
  const inScope = (rule: Result) => ruleIds.includes(rule.id);

  return {
    passes: results.passes.filter(inScope),
    violations: results.violations.filter(inScope),
    incomplete: results.incomplete.filter(inScope),
  };
}
