/**
 * Every URL this API is asked for, as the API documents them - one line per endpoint,
 * so the file reads as the map of its surface. Fill one in with buildPath.
 */
export const TRADER_API_PATH = {
    CreateMovementHeader: 'headers',

    CreateConsignment: 'consignments',
    SubmitConsignment: 'consignments',

    CreateGoodsItem: 'goods',

    FindSfdByConsignment:
        'simplified_frontier_declarations?consignment_number={consignmentNumber}',
    ReadSfd: 'simplified_frontier_declarations?reference={reference}',

    FindSupplementaryDeclarationBySfd:
        'supplementary_declarations?sfd_number={sfdNumber}',
    ReadSupplementaryDeclaration: 'supplementary_declarations?reference={reference}',

    ReadInternalMarketMovement: 'internal_market_movement?reference={reference}',
} as const;
