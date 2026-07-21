import { BasePage } from '../page-object/base-page';
import { PortalPage } from '../page-object/portal-page';
import { ReportLog } from '../core/report/report-log';
import { TestInfo } from '@playwright/test';

export interface OpenServiceInput {
    baseUrl: string;
    testInfo: TestInfo;
}

export class PortalAccessFlow {
    constructor(
        private readonly basePage: BasePage,
        private readonly portalPage: PortalPage,
    ) { }

    /**
     * Open the portal and start the service journey.
     *
     * The browser context already carries a signed-in session, restored from the
     * `storageState` captured in globalSetup — see src/core/auth/ensure-auth-state.ts.
     * Nothing here signs in: a TOTP code is bound to a 30-second window, so a
     * per-test sign-in of the same account would replay a code Keycloak rejects.
     */
    async openService(input: OpenServiceInput): Promise<void> {
        const { baseUrl, testInfo } = input;

        await ReportLog.step('Open service', async () => {
            await this.basePage.navigateToPortal(baseUrl, testInfo);
            await this.portalPage.startTssJourney();
        });
    }
}
