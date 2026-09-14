import { TraderApiClient, requiredField } from '../../api-client/trader-api-client';
import { ConsignmentPayload } from '../../test-data/payload/trader-api/consignment-payload';
import { TRADER_API_PATH } from '../../constant/trader-api/trader-api-path-constant';
import { buildPath } from '../../helper/api-path-helper';
import { OP_TYPE } from '../../constant/trader-api/trader-api-request-constant';

export class ConsignmentService {
    constructor(private readonly api: TraderApiClient) { }

    async createConsignment(consignment: ConsignmentPayload): Promise<string> {
        const call = 'Create a consignment';
        const result = await this.api.send(
            buildPath(TRADER_API_PATH.CreateConsignment),
            { op_type: OP_TYPE.CREATE, ...consignment },
            call
        );
        return requiredField(result, 'reference', call);
    }

    async submitConsignment(consignmentNumber: string): Promise<void> {
        await this.api.send(
            buildPath(TRADER_API_PATH.SubmitConsignment),
            { op_type: OP_TYPE.SUBMIT, consignment_number: consignmentNumber },
            `Submit consignment ${consignmentNumber}`
        );
    }
}
