import { ConsignmentDeclarePage } from '../page-object/consignment-declare-page';
import { ConsignmentData } from '../test-data/consignment';

export class AddNewConsignmentControlledGoodsFlow {
    constructor(
        private readonly consignmentDeclarePage: ConsignmentDeclarePage
    ) { }

    async AddNewConsignmentControlledGoodsDetails(input: ConsignmentData): Promise<void> {
        await this.consignmentDeclarePage.isControlledGoods(input.isControlledGoods);
        await this.consignmentDeclarePage.clickContinueButton();
    }
}