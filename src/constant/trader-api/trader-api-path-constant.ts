const HEADERS = 'headers';
const CONSIGNMENTS = 'consignments';
const GOODS = 'goods';
const SIMPLIFIED_FRONTIER_DECLARATIONS = 'simplified_frontier_declarations';
const SUPPLEMENTARY_DECLARATIONS = 'supplementary_declarations';
const INTERNAL_MARKET_MOVEMENT = 'internal_market_movement';

/**
 * Every URL this API is asked for, as the API documents them - one line per URL, so
 * the file reads as the map of its surface. Fill one in with buildPath.
 *
 * Named for what the URL ADDRESSES, never for what is done to it: the method and the
 * request's own op_type carry that, and one URL serves several operations - see
 * Consignments, which both creates and submits.
 */
export const TRADER_API_PATH = {
    Headers: HEADERS,

    Consignments: CONSIGNMENTS,
    ConsignmentByReference: `${CONSIGNMENTS}?reference={reference}`,

    Goods: GOODS,

    SfdByConsignmentNumber:
        `${SIMPLIFIED_FRONTIER_DECLARATIONS}?consignment_number={consignmentNumber}`,
    SfdByReference: `${SIMPLIFIED_FRONTIER_DECLARATIONS}?reference={reference}`,

    SupplementaryDeclarations: SUPPLEMENTARY_DECLARATIONS,
    SupplementaryDeclarationBySfdNumber:
        `${SUPPLEMENTARY_DECLARATIONS}?sfd_number={sfdNumber}`,
    SupplementaryDeclarationByReference: `${SUPPLEMENTARY_DECLARATIONS}?reference={reference}`,
    SupplementaryDeclarationStatusByReference:
        `${SUPPLEMENTARY_DECLARATIONS}?reference={reference}&fields=status`,

    InternalMarketMovement: INTERNAL_MARKET_MOVEMENT,
    InternalMarketMovementByConsignmentNumber:
        `${INTERNAL_MARKET_MOVEMENT}?consignment_number={consignmentNumber}`,
    InternalMarketMovementByReference: `${INTERNAL_MARKET_MOVEMENT}?reference={reference}`,
} as const;
