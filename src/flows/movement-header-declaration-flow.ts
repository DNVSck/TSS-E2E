import { GoodsMovementTaskListPage } from '../page-object/goods-movement-task-list-page';
import { NewGoodsMovementDeclarePage } from '../page-object/new-goods-movement-declare-page';
import { ReportLog } from '../core/report/report-log';

export class MovementHeaderDeclarationFlow {
    constructor(
        private readonly goodsMovementTaskListPage: GoodsMovementTaskListPage,
        private readonly newGoodsMovementDeclarePage: NewGoodsMovementDeclarePage
    ) { }


    async completeMovementHeaderDeclaration(): Promise<void> {
        this.goodsMovementTaskListPage.clickTransportDetails();

    }
}
