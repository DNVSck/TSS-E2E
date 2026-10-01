import { ROUTE_ID_CONSTANT } from "../constant/routeId-constant";

export interface GmrData {
    route_id: string,
    external_contacts_list?: string[];
}

const defaults: GmrData = {
    route_id: ROUTE_ID_CONSTANT.GB_TO_NI.HEYSHAM_BELFAST_STENA_LINE,
    external_contacts_list: []
};

export const gmrData = (overrides?: Partial<GmrData>): GmrData => ({
    ...defaults,
    ...overrides,
});

export const AUDIT_CONTACT_EMAIL = 'accessibility.audit@nifreight.co.uk';
