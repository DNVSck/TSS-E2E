import { APIRequestContext } from '@playwright/test';
import { BaseApiClient } from './base-api-client';
import { BatchJob, buildAdhocBatchRequest } from '../test-data/payload/batch-job-payload';

const ADHOC_BATCH_PATH = 'businessapplication/rest/api/admin/batch/instance/adhoc';

interface AdminEnvelope {
    status?: { error?: boolean; message?: string | null };
}

export class CaseManagementApiClient extends BaseApiClient {
    constructor(request: APIRequestContext) {
        super(request);
    }

    async runBatchJob(job: BatchJob): Promise<void> {
        const response = await this.post(ADHOC_BATCH_PATH, buildAdhocBatchRequest(job));
        await this.assertAccepted(job, response.json());
    }

    private async assertAccepted(job: BatchJob, body: Promise<unknown>): Promise<void> {
        const envelope = await body as AdminEnvelope;

        if (envelope?.status?.error) {
            throw new Error(
                `Case management refused to run "${job.id}" (${job.type}): `
                + `${envelope.status.message ?? 'no message given'}.`
            );
        }
    }
}
