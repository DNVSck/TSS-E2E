import {test} from '@playwright/test';
import { APIClient } from '../core/api/api-client';


export type APIFixtureType = {

}

type ExtendParams = Parameters<typeof test.extend<APIFixtureType>>;

export const apiFixture: ExtendParams[0] = {

};

