import { GoodsMovementTaskListPage } from '../page-object/goods-movement-task-list-page';
import { NewGoodsMovementDeclarePage } from '../page-object/new-goods-movement-declare-page';

export class MovementHeaderDeclarationFlow {
    constructor(
        private readonly goodsMovementTaskListPage: GoodsMovementTaskListPage,
        private readonly newGoodsMovementDeclarePage: NewGoodsMovementDeclarePage
    ) { }


    async completeMovementHeaderDeclaration(): Promise<void> {
        this.goodsMovementTaskListPage.clickTransportDetails();

    }
}
