import { BASE_URL } from '../../config/environment';
import { test } from '../base-test';
import { ReportLog } from '../../src/core/report/report-log';
import { COMPANY_PROFILE, accountFor, isProfileConfigured } from '../../src/auth/credentials';
import { portalToken } from '../../src/auth/portal-token';
import { checkpointFor } from '../../src/flows/accessibility-audit-flow';

test.use({ trace: 'off' });

// AUTH_ACCOUNT, not a pooled journey account: this signs in through the UI, and a TOTP
// code is bound to a 30-second window, so a second sign-in of an account globalSetup
// already used would replay a code the identity provider rejects.
//
// The wrong answers spend Keycloak's failed-attempt budget. Signing in correctly at the
// end of the journey resets it, and the token minted afterwards resets it again if the
// journey died before getting there.
test.describe('Portal sign-in journey - WCAG 2.2 AA', () => {
    test.describe.configure({ mode: 'serial' });

    test.skip(
        !isProfileConfigured(COMPANY_PROFILE.AUTH_ACCOUNT),
        'AUTH_ACCOUNT is not configured for this environment.'
    );

    test.beforeEach(async () => {
        await ReportLog.setFeature('Accessibility - WCAG 2.2 AA by criterion');
    });

    test.afterEach(async () => {
        await portalToken(accountFor(COMPANY_PROFILE.AUTH_ACCOUNT, test.info().parallelIndex));
    });

    test('Every screen on the way in should meet WCAG 2.2 AA, clean and in error',
        { tag: ['@accessibility'] }, async ({
            signInFlow, accessibilityAuditFlow
        }, testInfo) => {
            await ReportLog.setStory('Signed out -> sign-in -> signed in');

            await signInFlow.signIn(
                accountFor(COMPANY_PROFILE.AUTH_ACCOUNT, testInfo.parallelIndex),
                { baseUrl: BASE_URL, testInfo },
                { checkpoint: checkpointFor(accessibilityAuditFlow, testInfo), probeErrors: true }
            );
        });
});
