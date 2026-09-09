export interface BatchJob {
    readonly id: string;
    readonly type: string;
}

export const BATCH_JOB = {
    ENS_ARRIVAL: {
        id: 'batch-schedule-ens-arrival-transition',
        type: 'ENS_ARRIVAL_TRANSITION_JOB',
    },
    EIDR_ARRIVAL: {
        id: 'batch-schedule-eidr-arrival-transition',
        type: 'EIDR_ARRIVAL_TRANSITION_JOB',
    },
} as const satisfies Record<string, BatchJob>;

const ADHOC_MODE = 'NEW';

const DEFAULT_PRIORITY = '0';

export function buildAdhocBatchRequest(job: BatchJob): Record<string, unknown> {
    return {
        id: job.id,
        type: job.type,
        mode: ADHOC_MODE,
        fields: {
            key: null,
            multiple: false,
            containerFields: [
                {
                    fieldKey: 'priority',
                    fieldType: 'INTEGER',
                    fieldValues: [DEFAULT_PRIORITY],
                },
            ],
            children: [],
        },
    };
}
