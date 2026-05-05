import { ConsignmentDeclarePage } from "../page-object/consignment-declare-page";
import { consignment, ConsignmentData } from "../test-data/consignment";

export class AddNewConsignmentBuyerEoriFlow {
    constructor(
        private readonly consignmentDeclarePage: ConsignmentDeclarePage
    ) { }

    async AddNewConsignmentBuyerEoriDetails(input: ConsignmentData): Promise<void> {

        await this.consignmentDeclarePage.isBuyerTheSameAsImporter(input.isBuyerEORISameAsImporter!);
        await this.consignmentDeclarePage.clickContinueButton();


    }
}