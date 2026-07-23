import puppeteer from 'puppeteer';
import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

dotenv.config();

// ─── Types ────────────────────────────────────────────────────────────────────

type Status = 'passed' | 'failed' | 'broken' | 'skipped' | 'unknown';

type TestRow = {
  story: string;
  status: Status;
  duration: number;
};

type FeatureGroup = {
  feature: string;
  tests: TestRow[];
};

type EnvEntry = {
  key: string;
  value: string;
};

type ExportAllurePdfOptions = {
  resultsDir?: string;
  outputPath?: string;
};

function isAllureResultFile(fileName: string): boolean {
  if (!fileName.endsWith('.json')) return false;
  return !['categories.json', 'executor.json', 'environment.json'].includes(fileName);
}

function parseResultToTestRow(parsed: any): { feature: string; row: TestRow } | null {
  if (!parsed?.name || !parsed?.status) return null;

  const labels: { name: string; value: string }[] = Array.isArray(parsed.labels)
    ? parsed.labels
    : [];

  const getLabel = (name: string) => labels.find((l) => l.name === name)?.value ?? '';
  const feature = getLabel('feature') || getLabel('suite') || 'Other';
  const story = getLabel('story') || parsed.name;
  const status = (parsed.status as Status) || 'unknown';
  const duration = typeof parsed.stop === 'number' && typeof parsed.start === 'number'
    ? parsed.stop - parsed.start
    : 0;

  return { feature, row: { story, status, duration } };
}

// ─── Data readers ─────────────────────────────────────────────────────────────

async function buildFeatureGroups(resultsDir: string): Promise<FeatureGroup[]> {
  const files = await fs.readdir(resultsDir);
  const map = new Map<string, TestRow[]>();

  for (const file of files) {
    if (!isAllureResultFile(file)) continue;

    try {
      const raw = await fs.readFile(path.join(resultsDir, file), 'utf8');
      const parsed = JSON.parse(raw);
      const item = parseResultToTestRow(parsed);
      if (!item) continue;

      if (!map.has(item.feature)) map.set(item.feature, []);
      const featureTests = map.get(item.feature);
      if (featureTests) {
        featureTests.push(item.row);
      }
    } catch {
      continue;
    }
  }

  return Array.from(map.entries()).map(([feature, tests]) => ({ feature, tests }));
}

async function getEnvironment(resultsDir: string): Promise<EnvEntry[]> {
  try {
    const raw = await fs.readFile(path.join(resultsDir, 'environment.properties'), 'utf8');
    return raw.split('\n')
      .map(l => l.trim())
      .filter(l => l && !l.startsWith('#'))
      .map(l => {
        const idx = l.indexOf('=');
        return idx > 0 ? { key: l.slice(0, idx).trim(), value: l.slice(idx + 1).trim() } : null;
      })
      .filter((e): e is EnvEntry => e !== null);
  } catch { }

  try {
    const raw = await fs.readFile(path.join(resultsDir, 'environment.json'), 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((e: any) => ({ key: String(e.name ?? e.key ?? ''), value: String(e.value ?? '') }));
    }
    return Object.entries(parsed).map(([key, value]) => ({
      key,
      value: typeof value === 'string' ? value : JSON.stringify(value),
    }));
  } catch { }

  return [];
}

// ─── HTML builders ────────────────────────────────────────────────────────────

function formatDuration(ms: number): string {
  if (ms <= 0) return '';
  if (ms < 1000) return `${ms}ms`;
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return rem > 0 ? `${m}m ${rem}s` : `${m}m`;
}

function statusBadge(status: Status): string {
  const styles: Record<Status, string> = {
    passed: 'background:#dcfce7;color:#166534',
    failed: 'background:#fee2e2;color:#991b1b',
    broken: 'background:#ffedd5;color:#9a3412',
    skipped: 'background:#f3f4f6;color:#374151',
    unknown: 'background:#f3f4f6;color:#374151',
  };
  return `<span style="display:inline-block;padding:2px 10px;border-radius:4px;font-size:11px;font-weight:700;letter-spacing:0.05em;${styles[status] ?? styles.unknown}">${status.toUpperCase()}</span>`;
}

