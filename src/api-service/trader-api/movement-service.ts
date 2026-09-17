import { TraderApiClient, requiredField } from '../../api-client/trader-api-client';
import { HeaderPayload } from '../../test-data/payload/trader-api/header-payload';
import { TRADER_API_PATH } from '../../constant/trader-api/trader-api-path-constant';
import { buildPath } from '../../helper/api-path-helper';
import { OP_TYPE } from '../../constant/trader-api/trader-api-request-constant';

export class MovementService {
    constructor(private readonly api: TraderApiClient) { }

    async createHeader(header: HeaderPayload): Promise<string> {
        const call = 'Create a movement header';
        const result = await this.api.send(
            buildPath(TRADER_API_PATH.Headers),
            { op_type: OP_TYPE.CREATE, ...header },
            call
        );
        return requiredField(result, 'reference', call);
    }
}
