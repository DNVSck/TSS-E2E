import type { BrowserContext, Request, Response, TestInfo } from '@playwright/test';

const SERVER_ERROR_FROM = 500;

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
}

export interface ServerErrorSink {
    recordServerError(error: Omit<ServiceError, 'at'>): void;
}

export class ServiceErrorRecorder implements ServerErrorSink {
    private readonly seen: ServiceError[] = [];

    constructor(private readonly origin: string) { }

    watch(context: BrowserContext, who: string): void {
        context.on('response', response => this.record(response, who));
        context.on('requestfailed', request => this.recordFailure(request, who));
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

    private record(response: Response, who: string): void {
        const request = response.request();

        if (response.status() < SERVER_ERROR_FROM || !this.isWatched(request)) {
            return;
        }

        const headers = response.headers();
        this.recordServerError({
            who,
            method: request.method(),
            status: response.status(),
            path: new URL(response.url()).pathname,
            servedBy: headers['x-cache']?.startsWith('Error') ? headers['x-cache'] : headers['server'],
        });
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
