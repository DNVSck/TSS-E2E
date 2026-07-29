import { GoodsData } from './goods-data';

/**
 * The goods item an SFD standalone consignment declares.
 *
 * A Partial<GoodsData>, not a whole one - the flow layers it over the shared
 * `goods()` defaults, so this states only what SFD standalone adds. Anything every
 * SFD standalone test needs belongs HERE rather than in the spec: a spec should
 * state only what makes that one test different. Pasting the same block into each
 * test is what produced the duplication finding on the IMMI spec.
 *
 * Nothing journey-specific yet: the SFD standalone document set has not been
 * confirmed against the app, and inventing customs document codes/references would
 * be worse than leaving it empty. It returns the shared defaults unchanged until
 * then, so wiring it in now is behaviour-neutral.
 *
 * To fill it in, follow immi-standalone-goods-item-data.ts: add the document
 * references, previous documents and additionalProcedureCode the journey requires,
 * keeping `...overrides` last so a spec can still vary one field.
 */
export const sfdStandaloneGoodsItem = (
    overrides?: Partial<GoodsData>
): Partial<GoodsData> => ({
    ...overrides,
});
