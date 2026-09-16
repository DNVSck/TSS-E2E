import { APIRequestContext, request, test } from '@playwright/test';
import {
  RMQ_HOST, RMQ_USERNAME, RMQ_PWD,
  CDS_MOCK_HOST, CDS_TOKEN, CASE_MANAGEMENT_HOST, TRADER_API_BASE_URL, PORTAL_API_BASE_URL,
  GVMS_PUSH_SECRET,
} from '../../config/environment';
import { WorkerAuthFixtureType } from './worker-auth-fixture';
import { TraderApiClient } from '../api-client/trader-api-client';
import { MovementService } from '../api-service/trader-api/movement-service';
import { ConsignmentService } from '../api-service/trader-api/consignment-service';
import { GoodsService } from '../api-service/trader-api/goods-service';
import {
  InternalMarketMovementService,
} from '../api-service/trader-api/internal-market-movement-service';
import {
  SimplifiedFrontierDeclarationService,
} from '../api-service/trader-api/simplified-frontier-declaration-service';
import { portalToken, PortalToken } from '../auth/portal-token';
import { PortalApiClient } from '../api-client/portal-api-client';
import {
  CompanyPermissionService,
} from '../api-service/portal-api/company-permission-service';
import { TariffService } from '../api-service/portal-api/tariff-service';
import { GmrService } from '../api-service/portal-api/gmr-service';
import {
  TraderGoodsProfileService,
} from '../api-service/portal-api/trader-goods-profile-service';
import { UserCredentials } from '../auth/credentials';
import { StringUtil } from '../core/util/string-util';
import { CdsMockApiClient } from '../api-client/cds-mock-api-client';
import { GvmsMockApiClient } from '../api-client/gvms-mock-api-client';
import { Ics2MockApiClient } from '../api-client/ics2-mock-api-client';
import { CaseManagementApiClient } from '../api-client/case-management-api-client';
import { caseManagementSession } from '../auth/case-management-session';

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
 * through, because the context and the clients that ride it are two halves of one
 * wiring decision.
 *
 * A family with several resources gets several clients on the ONE context - see the
 * Trader API, where a client per resource keeps each one small while they share a
 * single token.
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
  gvmsMockApiRequest: APIRequestContext;
  gvmsMockApiClient: GvmsMockApiClient;
  ics2MockApiClient: Ics2MockApiClient;
  caseManagementApiRequest: APIRequestContext;
  caseManagementApiClient: CaseManagementApiClient;
  /**
   * One token per ACCOUNT per worker, shared by every API that speaks as the signed-in
   * trader.
   *
   * Minted once and handed to both families on purpose. A code from the authenticator
   * is spendable exactly once, so two contexts minting their own inside the same
   * thirty-second window make the second one wait out the window - measured at 22
   * seconds, against 1.2 for the first.
   */
  portalAccessToken: string;
  traderApiRequest: APIRequestContext;
  traderApiClient: TraderApiClient;
  portalApiRequest: APIRequestContext;
  portalApiClient: PortalApiClient;
  companyPermissionService: CompanyPermissionService;
  traderGoodsProfileService: TraderGoodsProfileService;
  tariffService: TariffService;
  gmrService: GmrService;
  movementService: MovementService;
  consignmentService: ConsignmentService;
  goodsService: GoodsService;
  simplifiedFrontierDeclarationService: SimplifiedFrontierDeclarationService;
  internalMarketMovementService: InternalMarketMovementService;
}

