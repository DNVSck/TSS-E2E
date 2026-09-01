import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * Open an Allure report that was downloaded from the pipeline.
 *
 * A downloaded report cannot be opened by double-clicking its index.html: the page
 * fetches its data over XHR, and the browser refuses those requests from `file://`, so
 * it renders empty. It has to be served - which is what `allure open` does - and this
 * script exists to remove the two things that make that annoying:
 *
 *   - The artifact unzips into a folder holding another folder of the same name, so the
 *     path anyone types by hand is one level short of the report.
 *   - The path is long and carries a build id nobody remembers.
 *
 * With no argument it takes the most recently modified `allure-report*` folder in the
 * Downloads directory, which is almost always the one just downloaded.
 */

const REPORT_FOLDER_PREFIX = 'allure-report';

/** How deep to look for the index.html below the folder that was pointed at. */
const MAX_DESCENT = 3;

function downloadsDirectory(): string {
    return path.join(os.homedir(), 'Downloads');
}

function isReportRoot(directory: string): boolean {
    return fs.existsSync(path.join(directory, 'index.html'));
}

/**
 * The report root at or below `directory`.
 *
 * Descends through single-child folders only. A folder with several children is either
 * the report itself or not a report at all, and guessing between siblings would open
 * whichever happened to sort first.
 */
function findReportRoot(directory: string, depth = 0): string | undefined {
    if (isReportRoot(directory)) return directory;
    if (depth >= MAX_DESCENT) return undefined;

    const children = fs.readdirSync(directory, { withFileTypes: true })
        .filter(entry => entry.isDirectory());

    if (children.length !== 1) return undefined;

    return findReportRoot(path.join(directory, children[0].name), depth + 1);
}

/** The most recently modified downloaded report folder, if there is one. */
function newestDownloadedReport(): string | undefined {
    const downloads = downloadsDirectory();
    if (!fs.existsSync(downloads)) return undefined;

    const candidates = fs.readdirSync(downloads, { withFileTypes: true })
        .filter(entry => entry.isDirectory() && entry.name.startsWith(REPORT_FOLDER_PREFIX))
        .map(entry => path.join(downloads, entry.name))
        .map(directory => ({ directory, modified: fs.statSync(directory).mtimeMs }))
        .sort((a, b) => b.modified - a.modified);

    return candidates[0]?.directory;
}

function resolveRequestedDirectory(): string {
    const [requested] = process.argv.slice(2);

    if (requested) {
        const resolved = path.resolve(requested);
        if (!fs.existsSync(resolved)) {
            throw new Error(`No such folder: ${resolved}`);
        }
        return resolved;
    }

    const newest = newestDownloadedReport();
    if (!newest) {
        throw new Error(
            `No "${REPORT_FOLDER_PREFIX}*" folder found in ${downloadsDirectory()}. ` +
            'Download the artifact from the pipeline and unzip it there, or pass the ' +
            'folder as an argument.'
        );
    }
    return newest;
}

function main(): void {
    const directory = resolveRequestedDirectory();
    const reportRoot = findReportRoot(directory);

    if (!reportRoot) {
        throw new Error(
            `No index.html under ${directory}. Point this at the unzipped artifact ` +
            'folder, not at the .zip.'
        );
    }

    console.log(`Serving ${reportRoot}`);

    // Inherited stdio so Ctrl+C reaches the server, and shell:true because on Windows
    // `allure` is a .cmd shim that cannot be executed directly.
    const child = spawn('allure', ['open', reportRoot], { stdio: 'inherit', shell: true });

    child.on('exit', code => process.exit(code ?? 0));
}

main();
