import { 
    Browser,
} from '@playwright/test';
import {BrowserManagement} from './browser-management';

export class BrowserUtils{

    Browser(): Browser {
        return BrowserManagement.browser;
    }

    static async close(options?: {
        /**
         * The reason to be reported to the operations interrupted by the browser closure.
         */
        reason?: string;
      }) : Promise<void> {
        await BrowserManagement.browser.close(options);
    }

    static isConnected(): boolean {
        return BrowserManagement.browser.isConnected();
    }
}