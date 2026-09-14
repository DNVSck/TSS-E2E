import { PortalApiClient } from '../../api-client/portal-api-client';
import { PORTAL_API_PATH } from '../../constant/portal-api/portal-api-path-constant';
import { buildPath } from '../../helper/api-path-helper';

interface GmrResponse {
    local_reference_number?: string;
    ens_lrn?: string;
    gmr_id?: string;
    status?: string;
    require_inspection?: string;
    hmrc_gvms_response?: {
        event_id?: string | null;
        box_id?: string | null;
    } | null;
}

/** The service answers this one as a word, not a boolean. */
const INSPECTION_REQUIRED = 'Yes';
const INSPECTION_NOT_REQUIRED = 'No';

/**
 * What GVMS said back about a GMR.
 *
 * Both ids arrive EMPTY until GVMS has answered, and that is a state rather than a
 * fault: the portal creates the GMR first and forwards it a beat later. So a caller
 * that needs them waits for them rather than reading once.
 */
export interface GvmsNotification {
    eventId: string;
    boxId: string;
}

export interface GmrSummary {
    localReferenceNumber: string;
    /** The movement this GMR carries. */
    ensLrn: string;
    /** The id GVMS assigned ("GMRCGUCXDP5B"), as opposed to the local reference. */
    gmrId: string;
    status: string;
    requiresInspection: boolean;
    gvms: GvmsNotification;
}

export class GmrService {
    constructor(private readonly api: PortalApiClient) { }

    async readGmr(localReferenceNumber: string): Promise<GmrSummary> {
        const call = `Read GMR ${localReferenceNumber}`;
        const result = await this.api.read<GmrResponse>(
            buildPath(PORTAL_API_PATH.ReadGmr, { localReferenceNumber })
        );

        const gvms = result.hmrc_gvms_response;

        return {
            localReferenceNumber: result.local_reference_number ?? localReferenceNumber,
            ensLrn: result.ens_lrn ?? '',
            gmrId: result.gmr_id ?? '',
            status: result.status ?? '',
            requiresInspection: inspectionFlag(result.require_inspection, call),
            gvms: {
                eventId: gvms?.event_id ?? '',
                boxId: gvms?.box_id ?? '',
            },
        };
    }
}

function inspectionFlag(value: string | undefined, call: string): boolean {
    if (value !== INSPECTION_REQUIRED && value !== INSPECTION_NOT_REQUIRED) {
        throw new TypeError(
            `${call}: "require_inspection" answered ${JSON.stringify(value)}, and this reads `
            + `only ${INSPECTION_REQUIRED} or ${INSPECTION_NOT_REQUIRED}. The endpoint's `
            + `contract has changed.`
        );
    }

    return value === INSPECTION_REQUIRED;
}
