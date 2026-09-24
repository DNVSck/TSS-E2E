import { TraderApiClient, TraderApiResult, requiredField } from '../../api-client/trader-api-client';
import { TRADER_API_PATH } from '../../constant/trader-api/trader-api-path-constant';
import { buildPath } from '../../helper/api-path-helper';

export class SupplementaryDeclarationService {
    constructor(private readonly api: TraderApiClient) { }

    async readStatus(reference: string): Promise<string> {
        const call = `Read the status of supplementary declaration ${reference}`;
        const result = await this.api.read<TraderApiResult>(
            buildPath(
                TRADER_API_PATH.SupplementaryDeclarationStatusByReference, { reference }
            ), call
        );

        return requiredField(result, 'status', call);
    }
}