type ExtendParams = Parameters<typeof test.extend<APIFixtureType & WorkerAuthFixtureType>>;

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

  gvmsMockApiRequest: async ({}, // NOSONAR typescript:S3799
     use) => {
    const ctx = await request.newContext({ baseURL: serviceBase(CDS_MOCK_HOST) });

    await use(ctx);
    await ctx.dispose();
  },

  gvmsMockApiClient: async ({ gvmsMockApiRequest }, use) => {
    await use(new GvmsMockApiClient(gvmsMockApiRequest, GVMS_PUSH_SECRET));
  },

  ics2MockApiClient: async ({ rmqApiRequest }, use) => {
    await use(new Ics2MockApiClient(rmqApiRequest));
  },


  caseManagementApiRequest: async ({}, // NOSONAR typescript:S3799
     use) => {
    const session = await caseManagementSession();
    const ctx = await request.newContext({
      baseURL: serviceBase(CASE_MANAGEMENT_HOST),
      storageState: session.storageState,
      extraHTTPHeaders: {
        'Content-Type': 'application/json',
        'x-xsrf-token': session.xsrfToken,
      },
    });

    await use(ctx);
    await ctx.dispose();
  },

  caseManagementApiClient: async ({ caseManagementApiRequest }, use) => {
    await use(new CaseManagementApiClient(caseManagementApiRequest));
  },

  portalAccessToken: async ({ authAccount }, use, testInfo) => {
    const account = portalAccount(authAccount);
    const key = `${account.profile}:${account.accountNumber ?? 0}`;
    const cached = mintedTokens.get(key);

    // The token has to outlast the test that is about to use it, so this test's own
    // timeout is the margin - no number to keep in step with a server setting.
    if (cached && testInfo.timeout > 0 && cached.expiresAt - Date.now() > testInfo.timeout) {
      await use(cached.accessToken);
      return;
    }

    const minted = await portalToken(account);
    mintedTokens.set(key, minted);

    await use(minted.accessToken);
  },

  traderApiRequest: async ({ portalAccessToken }, use) => {
    const ctx = await request.newContext({
      baseURL: serviceBase(TRADER_API_BASE_URL),
      extraHTTPHeaders: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${portalAccessToken}`,
      },
    });

    await use(ctx);
    await ctx.dispose();
  },

  portalApiRequest: async ({ portalAccessToken }, use) => {
    const ctx = await request.newContext({
      baseURL: serviceBase(PORTAL_API_BASE_URL),
      extraHTTPHeaders: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${portalAccessToken}`,
      },
    });

    await use(ctx);
    await ctx.dispose();
  },

  portalApiClient: async ({ portalApiRequest }, use) => {
    await use(new PortalApiClient(portalApiRequest));
  },

  gmrService: async ({ portalApiClient }, use) => {
    await use(new GmrService(portalApiClient));
  },

  tariffService: async ({ portalApiClient }, use) => {
    await use(new TariffService(portalApiClient));
  },

  companyPermissionService: async ({ portalApiClient }, use) => {
    await use(new CompanyPermissionService(portalApiClient));
  },

  traderGoodsProfileService: async ({ portalApiClient }, use) => {
    await use(new TraderGoodsProfileService(portalApiClient));
  },

  traderApiClient: async ({ traderApiRequest }, use) => {
    await use(new TraderApiClient(traderApiRequest));
  },

  movementService: async ({ traderApiClient }, use) => {
    await use(new MovementService(traderApiClient));
  },

  consignmentService: async ({ traderApiClient }, use) => {
    await use(new ConsignmentService(traderApiClient));
  },

  goodsService: async ({ traderApiClient }, use) => {
    await use(new GoodsService(traderApiClient));
  },

  simplifiedFrontierDeclarationService: async ({ traderApiClient }, use) => {
    await use(new SimplifiedFrontierDeclarationService(traderApiClient));
  },

  internalMarketMovementService: async ({ traderApiClient }, use) => {
    await use(new InternalMarketMovementService(traderApiClient));
  },
};

/**
 * Tokens already minted in THIS worker, by account.
 *
 * Module level, which in Playwright means one per worker process - the same reason
 * the TOTP spent-code guard lives at module level. A token is process-wide auth state,
 * and minting one costs a code from the authenticator, which is spendable once every
 * thirty seconds.
 */
const mintedTokens = new Map<string, PortalToken>();

/**
 * These APIs act as whoever the token was minted for, so it must be the same account
 * the browser half of the test signs in as - anything the Trader API declares under
 * another trader is invisible to the screens that go looking for it, and the Portal
 * API would answer about a company the run is not acting for.
 */
function portalAccount(authAccount: UserCredentials | null): UserCredentials {
  if (!authAccount) {
    throw new Error(
      'The portal APIs need an account to mint a token for, and this test has none - '
      + 'the spec must set test.use({ authProfile: ... }).'
    );
  }
  return authAccount;
}

