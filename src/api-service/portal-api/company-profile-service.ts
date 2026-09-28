import { PortalApiClient, requiredFlag } from '../../api-client/portal-api-client';
import { PORTAL_API_PATH } from '../../constant/portal-api/portal-api-path-constant';

export interface PaymentMethodRecord {
    payment_method: string;
    is_primary: boolean;
}

export interface CompanyRecord {
    id: string;
    company_name: string;
    tss_account_number: string;
    eori_number: string;
    xi_eori_number: string | null;
    eu_eori_number: string | null;
    profile_type: string;
    company_data: {
        profile_permission?: {
            gmr_auto_update?: boolean;
        } | null;
        payment_methods?: PaymentMethodRecord[];
        [section: string]: unknown;
    };
}

export class CompanyProfileService {
    constructor(private readonly api: PortalApiClient) { }

    async readCompany(): Promise<CompanyRecord> {
        return this.api.read<CompanyRecord>(PORTAL_API_PATH.OwnCompany);
    }

    preferredPaymentMethodOf(company: CompanyRecord): string | undefined {
        return company.company_data.payment_methods?.find(method => method.is_primary)?.payment_method;
    }

    updateBodyFor(company: CompanyRecord): Partial<CompanyRecord> {
        const body: Partial<CompanyRecord> = { ...company };
        delete body.id;
        return body;
    }

    async updateCompany(company: CompanyRecord): Promise<void> {
        await this.api.update(PORTAL_API_PATH.OwnCompany, this.updateBodyFor(company));
    }

    async isGmrAutoUpdateAllowed(): Promise<boolean> {
        const call = 'Read the GMR auto-update permission of the signed-in company';
        const company = await this.readCompany();

        return requiredFlag(
            company.company_data?.profile_permission?.gmr_auto_update, 'gmr_auto_update', call
        );
    }
}
