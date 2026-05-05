import { ConsignmentDeclarePage } from '../page-object/consignment-declare-page';
import { ConsignmentData } from '../test-data/consignment';
export class AddNewConsignmentImmiFlow {
    constructor(
        private readonly consignmentDeclarePage: ConsignmentDeclarePage
    ) { }

    async AddNewConsignmentImmiDetails(input: ConsignmentData): Promise<void> {
        await this.consignmentDeclarePage.isUsingIMMI(input.useIMMI);
        await this.consignmentDeclarePage.clickContinueButton();
    }
}