function buildHtml(
  groups: FeatureGroup[],
  env: EnvEntry[],
  generatedAt: string,
): string {
  const totalTests = groups.reduce((n, g) => n + g.tests.length, 0);
  const totalPassed = groups.reduce((n, g) => n + g.tests.filter(t => t.status === 'passed').length, 0);
  const pct = totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0;
  // Build ring using explicit arc paths — more reliable than dashoffset in Puppeteer PDF
  const toXY = (angleDeg: number) => {
    const rad = (angleDeg - 90) * Math.PI / 180; // -90 makes 0° point up (12 o'clock)
    return { x: 36 + 28 * Math.cos(rad), y: 36 + 28 * Math.sin(rad) };
  };
  const arcPath = (startDeg: number, endDeg: number): string => {
    if (Math.abs(endDeg - startDeg) >= 359.9) {
      // Full circle — draw as two semicircles
      const t = toXY(0); const b = toXY(180);
      return `M ${t.x.toFixed(2)} ${t.y.toFixed(2)} A 28 28 0 1 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)} A 28 28 0 1 1 ${t.x.toFixed(2)} ${t.y.toFixed(2)}`;
    }
    const s = toXY(startDeg); const e = toXY(endDeg);
    const large = (endDeg - startDeg) > 180 ? 1 : 0;
    return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A 28 28 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
  };

  const passedDeg = (totalPassed / (totalTests || 1)) * 360;

  const ring = `
    <svg width="72" height="72" viewBox="0 0 72 72">
      <circle cx="36" cy="36" r="28" fill="none" stroke="#e5e7eb" stroke-width="8"/>
      ${passedDeg > 0 ? `<path d="${arcPath(0, passedDeg)}" fill="none" stroke="#16a34a" stroke-width="8" stroke-linecap="butt"/>` : ''}
      ${passedDeg < 360 ? `<path d="${arcPath(passedDeg, 360)}" fill="none" stroke="#dc2626" stroke-width="8" stroke-linecap="butt"/>` : ''}
      <text x="36" y="41" text-anchor="middle" font-size="14" font-weight="700" fill="#111827">${pct}%</text>
    </svg>`;

  const envRows = env.map(e => `
    <tr>
      <td style="padding:6px 12px;border-top:1px solid #f3f4f6;font-size:12px;color:#374151;font-weight:600;width:30%;">${e.key}</td>
      <td style="padding:6px 12px;border-top:1px solid #f3f4f6;font-size:12px;color:#374151;">${e.value}</td>
    </tr>`).join('');

  const envTable = env.length > 0 ? `
    <table style="width:100%;border-collapse:collapse;margin-bottom:16px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
      <thead><tr style="background:#f3f4f6;">
        <th colspan="2" style="padding:8px 12px;text-align:left;font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Metadata</th>
      </tr></thead>
      <tbody>${envRows}</tbody>
    </table>` : '';

  const featureRows = groups.map(({ feature, tests }) => {
    const passed = tests.filter(t => t.status === 'passed').length;
    const total = tests.length;
    const fpct = total > 0 ? Math.round((passed / total) * 100) : 0;

    const testRows = tests.map(t => `
      <tr style="page-break-inside:avoid;">
        <td style="padding:7px 16px 7px 28px;border-bottom:1px solid #f3f4f6;font-size:12px;color:#374151;">${t.story}</td>
        <td style="padding:7px 16px;border-bottom:1px solid #f3f4f6;text-align:right;white-space:nowrap;">${statusBadge(t.status)}</td>
        <td style="padding:7px 16px;border-bottom:1px solid #f3f4f6;text-align:right;font-size:11px;color:#9ca3af;white-space:nowrap;">${formatDuration(t.duration)}</td>
      </tr>`).join('');

    return `
      <tr style="page-break-inside:avoid;">
        <td colspan="3" style="padding:10px 16px 4px;background:#f9fafb;border-top:2px solid #e5e7eb;">
          <div style="font-size:13px;font-weight:700;color:#111827;">${feature}</div>
          <div style="display:flex;align-items:center;gap:8px;margin-top:3px;">
            <div style="flex:1;height:4px;background:#e5e7eb;border-radius:2px;">
              <div style="width:${fpct}%;height:100%;background:#16a34a;border-radius:2px;"></div>
            </div>
            <span style="font-size:10px;color:#6b7280;">${passed}/${total}</span>
          </div>
        </td>
      </tr>
      ${testRows}`;
  }).join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #fff; color: #111827; padding: 24px; }
  @page { size: A4 portrait; margin: 15mm; }
</style>
</head>
<body>

  <!-- Header -->
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #e5e7eb;">
    <div>
      <h1 style="font-size:22px;font-weight:700;color:#111827;">Allure Report</h1>
      <p style="font-size:12px;color:#6b7280;margin-top:4px;">${generatedAt}</p>
    </div>
    <div style="text-align:center;">
      ${ring}
      <div style="font-size:11px;color:#6b7280;margin-top:4px;">${totalPassed}/${totalTests} passed</div>
    </div>
  </div>

  <!-- Metadata -->
  ${envTable}

  <!-- Results table -->
  <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
    <thead>
      <tr style="background:#f3f4f6;">
        <th style="padding:8px 16px;text-align:left;font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Test</th>
        <th style="padding:8px 16px;text-align:right;font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Status</th>
        <th style="padding:8px 16px;text-align:right;font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Duration</th>
      </tr>
    </thead>
    <tbody>
      ${featureRows}
    </tbody>
  </table>

</body>
</html>`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export async function exportAllurePDF(options: ExportAllurePdfOptions = {}): Promise<void> {
  const resultsDir = options.resultsDir ?? path.resolve('allure-results');
  const outputPath = options.outputPath ?? path.resolve('test-results', 'allure-report.pdf');

  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  const [groups, env] = await Promise.all([
    buildFeatureGroups(resultsDir),
    getEnvironment(resultsDir),
  ]);

  const generatedAt = new Date().toLocaleString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });


  const html = buildHtml(groups, env, generatedAt);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '15mm', bottom: '15mm', left: '15mm', right: '15mm' },
    });

  } finally {
    await browser.close();
  }
}

const currentFilePath = fileURLToPath(import.meta.url);
const entryFilePath = process.argv[1] ? path.resolve(process.argv[1]) : null;

if (entryFilePath === currentFilePath) {
  /**
   * Both arguments are optional and keep the previous defaults, so a bare
   * `pnpm report:pdf` behaves exactly as before:
   *
   *   pnpm report:pdf
   *   pnpm report:pdf -- ./downloaded-allure-results
   *   pnpm report:pdf -- ./downloaded-allure-results ./out/run-1234.pdf
   *
   * The point is the middle form: CI publishes raw allure-results as an
   * artifact, so this turns "unzip it" into a report without needing a JRE or a
   * local server.
   */
  // pnpm forwards the "--" separator itself, so drop it before reading paths.
  const [resultsArg, outputArg] = process.argv.slice(2).filter(arg => arg !== '--');

  try {
    await exportAllurePDF({
      resultsDir: resultsArg ? path.resolve(resultsArg) : undefined,
      outputPath: outputArg ? path.resolve(outputArg) : undefined,
    });
  } catch (error) {
    console.error('Failed to export Allure PDF:', error);
    process.exit(1);
  }
}
