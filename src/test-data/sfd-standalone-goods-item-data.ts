import { GoodsData } from './goods-data';
import { documentReference } from './document-reference-data';
import { DOCUMENT_CODE } from '../constant/document-code-constant';
import { DOCUMENT_STATUS } from '../constant/document-status-constant';

/**
 * The goods item an SFD standalone consignment declares.
 *
 * A Partial<GoodsData>, not a whole one - the flow layers it over the shared
 * `goods()` defaults, so this states only what SFD standalone adds. Anything every
 * SFD standalone test needs belongs HERE rather than in the spec: a spec should
 * state only what makes that one test different. Pasting the same block into each
 * test is what produced the duplication finding on the IMMI spec.
 *
 * Both SFD standalone routes share what is set below - the controlled-goods route and
 * the SFD-EIDR route declare the same item, and only the CONSIGNMENT answer decides
 * which screens it passes through. `areGoodsControlled` is deliberately NOT restated
 * here: the shared `goods()` defaults already answer it, and the EIDR route never asks
 * the question at all, so a value here would describe only half the journeys it serves.
 *
 * Previous documents and additionalProcedureCode are still unstated: they have not been
 * confirmed against the app, and inventing customs codes would be worse than leaving
 * them out. Add them here rather than in a spec when they are known, keeping
 * `...overrides` last so a spec can still vary one field.
 */
export const sfdStandaloneGoodsItem = (
    overrides?: Partial<GoodsData>
): Partial<GoodsData> => ({
    // Chapter 24 tobacco, which is what makes the controlled-goods route meaningful:
    // the route is only worth testing with a commodity the service treats as
    // controlled. Not the shared default (2404199000) - that one is nicotine products.
    commodityCode: '2403199000',
    // Read on the packaging screen by BOTH routes. Realistic marks rather than the
    // shared placeholder, so the packaging screen is exercised with what a trader
    // would really type.
    shippingMarks: 'Production date 25/08/2025; Lot code LOT GBM-250825-01; Approval no. UK 4312 EC (cutting plant)',

    // The excise document the controlled route is refused without. Only this one: the
    // ENS-SFD set also carries C512, which is there to get past a CDS regression on that
    // journey rather than because the goods need it.
    documentReferences: [
        documentReference({
            documentCode: DOCUMENT_CODE.C672,
            documentStatus: DOCUMENT_STATUS.AC,
            documentReference: '0054037-0054047',
        }),
    ],

    ...overrides,
});
