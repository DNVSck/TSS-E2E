import { MovementData } from './movements-data';
import { ConsignmentData } from './consignment-data';
import { GoodsData } from './goods-data';
import { previousDocument } from './previous-document-data';
import { TYPE_OF_MOVEMENT_OPTION_CODE } from '../constant/type-of-movement-code-constant';
import { ensSfdGoodsDocuments } from './document-reference-data';

/**
 * The frontier movement a supplementary declaration is raised FROM.
 *
 * Not a declaration in its own right - it is the three sets of answers that shape the
 * ENS-SFD journey run to produce an SD, expressed the way
 * `completeEnsDeclarationFlow` asks for them. Everything else about that journey comes
 * from its own defaults; only what this journey needs differently is stated here.
 *
 * Kept apart from SupplementaryDeclarationData because they answer different screens at
 * different times: this one is spent before the SD exists, that one after. A single
 * object holding both would let a spec set a field that had already stopped mattering.
 */
export interface SupplementaryDeclarationMovementData {
    movementOverrides: Partial<MovementData>;
    consignmentOverrides: Partial<ConsignmentData>;
    goodsItemOverrides: Partial<GoodsData>;
}

const defaults: SupplementaryDeclarationMovementData = {
    movementOverrides: {
        typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
    },
    consignmentOverrides: {
        headerPreviousDocuments: [
            previousDocument({ documentReference: '3XI352196303000-12345' })
        ],
    },
    goodsItemOverrides: {
        documentReferences: ensSfdGoodsDocuments(),
    },
};

/**
 * Build the answers for the movement a supplementary declaration is raised from.
 *
 * Overrides replace a whole set rather than merging into it - a spec changing the goods
 * item says everything it wants that goods item to carry. Merging would let a document
 * this journey no longer cites survive because nobody remembered to remove it.
 */
export const supplementaryDeclarationMovement = (
    overrides?: Partial<SupplementaryDeclarationMovementData>
): SupplementaryDeclarationMovementData => ({
    ...defaults,
    ...overrides,
});
