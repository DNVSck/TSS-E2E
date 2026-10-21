import { ConsignmentOverviewFlow } from '../consignment/consignment-overview-flow';
import { MovementOverviewFlow } from '../movement/movement-overview-flow';
import { GoodsOverviewFlow } from '../goods-item/goods-overview-flow';
import { DeclarationAccessFlow, RecordUrls } from '../declaration-access-flow';
import { ContainerIdentification } from '../../test-data/consignment-data';
import { HolderOfAuthorisationData } from '../../test-data/holder-of-authorisation-data';
import { DocumentReferenceData } from '../../test-data/document-reference-data';
import { ReportLog } from '../../core/report/report-log';
import { TranslationKey } from '../../fixtures/locale-fixture';
import { standaloneSubmittedStatusKey } from '../../helper/declaration-status-helper';

const CORRECTION_ACCEPTED = 'status.awaitingArrival';

type CorrectionTarget = 'consignment' | 'goodsItem';

interface Correction {
    step: string;
    locate: () => Promise<RecordUrls>;
    on: CorrectionTarget;
    apply: () => Promise<void>;
    acceptedStatusKey?: TranslationKey;
}

export class ResubmitDeclarationFlow {
    constructor(
        private readonly consignmentOverviewFlow: ConsignmentOverviewFlow,
        private readonly movementOverviewFlow: MovementOverviewFlow,
        private readonly goodsOverviewFlow: GoodsOverviewFlow,
        private readonly declarationAccessFlow: DeclarationAccessFlow,
    ) { }

    async correctHolderOfAuthorisationAndResubmitSfd(
        holder: HolderOfAuthorisationData
    ): Promise<void> {
        await this.correctAndResubmit({
            step: 'Correct the authorisation CDS refused and resubmit the SFD',
            locate: () => this.declarationAccessFlow.locateSfdConsignmentRecords(),
            on: 'consignment',
            apply: () => this.consignmentOverviewFlow.correctHolderOfAuthorisation(holder),
        });
    }

    async correctUkimsDocumentAndResubmitImmi(document: DocumentReferenceData): Promise<void> {
        await this.correctAndResubmit({
            step: 'Correct the UKIMS document CDS refused and resubmit the IMMI',
            locate: () => this.declarationAccessFlow.locateImmiConsignmentRecords(),
            on: 'goodsItem',
            apply: () => this.goodsOverviewFlow.correctDocumentReference(document),
        });
    }

    async removeAuthorisationAndResubmitStandaloneSfd(typeCode: string): Promise<void> {
        await this.correctAndResubmit({
            step: 'Remove the authorisation CDS refused and resubmit the standalone SFD',
            locate: () => this.declarationAccessFlow.locateRecordsHere(),
            on: 'consignment',
            apply: () => this.consignmentOverviewFlow.removeHolderOfAuthorisation(typeCode),
        });
    }

    async declareDocumentAndResubmitStandaloneImmi(document: DocumentReferenceData): Promise<void> {
        await this.correctAndResubmit({
            step: 'Declare the document CDS refused the standalone IMMI for and resubmit it',
            locate: () => this.declarationAccessFlow.locateRecordsHere(),
            on: 'goodsItem',
            apply: () => this.goodsOverviewFlow.declareDocumentReferences([document]),
        });
    }

    async declareAdditionalProcedureCodesAndResubmitArrivedImmi(codes: string[]): Promise<void> {
        await this.correctAndResubmit({
            step: 'Declare the additional procedure codes CDS refused the IMMI for and resubmit it',
            locate: () => this.declarationAccessFlow.locateRecordsHere(),
            on: 'goodsItem',
            apply: () => this.goodsOverviewFlow.declareAdditionalProcedureCodes(codes),
            acceptedStatusKey: standaloneSubmittedStatusKey(false),
        });
    }

    private async correctAndResubmit(correction: Correction): Promise<void> {
        await ReportLog.step(correction.step, async () => {
            const records = await correction.locate();
            const record = correction.on === 'goodsItem' ? records.goodsItem : records.consignment;

            if (!record) {
                throw new Error(
                    `The refused declaration lists no ${correction.on}, so the record CDS `
                    + `objected to cannot be reached. The correction was never attempted.`
                );
            }

            await this.declarationAccessFlow.openRecord(record);
            await correction.apply();

            await this.consignmentOverviewFlow.goToConsignmentOverview();
            await this.consignmentOverviewFlow.resubmitConsignment();

            await this.declarationAccessFlow
                .verifyCorrectionAcceptedByCds(records.consignment, correction.acceptedStatusKey ?? CORRECTION_ACCEPTED);
        });
    }

    /**
     * The correction a trader makes when ICS2 refuses the container identification,
     * and the resubmission that follows it.
     *
     * Apart from the four above: ICS2 refuses the ENS consignment itself, so there is no
     * generated record to locate, and the evidence is the MRN arriving rather than a
     * status moving - which is why it reads the baseline first and answers with the MRN.
     */
    async correctContainerAndResubmitEnsConsignment(
        container: ContainerIdentification
    ): Promise<string> {
        return ReportLog.step('Correct the container ICS2 refused and resubmit the ENS consignment', async () => {
            await this.movementOverviewFlow.verifyEnsConsignmentHasNoMrn();

            await this.consignmentOverviewFlow.goToConsignmentOverview();
            await this.consignmentOverviewFlow.correctContainerIdentification(
                container.containerIdentifierNumber,
                container.containerSize,
                container.containerPackedStatus,
                container.containerSupplierType
            );
            await this.consignmentOverviewFlow.resubmitConsignment();

            await this.movementOverviewFlow.waitForSubmittedMovementOverview();
            // traderInputIsSettled false: "Trader Input Required" is the state being left
            // behind here, so treating it as the end of the wait would return an empty MRN
            // before the service had finished issuing one.
            return this.movementOverviewFlow.verifyEnsConsignmentDetail({ traderInputIsSettled: false });
        });
    }
}
