import { MovementOverviewFlow, GeneratedConsignment } from '../movement/movement-overview-flow';
import { ConsignmentOverviewFlow } from '../consignment/consignment-overview-flow';
import { GoodsJourneyContext } from '../goods-item/add-new-ens-goods-item-flow';
import { CreateDraftEnsDeclarationFlow, EnsDeclarationOptions } from './create-draft-ens-declaration-flow';
import { requiresWarehouseIdentifier } from '../../helper/procedure-code-helper';
import { SUPERVISING_CUSTOMS_OFFICE } from '../../constant/supervising-customs-office-constant';

export interface EnsDeclarationResult {
    transportDocumentNumber: string;
    movementLrn: string;
    ensMrn: string;
    generatedConsignment?: GeneratedConsignment;
}

export class CreateAndSubmitEnsDeclarationFlow {
    constructor(
        private readonly createDraftEnsDeclarationFlow: CreateDraftEnsDeclarationFlow,
        private readonly consignmentOverviewFlow: ConsignmentOverviewFlow,
        private readonly movementOverviewFlow: MovementOverviewFlow,
    ) { }

    async completeEnsDeclarationFlow(options: EnsDeclarationOptions): Promise<EnsDeclarationResult> {
        const draft = await this.createDraftEnsDeclarationFlow.createDraftEnsDeclaration(options);

        // The draft ends on the goods-item overview; submitConsignment walks back up
        // the breadcrumb itself, so there is nothing to navigate here.
        await this.consignmentOverviewFlow.submitConsignment();
        const { ensMrn, generatedConsignment } =
            await this.verifyPostSubmit(draft.goodsJourney, draft.procedureCode);

        return {
            transportDocumentNumber: draft.transportDocumentNumber,
            movementLrn: draft.movementLrn,
            ensMrn,
            generatedConsignment,
        };
    }

    /**
     * Post-submit verification. The conditional detail check runs before the shared
     * authorised-movement check, so the interleaved ordering stays owned here rather
     * than leaking into each spec.
     *
     * Each non-ENS-only journey auto-generates one linked consignment: SFD
     * (controlled goods), IMMI, or EIDR (controlled goods = No). SFD/IMMI are
     * verified as "Awaiting arrival" with an MRN; EIDR lands "Trader Input Required"
     * with NO MRN (it is never authorised with one). Verify whichever applies, then
     * confirm the ENS consignment MRN is returned (the smoke proof-of-life).
     */
    private async verifyPostSubmit(
        goodsJourney: GoodsJourneyContext,
        goodsProcedureCode: string
    ): Promise<{ ensMrn: string; generatedConsignment?: GeneratedConsignment }> {
        await this.movementOverviewFlow.waitForSubmittedMovementOverview();

        let generatedConsignment: GeneratedConsignment | undefined;

        if (goodsJourney.useIMMI) {
            // A warehoused procedure code makes the service derive a supervising
            // customs office; every other code leaves the row off the page entirely.
            generatedConsignment = await this.movementOverviewFlow.verifyImmiConsignmentDetail(
                requiresWarehouseIdentifier(goodsProcedureCode)
                    ? SUPERVISING_CUSTOMS_OFFICE.GBBEL004
                    : undefined
            );
        } else if (goodsJourney.isControlledGoods) {
            generatedConsignment = await this.movementOverviewFlow.verifySfdConsignmentDetail();
        } else if (!goodsJourney.isEnsOnly) {
            // The remaining full journey (non-IMMI, controlled goods = No) is EIDR - the
            // one generated declaration that never carries an MRN, so nothing outside
            // the browser can name it and nothing is returned for it.
            await this.movementOverviewFlow.verifyEidrConsignmentDetail();
        }

        // Submitting auto-returns to the movement overview.
        const ensMrn = await this.movementOverviewFlow.verifyEnsConsignmentDetail();
        return { ensMrn, generatedConsignment };
    }
}
