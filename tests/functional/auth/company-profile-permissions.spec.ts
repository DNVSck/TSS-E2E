import { COMPANY_PROFILE, getCredentials, isProfileConfigured } from '../../../src/auth/credentials';
import { ALL_COMPANY_PROFILE_ACTIONS } from '../../../src/constant/company-profile-action-constant';
import { ReportLog } from '../../../src/core/report/report-log';
import { test, expect, getBaseUrl } from '../../test-hooks';

test.describe('TSS Portal company profile - edit permissions', () => {

    // Both halves of this file need the pair of accounts, so one answer covers it.
    test.skip(
        !isProfileConfigured(COMPANY_PROFILE.PRIMARY_HOLDER)
        || !isProfileConfigured(COMPANY_PROFILE.NON_PRIMARY_HOLDER),
        'PRIMARY_HOLDER_USER_NAME and NON_PRIMARY_HOLDER_USER_NAME are not both configured for this environment'
    );

    test('An account holder can edit the company profile and its users', { tag: ['@auth', '@authorisation', '@regression'] }, async ({ signInFlow, companyProfileFlow }, testInfo) => {
        const account = getCredentials(COMPANY_PROFILE.PRIMARY_HOLDER);

        await signInFlow.signIn(account, { baseUrl: getBaseUrl(), testInfo });

        await ReportLog.step('Check what the company profile page offers the holder', async () => {
            const profile = await companyProfileFlow.openCompanyProfile();
            // Every row in the catalogue, not a subset kept here: the catalogue is the
            // requirement, so adding a row to it starts requiring it with no second list
            // to remember.
            expect(profile.availableActions, 'Rows the account holder can act on')
                .toEqual(expect.arrayContaining(ALL_COMPANY_PROFILE_ACTIONS));
        });

        await ReportLog.step('Check what the users list offers the holder', async () => {
            const users = await companyProfileFlow.openUsersList();

            // One "Change" per user listed, whoever those users happen to be - a
            // relationship rather than a number, so seeding another user into the company
            // does not turn this red.
            expect(users.changeableUserIds, 'Users the holder can change')
                .toHaveLength(users.rowCount);

            // The company-level action, which lives above the table and would be missed
            // by anything looking only at the rows.
            expect(users.canInviteUser, 'Invite new user is offered').toBe(true);
        });
    });


    test('A user who is not the account holder gets view-only', { tag: ['@auth', '@authorisation', '@regression'] }, async ({ signInFlow, companyProfileFlow }, testInfo) => {
        const account = getCredentials(COMPANY_PROFILE.NON_PRIMARY_HOLDER);

        await signInFlow.signIn(account, { baseUrl: getBaseUrl(), testInfo });

        await ReportLog.step('Check what the company profile page offers a non-holder', async () => {
            const profile = await companyProfileFlow.openCompanyProfile();
            expect(profile.rowCount, 'Company profile rows rendered').toBeGreaterThan(0);
            // toEqual([]) rather than a length check: on a failure the report then names
            // what leaked through, which is the first thing anyone would ask.
            expect(profile.availableActions, 'Rows a non-holder can act on').toEqual([]);
        });

        await ReportLog.step('Check what the users list offers a non-holder', async () => {
            const users = await companyProfileFlow.openUsersList();
            expect(users.rowCount, 'Company users listed').toBeGreaterThan(0);
            expect(users.actionHrefs, 'Actions a non-holder is offered on the users list')
                .toEqual([]);
        });
    });
});
