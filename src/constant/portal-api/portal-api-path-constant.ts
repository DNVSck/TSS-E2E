/**
 * Every URL this API is asked for, as the API documents them - one line per endpoint,
 * so the file reads as the map of its surface. Fill one in with buildPath.
 */
export const PORTAL_API_PATH = {
    ReadCompanyPermissionGrant: 'company/{eori}/permission-grant',
    ReadTraderGoodsProfilePermission: 'company/{eori}/trader-goods-profile-permission',

    /**
     * The estate is fixed at XI because every journey in this suite moves goods INTO
     * Northern Ireland, which is what NIRMS is for. It becomes a parameter the day a
     * GB-estate journey exists, and not before.
     */
    ReadNirmsDocuments:
        'tariff/nirms/documents/{commodityCode}?countryOfOrigin={countryOfOrigin}&estate=XI',

    /** By the GMR's own local reference ("GMR178..."), not the GVMS id ("GMRCGUCXDP5B"). */
    ReadGmr: 'gmr/{localReferenceNumber}',
} as const;
