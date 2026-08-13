/**
 * The "What method of transport are you using?" radio. Values read from the screen
 * itself: "3a" RoRo Accompanied, "1a" RoRo Unaccompanied, "4" ILP Air, "1" ILP
 * Maritime. AIR previously read "air", which no screen ever offered.
 */
export const TYPE_OF_MOVEMENT_OPTION_CODE = {
    RORO_ACCOMPANIED: '3a',
    RORO_UNACCOMPANIED: '1a',
    AIR: '4',
    MARITIME: '1',
} as const;

export type TypeOfMovementKey = keyof typeof TYPE_OF_MOVEMENT_OPTION_CODE;

/**
 * How a transport document number reads for each movement type, mirroring what a
 * real trader would type:
 *   RoRo      CMR + 10 digits   e.g. CMR1234567890  (CMR waybill reference)
 *   Maritime  B/L +  9 digits   e.g. B/L987654321   (Bill of Lading number)
 *   Air       AWB + 10 digits   e.g. AWB0123456789  (Air Waybill number)
 *
 * The serials are mock data, so a leading zero is accepted either way.
 */
export const TRANSPORT_DOCUMENT_FORMAT: Record<
    TypeOfMovementKey,
    { prefix: string; digits: number }
> = {
    RORO_ACCOMPANIED: { prefix: 'CMR', digits: 10 },
    RORO_UNACCOMPANIED: { prefix: 'CMR', digits: 10 },
    AIR: { prefix: 'AWB', digits: 10 },
    MARITIME: { prefix: 'B/L', digits: 9 },
} as const;
