import { GoodsData } from './goods-data';

/**
 * The goods item an FFD standalone consignment declares.
 *
 * A Partial<GoodsData>, not a whole one - the flow layers it over the shared
 * `goods()` defaults, so this states only what FFD standalone adds. Anything every
 * FFD standalone test needs belongs HERE rather than in the spec: a spec should
 * state only what makes that one test different. Pasting the same block into each
 * test is what produced the duplication finding on the IMMI spec.
 *
 * Nothing journey-specific yet: FFD is the journey that diverges most at goods level
 * and on several answers at once, and none of that is modelled. Inventing customs
 * document codes/references would be worse than leaving it empty, so it returns the
 * shared defaults unchanged and wiring it in now is behaviour-neutral.
 *
 * To fill it in, follow immi-standalone-goods-item-data.ts: add the document
 * references, previous documents and additionalProcedureCode the journey requires,
 * keeping `...overrides` last so a spec can still vary one field. If FFD's goods
 * item ends up branching on its own answers, that branching belongs in
 * AddNewFfdStandaloneGoodsItemFlow - this file stays data only.
 */
export const ffdStandaloneGoodsItem = (
    overrides?: Partial<GoodsData>
): Partial<GoodsData> => ({
    ...overrides,
});
