
export const CONTAINER_PACKED_STATUS = {
    /** Empty */
    EMPTY: 'A',
    /** Not empty */
    NOT_EMPTY: 'B',
} as const;

export type ContainerPackedStatusCode =
    (typeof CONTAINER_PACKED_STATUS)[keyof typeof CONTAINER_PACKED_STATUS];
