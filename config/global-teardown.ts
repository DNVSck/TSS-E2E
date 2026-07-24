import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

async function globalTeardown(): Promise<void> {
  const allureResultsPath = path.resolve('allure-results');

  if (!fs.existsSync(allureResultsPath)) {
    return;
  }

  if (process.env.CI) {
    console.log(
      'CI detected: skipping Allure HTML generation. Raw allure-results will be published by the pipeline.',
    );
    return;
  }

  const allureReportPath = path.resolve('allure-report');
  const stagingPath = fs.mkdtempSync(path.join(os.tmpdir(), 'allure-report-'));
  const allureCli = path.join(path.dirname(require.resolve('allure')), '..', 'cli.js');
  const args = [allureCli, 'generate', allureResultsPath, '-o', stagingPath];

  try {
    execFileSync(process.execPath, args, { stdio: 'inherit' });

    fs.rmSync(allureReportPath, { recursive: true, force: true });
    moveDirectory(stagingPath, allureReportPath);

    console.log(`Allure report generated at ${allureReportPath}`);
  } catch (error) {
    fs.rmSync(stagingPath, { recursive: true, force: true });

    console.warn(
      'Allure report generation failed.\n' +
      `  Command: node ${args.join(' ')}\n` +
      `  Reason:  ${error instanceof Error ? error.message : String(error)}\n` +
      `  The raw results are still in ${allureResultsPath}.`,
    );
  }
}

/** Rename where possible, copy when the staging dir is on another volume. */
function moveDirectory(from: string, to: string): void {
  try {
    fs.renameSync(from, to);
  } catch {
    fs.cpSync(from, to, { recursive: true });
    fs.rmSync(from, { recursive: true, force: true });
  }
}

export default globalTeardown;
