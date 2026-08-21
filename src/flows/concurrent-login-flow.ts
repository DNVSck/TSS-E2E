import { TestInfo } from '@playwright/test';
import { PortalPage } from '../page-object/portal-page';
import { SignInFlow } from './sign-in-flow';
import { ReportLog } from '../core/report/report-log';
import { UserCredentials } from '../auth/credentials';

export interface ConcurrentLoginResult {
    deviceASignedIn: boolean;
    deviceBSignedIn: boolean;
}

export interface ConcurrentLoginInput {
    credentials: UserCredentials;
    baseUrl: string;
    testInfo: TestInfo;
}

/**
 * Signs the same account in on two separate browser contexts, to verify the service
 * allows concurrent sessions.
 *
 * Composes two SignInFlows - one per device - rather than driving their page objects
 * itself. It used to hold six page objects and repeat the whole sign-in sequence twice,
 * which was a second copy of what SignInFlow already does; a copy that would have
 * missed the next fix made to the original. The second device's flow is built by
 * secondDeviceFixture and was, until this, unused.
 *
 * The portal pages are still needed, and for the part that carries the test's meaning:
 * signing in proves each device CAN sign in, but the question is whether device B
 * signing in ended device A's session - so device A is read again at the end, after B.
 */
export class ConcurrentLoginFlow {
    constructor(
        private readonly deviceASignInFlow: SignInFlow,
        private readonly deviceAPortalPage: PortalPage,
        private readonly deviceBSignInFlow: SignInFlow,
        private readonly deviceBPortalPage: PortalPage,
    ) { }

    async signInOnBothDevices(input: ConcurrentLoginInput): Promise<ConcurrentLoginResult> {
        const { credentials, baseUrl, testInfo } = input;

        await ReportLog.step('Device A: sign in', async () => {
            await this.deviceASignInFlow.signIn(credentials, { baseUrl, testInfo });
        });

        // Device B signs in as the SAME account, seconds after device A - so the code it
        // generates is usually the one device A has just spent, and the identity provider
        // refuses a code twice. inputTotp recovers by waiting for the next 30-second
        // window, which means this step reliably takes about half a minute and prints a
        // "TOTP attempt refused" line while it does. That is the test working, not hanging.
        await ReportLog.step('Device B: sign in as the same account', async () => {
            await this.deviceBSignInFlow.signIn(credentials, { baseUrl, testInfo });
        });

        // Device A is read AFTER device B signed in - that is the whole question. Reading
        // it before would only repeat what signing in already proved.
        const deviceASignedIn = await this.deviceAPortalPage.isSignedIn();
        const deviceBSignedIn = await this.deviceBPortalPage.isSignedIn();

        ReportLog.setParameter('Device A still signed in after B', String(deviceASignedIn));
        ReportLog.setParameter('Device B signed in', String(deviceBSignedIn));

        return { deviceASignedIn, deviceBSignedIn };
    }
}
