import { PortalApiClient, requiredFlag } from '../../api-client/portal-api-client';
import { PORTAL_API_PATH } from '../../constant/portal-api/portal-api-path-constant';

interface CompanyProfileResponse {
    company_data?: {
        profile_permission?: {
            gmr_auto_update?: boolean;
        } | null;
    } | null;
}

export class CompanyProfileService {
    constructor(private readonly api: PortalApiClient) { }

    async isGmrAutoUpdateAllowed(): Promise<boolean> {
        const call = 'Read the GMR auto-update permission of the signed-in company';
        const result = await this.api.read<CompanyProfileResponse>(PORTAL_API_PATH.OwnCompany);

        return requiredFlag(
            result.company_data?.profile_permission?.gmr_auto_update, 'gmr_auto_update', call
        );
    }
}
