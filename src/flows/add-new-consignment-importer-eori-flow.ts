

import { ConsignmentDeclarePage } from '../page-object/consignment-declare-page';
import { DeclarationOverviewPage } from '../page-object/declaration-overview-page';
import { MovementData } from '../test-data/movements';
import { consignment, ConsignmentData } from '../test-data/consignment';

export class AddNewConsignmentImporterEoriFlow {
    constructor(
        private readonly declarationOverviewPage: DeclarationOverviewPage,
        private readonly consignmentDeclarePage: ConsignmentDeclarePage
    ) { }


    async AddNewConsignmentImporterEoriDetails(input: ConsignmentData): Promise<void> {

        await this.declarationOverviewPage.clickNewENSConsignment();

        if (input.importerEORI) {
            // needs to be fixed after EORI validation is implemented
            // bypass the issue by using any EORI number and clicking continue button
            await this.consignmentDeclarePage.inputImporterEORI(input.importerEORI);
            await this.consignmentDeclarePage.clickContinueButton();

            await this.consignmentDeclarePage.inputImporterAddress(input.importerName!, input.importerStreetAndNumber!, input.importerCity!, input.importerPostCode!, input.importerCountry!);
            await this.consignmentDeclarePage.clickContinueButton();

        }
        else if (!input.importerEORI) {
            // needs to be fixed after EORI validation is implemented
            // bypass the issue by using any EORI number and clicking continue button
            await this.consignmentDeclarePage.inputImporterEORI(input.importerEORI);
            await this.consignmentDeclarePage.clickContinueButton();

            await this.consignmentDeclarePage.inputImporterAddress(input.importerName!, input.importerStreetAndNumber!, input.importerCity!, input.importerPostCode!, input.importerCountry!);
            await this.consignmentDeclarePage.clickContinueButton();
        }
    }
}