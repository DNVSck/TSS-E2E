const COMPANY = 'company';
const TARIFF = 'tariff';
const GMR = 'gmr';

/**
 * Every URL this API is asked for, as the API documents them - one line per URL, so
 * the file reads as the map of its surface. Fill one in with buildPath.
 *
 * Named for what the URL ADDRESSES, never for what is done to it - see the note on
 * TRADER_API_PATH.
 */
export const PORTAL_API_PATH = {
    OwnCompany: COMPANY,
    CompanyPermissionGrant: `${COMPANY}/{eori}/permission-grant`,
    CompanyTraderGoodsProfilePermission: `${COMPANY}/{eori}/trader-goods-profile-permission`,

    /**
     * The estate is fixed at XI because every journey in this suite moves goods INTO
     * Northern Ireland, which is what NIRMS is for. It becomes a parameter the day a
     * GB-estate journey exists, and not before.
     */
    NirmsDocuments:
        `${TARIFF}/nirms/documents/{commodityCode}?countryOfOrigin={countryOfOrigin}&estate=XI`,

    /** By the GMR's own local reference ("GMR178..."), not the GVMS id ("GMRCGUCXDP5B"). */
    GmrByLocalReference: `${GMR}/{localReferenceNumber}`,
} as const;
