import { APIRequestContext, request, test } from '@playwright/test';
import { RMQ_HOST, RMQ_USERNAME, RMQ_PWD } from '../../config/environment';


export type APIFixtureType = {
  rmqApiRequest: APIRequestContext;
}

type ExtendParams = Parameters<typeof test.extend<APIFixtureType>>;

export const apiFixture: ExtendParams[0] = {
  rmqApiRequest: async ({}, // NOSONAR typescript:S3799
     use) => {
    const ctx = await request.newContext({
      baseURL: RMQ_HOST,
      extraHTTPHeaders: {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + Buffer.from(`${RMQ_USERNAME}:${RMQ_PWD}`).toString('base64'),
      },
    });

    await use(ctx);
    await ctx.dispose();
  },
};

