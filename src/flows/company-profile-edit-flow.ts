import { expect, TestInfo } from '@playwright/test';
import { PortalPage } from '../page-object/portal-page';
import { CompanyProfilePage } from '../page-object/company-profile-page';
import { CompanyProfileEditPage } from '../page-object/company-profile-edit-page';
import { CompanyProfileService, CompanyRecord } from '../api-service/portal-api/company-profile-service';
import {
    CompanyProfileFieldEdit, CompanyProfileInput, pickPreferredPaymentMethod, preferredPaymentMethodEdits,
} from '../test-data/company-profile-edit-data';
import { CompanyProfileActionKey } from '../constant/company-profile-action-constant';
import { ReportLog } from '../core/report/report-log';
import { attachRequest, attachResponse } from '../helper/report-helper';
import { PORTAL_API_PATH } from '../constant/portal-api/portal-api-path-constant';

const SNAPSHOT_CALL = `Portal API GET ${PORTAL_API_PATH.OwnCompany} (company profile before the test)`;
const RESTORE_CALL = `Portal API PUT ${PORTAL_API_PATH.OwnCompany} (put the company profile back after the test)`;
const RESTORE_CHECK_CALL = `Portal API GET ${PORTAL_API_PATH.OwnCompany} (company profile after the restore)`;
const PAYMENT_BEFORE_CALL = `Portal API GET ${PORTAL_API_PATH.OwnCompany} (preferred method of payment before the change)`;
const PAYMENT_AFTER_CALL = `Portal API GET ${PORTAL_API_PATH.OwnCompany} (preferred method of payment after the change)`;
const PORTAL_API_RETRY_TIMEOUT = 60_000;

const softExpect = expect.configure({ soft: true });

export class CompanyProfileEditFlow {
    constructor(
        private readonly portalPage: PortalPage,
        private readonly companyProfilePage: CompanyProfilePage,
        private readonly companyProfileEditPage: CompanyProfileEditPage,
        private readonly companyProfileService: CompanyProfileService,
    ) { }

    async snapshotCompany(): Promise<CompanyRecord> {
        return ReportLog.step('Keep the company profile as it is before the test', async () => {
            const company = await this.readCompanyWithRetry();
            attachResponse(SNAPSHOT_CALL, company);
            return company;
        });
    }

    async restoreCompany(snapshot: CompanyRecord): Promise<void> {
        await ReportLog.step('Put the company profile back through the Portal API', async () => {
            const expected = this.companyProfileService.updateBodyFor(snapshot);
            attachRequest(RESTORE_CALL, expected);

            let restored: CompanyRecord | undefined;
            try {
                await expect(async () => {
                    await this.companyProfileService.updateCompany(snapshot);
                    restored = await this.companyProfileService.readCompany();
                    expect(
                        this.companyProfileService.updateBodyFor(restored),
                        'company profile read back after the restore (expects the snapshot taken before the test)'
                    ).toEqual(expected);
                }).toPass({ timeout: PORTAL_API_RETRY_TIMEOUT });
            } finally {
                if (restored) {
                    attachResponse(RESTORE_CHECK_CALL, restored);
                }
            }
        });
    }

    async openCompanyProfile(url: string, testInfo: TestInfo): Promise<void> {
        await ReportLog.step('Open the company profile', async () => {
            await this.portalPage.navigateToPortal(url, testInfo);
            await this.portalPage.openCompanyProfile();
            await this.companyProfilePage.waitForContent();
        });
    }

    async verifyFieldEdits(edits: CompanyProfileFieldEdit[]): Promise<void> {
        for (const input of edits.flatMap(edit => edit.inputs)) {
            ReportLog.setParameter(`New ${input.id}`, input.value);
        }

        const expected = new Map<CompanyProfileActionKey, string[]>();

        for (const edit of edits) {
            await ReportLog.step(`Change ${edit.field} and save it`, async () => {
                await this.companyProfilePage.openFieldChange(edit.field);
                const entered: string[] = [];
                for (const input of edit.inputs) {
                    await this.companyProfileEditPage.enterValue(input.id, input.value);
                    const shown = await this.textShownFor(input);
                    const previous = input.shownOnSameLine ? entered.pop() : undefined;

                    entered.push(previous ? `${previous} ${shown}` : shown);
                }
                expected.set(edit.field, entered);

                await this.companyProfileEditPage.continueToCheckAnswers();
                await this.companyProfileEditPage.saveAnswers();
                await this.companyProfilePage.waitForContent();

                await softExpect.poll(
                    () => this.companyProfilePage.readFieldLines(edit.field),
                    { message: `account holder should have Full on the company profile - ${edit.field} shown after saving (expects the values entered, one per line)` }
                ).toEqual(entered);
            });
        }

        await ReportLog.step('Reopen the company profile and check the changes were kept', async () => {
            await this.portalPage.openCompanyProfile();
            await this.companyProfilePage.waitForContent();

            for (const edit of edits) {
                await softExpect.poll(
                    () => this.companyProfilePage.readFieldLines(edit.field),
                    { message: `account holder should have Full on the company profile - ${edit.field} shown after reopening the profile (expects the values saved, one per line)` }
                ).toEqual(expected.get(edit.field));
            }
        });
    }

    async verifyPreferredPaymentMethodEdit(): Promise<void> {
        const current = await ReportLog.step('Read the preferred method of payment the company has now', async () => {
            const company = await this.readCompanyWithRetry();
            attachResponse(PAYMENT_BEFORE_CALL, company);
            return this.companyProfileService.preferredPaymentMethodOf(company);
        });

        const chosen = pickPreferredPaymentMethod(current);
        await this.verifyFieldEdits(preferredPaymentMethodEdits(chosen));

        await ReportLog.step('Check the Portal API marks the chosen method of payment as primary', async () => {
            let company: CompanyRecord | undefined;
            await softExpect.poll(
                async () => {
                    company = await this.companyProfileService.readCompany();
                    return this.companyProfileService.preferredPaymentMethodOf(company);
                },
                { message: `account holder should have Full on the company profile - payment method with is_primary in the Portal API after saving (expects ${chosen}, previously ${current ?? 'none'})` }
            ).toBe(chosen);
            attachResponse(PAYMENT_AFTER_CALL, company);
        });
    }

    private async readCompanyWithRetry(): Promise<CompanyRecord> {
        let company: CompanyRecord | undefined;
        await expect(async () => {
            company = await this.companyProfileService.readCompany();
        }).toPass({ timeout: PORTAL_API_RETRY_TIMEOUT });
        if (!company) {
            throw new Error(`Portal API GET ${PORTAL_API_PATH.OwnCompany} returned no company record.`);
        }
        return company;
    }

    private async textShownFor(input: CompanyProfileInput): Promise<string> {
        return input.shownAsOptionText
            ? this.companyProfileEditPage.readSelectedOption(input.id)
            : input.value;
    }
}
