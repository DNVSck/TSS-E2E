import { TraderApiClient, TraderApiResult, requiredField } from '../../api-client/trader-api-client';
import { ConsignmentPayload } from '../../test-data/payload/trader-api/consignment-payload';
import { TRADER_API_PATH } from '../../constant/trader-api/trader-api-path-constant';
import { buildPath } from '../../helper/api-path-helper';
import { OP_TYPE } from '../../constant/trader-api/trader-api-request-constant';

interface ConsignmentResult extends TraderApiResult {
    movement_reference_number?: string;
}

export class ConsignmentService {
    constructor(private readonly api: TraderApiClient) { }

    async readMovementReferenceNumber(consignmentNumber: string): Promise<string> {
        const result = await this.api.read<ConsignmentResult>(
            buildPath(TRADER_API_PATH.ConsignmentByReference, { reference: consignmentNumber }),
            `Read consignment ${consignmentNumber}`
        );

        return result.movement_reference_number?.trim() ?? '';
    }

    async createConsignment(consignment: ConsignmentPayload): Promise<string> {
        const call = 'Create a consignment';
        const result = await this.api.send(
            buildPath(TRADER_API_PATH.Consignments),
            { op_type: OP_TYPE.CREATE, ...consignment },
            call
        );
        return requiredField(result, 'reference', call);
    }

    async submitConsignment(consignmentNumber: string): Promise<void> {
        await this.api.send(
            buildPath(TRADER_API_PATH.Consignments),
            { op_type: OP_TYPE.SUBMIT, consignment_number: consignmentNumber },
            `Submit consignment ${consignmentNumber}`
        );
    }
}
