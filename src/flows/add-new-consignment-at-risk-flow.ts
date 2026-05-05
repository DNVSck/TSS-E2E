import { ConsignmentDeclarePage } from "../page-object/consignment-declare-page";
import { consignment, ConsignmentData } from "../test-data/consignment";

export class AddNewConsignmentAtRiskFlow {
    constructor(
        private readonly consignmentDeclarePage: ConsignmentDeclarePage
    ) { }

    async AddNewConsignmentAtRiskDetails(input: ConsignmentData): Promise<void> {
        await this.consignmentDeclarePage.isGoodsAtRisk(input.isGoodsAtRisk!);
        await this.consignmentDeclarePage.clickContinueButton();
    }
}