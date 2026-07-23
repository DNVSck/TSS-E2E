import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { execSync } from 'node:child_process';

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

  /**
   * Build the report outside the project, then move it in.
   *
   * Allure writes the report to <output>/awesome and then renames that
   * directory up a level. On Windows that rename fails with EPERM whenever an
   * editor's file watcher still holds handles on the hundreds of files just
   * written - which is every run with the project open in VS Code. Staging
   * outside the watched tree sidesteps it, and costs one directory move.
   */
  const stagingPath = fs.mkdtempSync(path.join(os.tmpdir(), 'allure-report-'));
  const command = `npx allure generate "${allureResultsPath}" -o "${stagingPath}"`;

  try {
    execSync(command, { stdio: 'inherit' });

    fs.rmSync(allureReportPath, { recursive: true, force: true });
    moveDirectory(stagingPath, allureReportPath);

    console.log(`Allure report generated at ${allureReportPath}`);
  } catch (error) {
    fs.rmSync(stagingPath, { recursive: true, force: true });

    // Report the command as well as the reason: a silent "generation failed"
    // warning has twice hidden the real cause (a missing JRE on CI, then an
    // option the CLI no longer accepts).
    console.warn(
      'Allure report generation failed.\n' +
      `  Command: ${command}\n` +
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
