import { BasePage } from "./base-page";
import { Page, Locator, expect } from '@playwright/test';
import { TFunction } from '../fixtures/locale-fixture';
import { LOCAL_REFERENCE } from '../constant/local-reference-constants';


export class MovementOverviewPage extends BasePage {

    // Locators. NOTE: summary-list fields (localReferenceNumber, declarationStatus)
    // are matched via translated label text, so they depend on locale/label changes.
    private readonly ensConsignmentsTab: Locator;
    private readonly sfdConsignmentsTab: Locator;
    private readonly gmrDetailsTab: Locator;
    private readonly newENSConsignmentBtn: Locator;
    private readonly uploadCSVBtn: Locator;
    private readonly associateConsignmentBtn: Locator;

    private readonly createGMRButton: Locator;

    private readonly localReferenceNumber: Locator;
    private readonly declarationStatus: Locator;


    constructor(page: Page, t: TFunction) {
        super(page, t);

        const localReferenceLabel = this.t!('movementHeaderOverview.localReferenceNumber');
        const declarationStatusLabel = this.t!('movementHeaderOverview.declarationStatus');
        
        //Tab list
        this.ensConsignmentsTab = page.locator("//a[contains(@href, '/overview/#overview-tab')]");
        this.sfdConsignmentsTab = page.locator("//a[contains(@href, '/overview/sfd-consignments#overview-tab')]");
        this.gmrDetailsTab = page.locator("//a[contains(@href, '/overview/gmr-details#overview-tab')]");

        // ENS Consignment actions
        this.newENSConsignmentBtn = page.locator("//form[contains(@action,'?index')]//button[@value='new-record']");
        this.uploadCSVBtn = page.locator("//form[contains(@action,'?index')]//button[@value='upload-csv']");
        this.associateConsignmentBtn = page.locator("//form[contains(@action,'?index')]//button[@value='associate-consignment']");

        //GMR actions
        this.createGMRButton = page.locator("//form[contains(@action,'gmr-details')]//button[@value='new-record']");

        // Summary list fields
        this.localReferenceNumber = page.locator(`.govuk-summary-list__row:has(dt:text("${localReferenceLabel}")) .govuk-summary-list__value p`);
        this.declarationStatus = page.locator(`.govuk-summary-list__row:has(dt:text("${declarationStatusLabel}")) .govuk-summary-list__value p`);

    }


    async clickNewENSConsignment(): Promise<void> {
        await this.newENSConsignmentBtn.click();
    }

    async clickUploadCSV(): Promise<void> {
        await this.uploadCSVBtn.click();
    }

    async clickAssociateConsignment(): Promise<void> {
        await this.associateConsignmentBtn.click();
    }

    async getTextLocalReferenceNumber(): Promise<string> {
        return await this.localReferenceNumber.innerText();
    }

    async getTextDeclarationStatus(): Promise<string> {
        return await this.declarationStatus.innerText();
    }

    /**
     * Both checks are soft so one run reports every mismatch, rather than hiding
     * the status behind a reference-number failure.
     */
    async assertDraftMovementOverview(): Promise<void> {
        const localReferenceNumber = await this.getTextLocalReferenceNumber();
        const declarationStatus = await this.getTextDeclarationStatus();
        const expectedStatus = this.t!('status.draft');

        // Asserting the string, not a boolean: a failure then reports the actual
        // reference number instead of a bare "expected truthy, received false".
        expect.soft(localReferenceNumber, 'Local reference number')
            .toMatch(LOCAL_REFERENCE.ENS_PREFIX);

        expect.soft(declarationStatus, 'Declaration status').toBe(expectedStatus);
    }

    async navigateToGmrTabAndClickOnCreateGMR(): Promise<void> {
        await this.gmrDetailsTab.click();
        await this.createGMRButton.click();
    }

}