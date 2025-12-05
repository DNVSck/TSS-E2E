import { 
    BrowserContext
} from '@playwright/test';

import {BrowserManagement} from './browser-management';

export class BrowserContextUtils{

    static BrowserContext(): BrowserContext {
        return BrowserManagement.browserContext;
    }

    async clearCookies(options?: {
        domain?: string|RegExp; // Only removes cookies with the given domain.
        name?: string|RegExp; // Only removes cookies with the given name.
        path?: string|RegExp; // Only removes cookies with the given path.
      }): Promise<void> {
        await BrowserContextUtils.BrowserContext().clearCookies(options);
    }

    async addCookies(cookies: ReadonlyArray<{
        name: string;
        value: string;
        // either url or domain / path are required. Optional.
        url?: string;
        // either url or domain / path are required Optional.
        domain?: string;
        // either url or domain / path are required Optional.
        path?: string;
        // Unix time in seconds. Optional.
        expires?: number;
        // Optional.
        httpOnly?: boolean;
        // Optional.
        secure?: boolean;
        // Optional.
        sameSite?: "Strict"|"Lax"|"None";
      }>): Promise<void> {
        await BrowserContextUtils.BrowserContext().addCookies(cookies);
    }
}