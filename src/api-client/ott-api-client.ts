import { APIRequestContext } from '@playwright/test';
import { BaseApiClient } from './base-api-client';
import { ServerErrorSink } from '../core/report/service-error-recorder';

export class OttApiClient extends BaseApiClient {
    constructor(request: APIRequestContext, serverErrors?: ServerErrorSink) {
        super(request, serverErrors);
    }

    async read<T>(path: string): Promise<T> {
        const response = await this.get(path);
        return await response.json() as T;
    }
}
