import * as fs from 'node:fs';
import * as path from 'node:path';
import type { BrowserContext, Page, Request, Response, TestInfo } from '@playwright/test';

const SERVER_ERROR_FROM = 500;

const OUTAGE_STATUSES: ReadonlySet<number> = new Set([502, 503, 504]);

export const SERVICE_UNAVAILABLE = 'Service unavailable';

const SERVER_ERROR = 'Server error';

const UNAVAILABLE_MARKER = 'data-service-unavailable';

const ROUTE_DATA_SUFFIX = '.data';

interface PageLoad {
    page: Page;
    kind: 'document' | 'route' | 'module';
}

const MODULE_RESOURCE = 'script';

const PAGE_RESOURCES = new Set(['document', 'fetch', 'xhr', 'script', 'stylesheet']);

const ABORTED_BY_THE_PAGE = 'net::ERR_ABORTED';

export interface ServiceError {
    at: Date;
    who: string;
    method: string;
    status?: number;
    failure?: string;
    path: string;
    servedBy?: string;
    pageLoad?: boolean;
}

interface FailedAttempt {
    serviceOutage: boolean;
    message: string;
}

const failedAttemptFile = (testInfo: TestInfo): string =>
    path.join(testInfo.project.outputDir, '.failed-attempts', `${testInfo.testId}.json`);

export function recordFailedAttempt(testInfo: TestInfo, recorder: ServiceErrorRecorder): void {
    const message = testInfo.error?.message ?? '';
    const attempt: FailedAttempt = {
        serviceOutage: recorder.sawServiceOutage || message.includes(SERVICE_UNAVAILABLE),
        message,
    };

    const file = failedAttemptFile(testInfo);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(attempt));
}

export function explainPageLoadError(testInfo: TestInfo, recorder: ServiceErrorRecorder): void {
    const pageLoadError = recorder.firstPageLoadError;
    if (!pageLoadError) {
        return;
    }

    const message = pageLoadErrorMessage(pageLoadError);
    if (!testInfo.errors.some(error => error.message?.includes(message))) {
        throw new Error(`${message} - recorded before the failure above, which is its consequence`);
    }
}

export function refuseRetryUnlessServiceOutage(testInfo: TestInfo): void {
    if (testInfo.retry === 0) {
        return;
    }

    let previous: FailedAttempt | undefined;
    try {
        previous = JSON.parse(fs.readFileSync(failedAttemptFile(testInfo), 'utf8')) as FailedAttempt;
    } catch {
        previous = undefined;
    }

    if (!previous?.serviceOutage) {
        throw new Error(
            `Not retried - attempt ${testInfo.retry} did not fail on a service outage: `
            + (previous?.message || 'no failure recorded')
        );
    }
}

function isOutage(error: ServiceError): boolean {
    return error.status !== undefined && OUTAGE_STATUSES.has(error.status);
}

export function pageLoadErrorMessage(error: ServiceError): string {
    const servedBy = error.servedBy ? ` (served by ${error.servedBy})` : '';
    const kind = isOutage(error) ? SERVICE_UNAVAILABLE : SERVER_ERROR;
    return `${kind} - HTTP ${error.status} on ${error.method} ${error.path}${servedBy}`
        + ' - the screen under test never rendered';
}

export interface ServerErrorSink {
    recordServerError(error: Omit<ServiceError, 'at'>): void;
}

export class ServiceErrorRecorder implements ServerErrorSink {
    private readonly seen: ServiceError[] = [];
    private readonly unavailablePages = new WeakMap<Page, ServiceError>();

    constructor(private readonly origin: string) { }

    watch(context: BrowserContext, who: string): void {
        context.on('response', response => this.record(response, who));
        context.on('requestfailed', request => this.recordFailure(request, who));
        context.on('page', page => void this.failFastOn(page));
    }

    get sawServiceOutage(): boolean {
        return this.seen.some(error => error.pageLoad && isOutage(error));
    }

    get firstPageLoadError(): ServiceError | undefined {
        return this.seen.find(error => error.pageLoad);
    }

