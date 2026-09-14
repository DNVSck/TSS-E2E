import { PortalApiClient, requiredFlag } from '../../api-client/portal-api-client';
import { PORTAL_API_PATH } from '../../constant/portal-api/portal-api-path-constant';
import { buildPath } from '../../helper/api-path-helper';

interface TraderGoodsProfilePermissionResponse {
    allows_tss_tgp_access?: boolean;
    allows_tgp_third_party_access?: boolean;
    ukims_eori?: string;
}

/**
 * How open a company's goods profile is, which is what decides whether the TGP
 * question is put at all.
 *
 * Two permissions rather than one because they answer different questions: whether
 * TSS may reach the profile, and whether somebody declaring on the company's behalf
 * may. An agent needs both; a company declaring for itself needs only the first.
 */
export interface TraderGoodsProfilePermission {
    eori: string;
    allowsTssAccess: boolean;
    allowsThirdPartyAccess: boolean;
    ukimsEori: string;
}

export class TraderGoodsProfileService {
    constructor(private readonly api: PortalApiClient) { }

    async readTgpPermission(eori: string): Promise<TraderGoodsProfilePermission> {
        const call = `Read the trader goods profile permission of ${eori}`;
        const result = await this.api.read<TraderGoodsProfilePermissionResponse>(
            buildPath(PORTAL_API_PATH.ReadTraderGoodsProfilePermission, { eori })
        );

        return {
            eori,
            allowsTssAccess: requiredFlag(
                result.allows_tss_tgp_access, 'allows_tss_tgp_access', call
            ),
            allowsThirdPartyAccess: requiredFlag(
                result.allows_tgp_third_party_access, 'allows_tgp_third_party_access', call
            ),
            ukimsEori: result.ukims_eori ?? '',
        };
    }
}

/**
 * Which TGP permission is missing, named so a reader knows what to grant.
 *
 * Beside the type it describes rather than in either flow that needs it: the ENS and
 * the standalone journeys both ask this question, and two copies of the sentence would
 * drift the moment one of them learned something.
 */
export function describeTgpGap(
    permission: TraderGoodsProfilePermission,
    declaringAsAgent: boolean
): string {
    const missing: string[] = [];

    if (!permission.allowsTssAccess) {
        missing.push('allows_tss_tgp_access is false');
    }
    if (declaringAsAgent && !permission.allowsThirdPartyAccess) {
        missing.push('allows_tgp_third_party_access is false, and an agent declaring on '
            + "the importer's behalf reaches the profile as a third party");
    }

    return missing.length > 0
        ? `${permission.eori} ${missing.join(', and ')}`
        : `${permission.eori} grants what is needed`;
}
