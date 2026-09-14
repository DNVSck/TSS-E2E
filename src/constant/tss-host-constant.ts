/**
 * Where a TSS environment lives.
 *
 * Every environment is a subdomain of one domain - https://sit.nc-tss.uk,
 * https://test.nc-tss.uk - and every service the suite talks to sits on it: the portal
 * itself, the HMRC-CDS callback, and the GVMS, Trader and Portal APIs. So this
 * is a fact about the estate rather than about any one service, which is why it is
 * here and not in the client or the config that first needed it.
 */
export const TSS_DOMAIN = 'nc-tss.uk';

const PORTAL_REALM = 'TSS_Portal';

/**
 * Subdomains OF an environment rather than paths on it - case-management.sit.nc-tss.uk,
 * not sit.nc-tss.uk/case-management - so neither can be reached by appending to the
 * environment's own origin.
 */
export const CASE_MANAGEMENT_SUBDOMAIN = 'case-management';
export const AUTH_SUBDOMAIN = 'auth';

export const TRADER_API_BASE_PATH = '/api/v1/trader_api/transition';

export const PORTAL_API_BASE_PATH = '/api/portal_api/v1';

export const KEYCLOAK_TOKEN_PATH = `/realms/${PORTAL_REALM}/protocol/openid-connect/token`;
