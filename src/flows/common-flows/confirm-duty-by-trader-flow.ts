import { TestInfo } from '@playwright/test';
import { SignInFlow } from '../sign-in-flow';
import { UserCredentials } from '../../auth/credentials';
import { ConsignmentOverviewPage } from '../../page-object/consignment-overview-page';
import { ReportLog } from '../../core/report/report-log';
import { STANDALONE_DECLARATION_ROUTE } from '../../constant/endpoints-constant';

export class ConfirmDutyByTraderFlow {
    constructor(
        private readonly signInFlow: SignInFlow,
        private readonly consignmentOverviewPage: ConsignmentOverviewPage,
        private readonly traderCredentials: UserCredentials,
    ) {}

    async confirmDuty(lrn: string, baseUrl: string, testInfo: TestInfo): Promise<void> {
        await ReportLog.step('Trader confirms duty calculation', async () => {
            await this.signInFlow.signIn(this.traderCredentials, { baseUrl, testInfo });
            await this.consignmentOverviewPage.returnTo(
                `${baseUrl}${STANDALONE_DECLARATION_ROUTE.overviewPath(lrn)}`
            );
            await this.consignmentOverviewPage.waitForDutyCalculation();
            await this.consignmentOverviewPage.confirmDutyCalculation();
        });
    }
}
