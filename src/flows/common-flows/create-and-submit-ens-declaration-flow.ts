import { MovementOverviewFlow } from '../movement/movement-overview-flow';
import { ConsignmentOverviewFlow } from '../consignment/consignment-overview-flow';
import { GoodsJourneyContext } from '../goods-item/add-new-ens-goods-item-flow';
import { CreateDraftEnsDeclarationFlow, EnsDeclarationOptions } from './create-draft-ens-declaration-flow';
import { requiresWarehouseIdentifier } from '../../helper/procedure-code-helper';
import { SUPERVISING_CUSTOMS_OFFICE } from '../../constant/supervising-customs-office-constant';

/**
 * The HAPPY-PATH ENS journey: build the declaration, submit it, and verify the
 * service authorised it.
 *
 * Building is delegated to CreateDraftEnsDeclarationFlow, which the authority specs
 * also use - they need the same declaration but expect a different ending, so what
 * happens AFTER submit is the only thing that lives here.
 */
export class CreateAndSubmitEnsDeclarationFlow {
    constructor(
        private readonly createDraftEnsDeclarationFlow: CreateDraftEnsDeclarationFlow,
        private readonly consignmentOverviewFlow: ConsignmentOverviewFlow,
        private readonly movementOverviewFlow: MovementOverviewFlow,
    ) { }

    async completeEnsDeclarationFlow(
        options: EnsDeclarationOptions
    ): Promise<{ transportDocumentNumber: string; ensMrn: string }> {
        const draft = await this.createDraftEnsDeclarationFlow.createDraftEnsDeclaration(options);

        // The goods-item work above leaves the browser on the GOODS ITEM overview;
        // submit lives on the consignment overview, so walk back up first.
        await this.consignmentOverviewFlow.goToConsignmentOverview();

        await this.consignmentOverviewFlow.submitConsignment();
        const ensMrn = await this.verifyPostSubmit(draft.goodsJourney, draft.procedureCode);

        return { transportDocumentNumber: draft.transportDocumentNumber, ensMrn };
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
    ): Promise<string> {
        await this.movementOverviewFlow.waitForSubmittedMovementOverview();
        if (goodsJourney.useIMMI) {
            // A warehoused procedure code makes the service derive a supervising
            // customs office; every other code leaves the row off the page entirely.
            await this.movementOverviewFlow.verifyImmiConsignmentDetail(
                requiresWarehouseIdentifier(goodsProcedureCode)
                    ? SUPERVISING_CUSTOMS_OFFICE.GBBEL004
                    : undefined
            );
        } else if (goodsJourney.isControlledGoods) {
            await this.movementOverviewFlow.verifySfdConsignmentDetail();
        } else if (!goodsJourney.isEnsOnly) {
            // The remaining full journey (non-IMMI, controlled goods = No) is EIDR.
            await this.movementOverviewFlow.verifyEidrConsignmentDetail();
        }
        // Submitting auto-returns to the movement overview.
        return this.movementOverviewFlow.verifyEnsConsignmentDetail();
    }
}
