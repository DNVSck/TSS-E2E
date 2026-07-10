import * as fs from 'node:fs';
import * as path from 'node:path';

const ALLURE_RESULTS_DIR = path.resolve(process.cwd(), 'allure-results');

/**
 * Allure classifies a failure into the first category whose regex matches, so
 * order matters: the most specific patterns come first. Without this file every
 * failure lands in the generic "Product defects" bucket.
 */
const CATEGORIES = [
    {
        name: 'Missing test data',
        matchedStatuses: ['broken', 'failed'],
        messageRegex: '.*must set ".*".*',
    },
    {
        name: 'Broken environment',
        matchedStatuses: ['broken', 'failed'],
        messageRegex: '.*(ECONNREFUSED|ENOTFOUND|net::ERR_|503|502).*',
    },
    {
        name: 'Authentication problem',
        matchedStatuses: ['broken', 'failed'],
        messageRegex: '.*(OTP_ENABLED|TOTP|credentials|sign in).*',
    },
    {
        name: 'Timeout',
        matchedStatuses: ['broken', 'failed'],
        messageRegex: '.*(Timeout|timed out|exceeded).*',
    },
    {
        name: 'Element not found',
        matchedStatuses: ['broken', 'failed'],
        messageRegex: '.*(strict mode violation|waiting for locator|no element).*',
    },
    {
        name: 'Assertion failure',
        matchedStatuses: ['failed'],
        messageRegex: String.raw`.*(expect\(|toHave|toBe).*`,
    },
    {
        name: 'Product defects',
        matchedStatuses: ['failed'],
    },
    {
        name: 'Test defects',
        matchedStatuses: ['broken'],
    },
];

/** CI providers expose the commit; shelling out to git locally is not worth it. */
function currentCommitSha(): string {
    const sha = process.env.BUILD_SOURCEVERSION ?? process.env.GITHUB_SHA;
    return sha ? sha.slice(0, 8) : 'local';
}

function writeJson(fileName: string, content: unknown): void {
    fs.writeFileSync(
        path.join(ALLURE_RESULTS_DIR, fileName),
        JSON.stringify(content, null, 2),
        'utf8'
    );
}

function writeEnvironmentInfo(): void {
    const env: Record<string, string> = {
        'Test Environment': process.env.ENV ?? 'default',
        'Base URL': process.env.BASE_URL ?? 'N/A',
        Locale: process.env.LOCALE ?? 'all',
        Retries: process.env.CI ? '2' : (process.env.RETRY_COUNT ?? '0'),
        'OTP Enabled': process.env.OTP_ENABLED ?? 'false',
        Commit: currentCommitSha(),
        'Node Version': process.version,
        OS: process.platform,
        Framework: 'Playwright + TypeScript',
    };

    const content = Object.entries(env)
        .map(([k, v]) => `${k}=${v}`)
        .join('\n');

    fs.writeFileSync(
        path.join(ALLURE_RESULTS_DIR, 'environment.properties'),
        content,
        'utf8'
    );
}

/** Only meaningful on CI — gives the Allure report a link back to the build. */
function writeExecutorInfo(): void {
    if (!process.env.CI) return;

    writeJson('executor.json', {
        name: 'Azure Pipelines',
        type: 'azure',
        buildName: process.env.BUILD_DEFINITIONNAME ?? 'TSS-E2E',
        buildOrder: Number(process.env.BUILD_BUILDID ?? 0),
        buildUrl: process.env.BUILD_BUILDURI ?? '',
        reportName: 'TSS E2E Allure Report',
    });
}

/**
 * Writes the metadata files Allure reads from `allure-results` when generating
 * the report. Call once from globalSetup, AFTER the directory has been cleaned.
 *
 * Playwright writes screenshots, videos and traces itself under `outputDir`, so
 * this does not create any artefact directories.
 */
export function initAllureResults(): void {
    fs.mkdirSync(ALLURE_RESULTS_DIR, { recursive: true });

    writeEnvironmentInfo();
    writeJson('categories.json', CATEGORIES);
    writeExecutorInfo();
}

export function getAllureResultsDir(): string {
    return ALLURE_RESULTS_DIR;
}
