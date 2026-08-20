/**
 * Where a TSS environment lives.
 *
 * Every environment is a subdomain of one domain - https://sit.nc-tss.uk,
 * https://test.nc-tss.uk - and every service the suite talks to sits on it: the portal
 * itself, the HMRC-CDS callback, and the GVMS and Trader APIs still to come. So this
 * is a fact about the estate rather than about any one service, which is why it is
 * here and not in the client or the config that first needed it.
 */
export const TSS_DOMAIN = 'nc-tss.uk';

/**
 * The origin of a TSS environment, by its name ("sit", "test").
 *
 * A function rather than a bare string, so the scheme and the dot are assembled in one
 * place: the next service to need a host asks for one instead of writing the template
 * out again and getting to choose whether it is http or https.
 */
export function tssOrigin(environment: string): string {
    return `https://${environment}.${TSS_DOMAIN}`;
}
