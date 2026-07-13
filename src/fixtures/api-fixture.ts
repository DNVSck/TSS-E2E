import { test } from '@playwright/test';


export type APIFixtureType = {

}

type ExtendParams = Parameters<typeof test.extend<APIFixtureType>>;

export const apiFixture: ExtendParams[0] = {

};

