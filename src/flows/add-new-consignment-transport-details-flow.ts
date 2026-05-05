import { ConsignmentDeclarePage } from '../page-object/consignment-declare-page';
import { ConsignmentData } from '../test-data/consignment';


export class AddNewConsignmentTransportDetailsFlow {
    constructor(
        private readonly consignmentDeclarePage: ConsignmentDeclarePage
    ) { }

    async AddNewConsignmentTransportDetails(input: ConsignmentData): Promise<void> {
        await this.consignmentDeclarePage.inputTransportDocumentNumber(input.transportDocumentNumber);

        await this.consignmentDeclarePage.selectGoodsDomesticStatus(input.isNIDOM!);

        await this.consignmentDeclarePage.selectDestinationCountry(input.destinationCountry!);
        await this.consignmentDeclarePage.clickContinueButton();
    }
}