import { GoodsMovementTaskListPage } from '../page-object/goods-movement-task-list-page';
import { NewGoodsMovementDeclarePage } from '../page-object/new-goods-movement-declare-page';

import { MovementData } from '../test-data/movements';

export class MovementHeaderDeclarationFlow {
    constructor(
        private readonly goodsMovementTaskListPage: GoodsMovementTaskListPage,
    ) { }


    async completeMovementHeaderDeclaration(input: MovementData): Promise<void> {
        await this.goodsMovementTaskListPage.clickTransportDetails();

    }
}
