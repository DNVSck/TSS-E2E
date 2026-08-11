/**
 * UN numbers - the four-digit codes that identify hazardous materials in transport,
 * asked for on the "Dangerous goods" screen once an item is declared dangerous.
 *
 * Named constants rather than a generator. The codes run from 0004 to 3550 but the
 * range is SPARSE: most numbers in it are unassigned, so a random four-digit value
 * would usually name nothing. Nor is there anything to gain - unlike an LRN or a
 * container number, a UN code carries no uniqueness requirement, and two goods items
 * may legitimately declare the same one. A generator would only cost reproducibility:
 * a failure would arrive with a different code each run.
 *
 * The value is opaque, which is exactly what earns a constant here - "1203" says
 * nothing on its own, and the name is the only thing that tells a reader whether the
 * test meant petrol or picked a number.
 */
export const UN_DANGEROUS_GOODS_CODE = {
    /** UN 1203 - Gasoline (petrol). */
    GASOLINE: '1203',
    /** UN 1789 - Hydrochloric acid. */
    HYDROCHLORIC_ACID: '1789',
    /** UN 1950 - Aerosols. */
    AEROSOLS: '1950',
} as const;

export type UnDangerousGoodsCode =
    (typeof UN_DANGEROUS_GOODS_CODE)[keyof typeof UN_DANGEROUS_GOODS_CODE];
