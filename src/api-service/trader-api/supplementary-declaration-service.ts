import { TraderApiClient, TraderApiResult, requiredField } from '../../api-client/trader-api-client';
import { TRADER_API_PATH } from '../../constant/trader-api/trader-api-path-constant';
import { OP_TYPE, RECLASSIFICATION_TYPE, TRADER_API_YES } from '../../constant/trader-api/trader-api-request-constant';
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

    async reclassifyToImmi(reference: string): Promise<string> {
        const call = `Convert supplementary declaration ${reference} to an IMMI declaration`;
        const result = await this.api.send(
            buildPath(TRADER_API_PATH.SupplementaryDeclarations),
            {
                op_type: OP_TYPE.RECLASSIFY,
                sup_dec_number: reference,
                reclassification_type: RECLASSIFICATION_TYPE.SUPPLEMENTARY_TO_IMMI,
                internal_market_movement_complies: TRADER_API_YES,
            },
            call
        );

        return requiredField(result, 'reference', call);
    }
}
