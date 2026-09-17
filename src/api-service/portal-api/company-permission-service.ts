import { PortalApiClient, requiredFlag } from '../../api-client/portal-api-client';
import { PORTAL_API_PATH } from '../../constant/portal-api/portal-api-path-constant';
import { buildPath } from '../../helper/api-path-helper';

interface PermissionGrantResponse {
    importer_eori?: string;
    eori_registered?: boolean;
    access_ukims?: boolean;
    ukims_eori?: string;
    use_tss_simplified_process?: boolean;
    has_nirms_authorisation?: boolean;
}

/**
 * What a company is allowed to do, which is what decides how many screens its
 * declaration is asked.
 */
export interface CompanyPermissionGrant {
    eori: string;
    isEoriRegistered: boolean;
    /** UKIMS access is what puts the "Do you want to use IMMI?" question. */
    hasUkimsAccess: boolean;
    ukimsEori: string;
    usesTssSimplifiedProcess: boolean;
    /**
     * Necessary for the NIRMS screen, and never sufficient on its own - what joins it
     * differs by journey. See AddNewEnsGoodsItemFlow.nirmsExpectation.
     */
    hasNirmsAuthorisation: boolean;
}

export class CompanyPermissionService {
    constructor(private readonly api: PortalApiClient) { }

    async readPermissionGrant(eori: string): Promise<CompanyPermissionGrant> {
        const call = `Read the permission grant of ${eori}`;
        const result = await this.api.read<PermissionGrantResponse>(
            buildPath(PORTAL_API_PATH.CompanyPermissionGrant, { eori })
        );

        return {
            eori: result.importer_eori ?? eori,
            isEoriRegistered: requiredFlag(result.eori_registered, 'eori_registered', call),
            hasUkimsAccess: requiredFlag(result.access_ukims, 'access_ukims', call),
            ukimsEori: result.ukims_eori ?? '',
            usesTssSimplifiedProcess: requiredFlag(
                result.use_tss_simplified_process, 'use_tss_simplified_process', call
            ),
            hasNirmsAuthorisation: requiredFlag(
                result.has_nirms_authorisation, 'has_nirms_authorisation', call
            ),
        };
    }
}
