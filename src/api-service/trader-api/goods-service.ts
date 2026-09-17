import { TraderApiClient, requiredField } from '../../api-client/trader-api-client';
import { GoodsPayload } from '../../test-data/payload/trader-api/goods-payload';
import { TRADER_API_PATH } from '../../constant/trader-api/trader-api-path-constant';
import { buildPath } from '../../helper/api-path-helper';
import { OP_TYPE } from '../../constant/trader-api/trader-api-request-constant';

export class GoodsService {
    constructor(private readonly api: TraderApiClient) { }

    async createGoodsItem(goodsItem: GoodsPayload): Promise<string> {
        const call = 'Create a goods item';
        const result = await this.api.send(
            buildPath(TRADER_API_PATH.Goods),
            { op_type: OP_TYPE.CREATE, ...goodsItem },
            call
        );
        return requiredField(result, 'reference', call);
    }
}
