export const SEPARATE_HAULIER = {
    CARRIER_IS_HAULIER: 'The carrier is also the haulier',
    SEPARATE_HAULIER: 'There is a separate haulier for this movement',
} as const;

export type SeparateHaulierKey = keyof typeof SEPARATE_HAULIER;
export type SeparateHaulierValue =
    (typeof SEPARATE_HAULIER)[keyof typeof SEPARATE_HAULIER];
