import { BASE_URL } from '../../../config/environment';
import { COMPANY_PROFILE, getCredentials, isProfileConfigured } from '../../../src/auth/credentials';
import { ALL_COMPANY_PROFILE_ACTIONS } from '../../../src/constant/company-profile-action-constant';
import { ReportLog } from '../../../src/core/report/report-log';
import { reportTestCaseLink } from '../../../src/helper/report-helper';
import { test, expect } from '../../base-test';
import { COMPANY_PROFILE_SECTIONS } from '../../../src/test-data/company-profile-edit-data';

const ACCOUNT_HOLDER_TEST_ID = '2406';
const NON_ACCOUNT_HOLDER_TEST_ID = '2407';
const EORI_CHANGE_TEST_ID = '2437';

test.describe('TSS Portal company profile - edit permissions', { tag: '@single-account' }, () => {

    // Both halves of this file need the pair of accounts, so one answer covers it.
    test.skip(
        !isProfileConfigured(COMPANY_PROFILE.PRIMARY_HOLDER)
        || !isProfileConfigured(COMPANY_PROFILE.NON_PRIMARY_HOLDER),
        'PRIMARY_HOLDER_USER_NAME and NON_PRIMARY_HOLDER_USER_NAME are not both configured for this environment'
    );


    test('An account holder can edit the company profile and its users', { tag: ['@auth', '@authorisation', '@regression'], lock: COMPANY_PROFILE.PRIMARY_HOLDER }, async ({ signInFlow, companyProfileFlow }, testInfo) => {
        reportTestCaseLink(ACCOUNT_HOLDER_TEST_ID);

        const account = getCredentials(COMPANY_PROFILE.PRIMARY_HOLDER);

        await signInFlow.signIn(account, { baseUrl: BASE_URL, testInfo });

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


    test('Verify PAH Cannot Edit EORI Numbers and Must Use Contact Center Request', { tag: ['@auth', '@authorisation', '@regression'], lock: COMPANY_PROFILE.PRIMARY_HOLDER }, async ({ signInFlow, companyProfileFlow }, testInfo) => {
        reportTestCaseLink(EORI_CHANGE_TEST_ID);

        const account = getCredentials(COMPANY_PROFILE.PRIMARY_HOLDER);

        await signInFlow.signIn(account, { baseUrl: BASE_URL, testInfo });

        await ReportLog.step('Check each EORI change sends the holder to contact support', async () => {
            await companyProfileFlow.openCompanyProfile();
            await companyProfileFlow.verifyEoriChangeLeadsToContactSupport();
        });
    });


    test('Verify Non-PAH User Has Read-Only Access to Company Profile', { tag: ['@auth', '@authorisation', '@regression'], lock: COMPANY_PROFILE.NON_PRIMARY_HOLDER }, async ({ signInFlow, companyProfileFlow }, testInfo) => {
        reportTestCaseLink(NON_ACCOUNT_HOLDER_TEST_ID);

        const account = getCredentials(COMPANY_PROFILE.NON_PRIMARY_HOLDER);

        await signInFlow.signIn(account, { baseUrl: BASE_URL, testInfo });

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


    test.describe('Edit company profile section', () => {
        test.use({ authProfile: COMPANY_PROFILE.PRIMARY_HOLDER });

        for (const section of COMPANY_PROFILE_SECTIONS) {
            test(`Verify PAH Can Edit the "${section.name}" on the Company Profile`, { tag: ['@regression'], lock: COMPANY_PROFILE.PRIMARY_HOLDER }, async ({ companyProfileEditFlow }, testInfo) => {
                reportTestCaseLink(ACCOUNT_HOLDER_TEST_ID);

                await companyProfileEditFlow.openCompanyProfile(BASE_URL, testInfo);

                await ReportLog.step(`Change the ${section.name.toLowerCase()} and check the profile shows them`, () =>
                    companyProfileEditFlow.verifyFieldEdits(section.edits())
                );
            });
        }

        test('Verify PAH Can Edit the "Preferred Method of Payment" on the Company Profile', { tag: ['@regression'], lock: COMPANY_PROFILE.PRIMARY_HOLDER }, async ({ companyProfileEditFlow }, testInfo) => {
            reportTestCaseLink(ACCOUNT_HOLDER_TEST_ID);

            await companyProfileEditFlow.openCompanyProfile(BASE_URL, testInfo);

            await ReportLog.step('Change the preferred method of payment and check the profile and the Portal API show it', () =>
                companyProfileEditFlow.verifyPreferredPaymentMethodEdit()
            );
        });
    });
}); 
