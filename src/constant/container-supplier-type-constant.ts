
export const CONTAINER_SUPPLIER_TYPE = {
    /** Shipper supplied */
    SHIPPER_SUPPLIED: '1',
    /** Carrier supplied */
    CARRIER_SUPPLIED: '2',
} as const;

export type ContainerSupplierTypeCode =
    (typeof CONTAINER_SUPPLIER_TYPE)[keyof typeof CONTAINER_SUPPLIER_TYPE];
