import { APIRequestContext, request, test } from '@playwright/test';
import {
  RMQ_HOST, RMQ_USERNAME, RMQ_PWD,
  CDS_MOCK_HOST, CDS_TOKEN,
} from '../../config/environment';
import { StringUtil } from '../core/util/string-util';
import { CdsMockApiClient } from '../api-client/cds-mock-api-client';
import { Ics2MockApiClient } from '../api-client/ics2-mock-api-client';

/**
 * A base URL a relative path can be appended to.
 *
 * The trailing slash is load-bearing: without it, resolving "api/x" against
 * "https://host/rmq" gives "https://host/api/x" - the service's own path dropped. See
 * relativeToBase in base-api-client for the half of this that lives on the other side.
 */
function serviceBase(host: string): string {
    return host ? `${StringUtil.stripTrailingSlashes(host)}/` : host;
}

/** Basic-auth header, or nothing at all when the service is unsecured. */
function basicAuth(username: string, password: string): Record<string, string> {
  return username
    ? { Authorization: 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64') }
    : {};
}

/**
 * One request context per API family - each with its own host and its own credentials,
 * disposed with the test that used it. Clients live beside the context they talk
 * through: there is exactly one client per context, and splitting them would put two
 * halves of one wiring decision in two files.
 *
 * None of these share cookies with the browser, which is right for a system integration
 * but WRONG for anything acting as the signed-in user - representation is server-side
 * session state, so a portal-API client must ride the page's own context (page.request)
 * rather than a fresh one built here.
 */
export type APIFixtureType = {
  rmqApiRequest: APIRequestContext;
  cdsMockApiRequest: APIRequestContext;
  cdsMockApiClient: CdsMockApiClient;
  ics2MockApiClient: Ics2MockApiClient;
}

type ExtendParams = Parameters<typeof test.extend<APIFixtureType>>;

export const apiFixture: ExtendParams[0] = {
  rmqApiRequest: async ({}, // NOSONAR typescript:S3799
     use) => {
    const ctx = await request.newContext({
      baseURL: serviceBase(RMQ_HOST),
      extraHTTPHeaders: {
        'Content-Type': 'application/json',
        ...basicAuth(RMQ_USERNAME, RMQ_PWD),
      },
    });

    await use(ctx);
    await ctx.dispose();
  },

  cdsMockApiRequest: async ({}, // NOSONAR typescript:S3799
     use) => {
    const ctx = await request.newContext({
      baseURL: serviceBase(CDS_MOCK_HOST),
      extraHTTPHeaders: {
        'Content-Type': 'application/json',
        // Sent verbatim: the callback expects the token as the whole header value, not
        // as the argument of a scheme.
        ...(CDS_TOKEN ? { Authorization: CDS_TOKEN } : {}),
      },
    });

    await use(ctx);
    await ctx.dispose();
  },

  cdsMockApiClient: async ({ cdsMockApiRequest }, use) => {
    await use(new CdsMockApiClient(cdsMockApiRequest));
  },

  ics2MockApiClient: async ({ rmqApiRequest }, use) => {
    await use(new Ics2MockApiClient(rmqApiRequest));
  },
};