    recordServerError(error: Omit<ServiceError, 'at'>): void {
        this.seen.push({ at: new Date(), ...error });
    }

    get errors(): readonly ServiceError[] {
        return this.seen;
    }

    async attachTo(testInfo: TestInfo): Promise<void> {
        if (this.seen.length === 0) {
            return;
        }

        const lines = this.seen.map(error =>
            `${error.at.toISOString()}  ${error.status ?? error.failure}  ${error.method} ${error.path}  (${[error.who, error.servedBy].filter(Boolean).join(', ')})`);

        testInfo.annotations.push({
            type: 'Service error',
            description: `${this.seen.length} service error(s) while the test ran - first: ${lines[0]}`,
        });
        await testInfo.attach('service-errors.txt', {
            body: [
                `${this.seen.length} request(s) to a service or mock failed or were answered with a 5xx during this test.`,
                'A screen that never rendered, or an element that never appeared, right after one',
                'of these is the server failing, not the test or the rule it checks.',
                '',
                ...lines,
            ].join('\n'),
            contentType: 'text/plain',
        });
    }

    private async failFastOn(page: Page): Promise<void> {
        await page.addLocatorHandler(page.locator(`html[${UNAVAILABLE_MARKER}]`), async () => {
            const error = this.unavailablePages.get(page);
            if (error) {
                throw new Error(pageLoadErrorMessage(error));
            }
        }, { noWaitAfter: true }).catch(() => { });
    }

    private record(response: Response, who: string): void {
        const request = response.request();

        if (!this.isWatched(request)) {
            return;
        }

        const load = this.pageLoadOf(request);
        if (response.status() < SERVER_ERROR_FROM) {
            if (load && load.kind !== 'module') {
                this.unavailablePages.delete(load.page);
                if (load.kind === 'route') {
                    this.markUnavailable(load.page, false);
                }
            }
            return;
        }

        const headers = response.headers();
        const error: ServiceError = {
            at: new Date(),
            who,
            method: request.method(),
            status: response.status(),
            path: new URL(response.url()).pathname,
            servedBy: headers['x-cache']?.startsWith('Error') ? headers['x-cache'] : headers['server'],
            pageLoad: Boolean(load),
        };
        this.seen.push(error);

        if (!load || load.kind === 'module') {
            return;
        }

        this.unavailablePages.set(load.page, error);
        if (load.kind === 'document') {
            load.page.once('domcontentloaded', () => this.markUnavailable(load.page, true));
        } else {
            this.markUnavailable(load.page, true);
        }
    }

    private markUnavailable(page: Page, unavailable: boolean): void {
        page.evaluate(([marker, on]) => {
            if (on) {
                document.documentElement.setAttribute(marker, '');
            } else {
                document.documentElement.removeAttribute(marker);
            }
        }, [UNAVAILABLE_MARKER, unavailable] as const).catch(() => { });
    }

    private pageLoadOf(request: Request): PageLoad | undefined {
        const page = this.mainFramePageOf(request);
        if (!page) {
            return undefined;
        }

        if (request.isNavigationRequest()) {
            return { page, kind: 'document' };
        }

        if (request.method() !== 'GET') {
            return undefined;
        }

        if (new URL(request.url()).pathname.endsWith(ROUTE_DATA_SUFFIX)) {
            return { page, kind: 'route' };
        }

        return request.resourceType() === MODULE_RESOURCE ? { page, kind: 'module' } : undefined;
    }

    private mainFramePageOf(request: Request): Page | undefined {
        try {
            const frame = request.frame();
            return frame.parentFrame() ? undefined : frame.page();
        } catch {
            return undefined;
        }
    }

    private recordFailure(request: Request, who: string): void {
        const failure = request.failure()?.errorText;

        if (!failure || failure === ABORTED_BY_THE_PAGE || !this.isWatched(request)) {
            return;
        }

        this.recordServerError({
            who,
            method: request.method(),
            failure,
            path: new URL(request.url()).pathname,
        });
    }

    private isWatched(request: Request): boolean {
        return PAGE_RESOURCES.has(request.resourceType()) && request.url().startsWith(this.origin);
    }
}
