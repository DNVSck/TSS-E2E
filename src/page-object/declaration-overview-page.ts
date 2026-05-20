import { BasePage } from "./base-page";
import { Page, Locator } from '@playwright/test';
import { TFunction } from '../fixtures/locale-fixture';
import { expect } from '../../tests/test-hooks';
import { StringUtil } from '../core/util/string-util';
import { LOCAL_REFERENCE } from '../constant/local-reference-constants';


export class DeclarationOverviewPage extends BasePage {

    // Declare properties - Using stable locators (NOT text-based)
    ensConsignmentsTab: Locator;
    sfdConsignmentsTab: Locator;
    gmrDetailsTab: Locator;
    newENSConsignmentBtn: Locator;
    uploadCSVBtn: Locator;
    associateConsignmentBtn: Locator;

    localReferenceNumber: Locator;
    declarationStatus: Locator;


    constructor(page: Page, t: TFunction) {
        super(page, t);

        const localReferenceLabel = this.t!('movementHeaderOverview.localReferenceNumber');
        const declarationStatusLabel = this.t!('movementHeaderOverview.declarationStatus');
        
        this.ensConsignmentsTab = page.locator("//a[contains(@href, '/overview/#overview-tab')]");
        this.sfdConsignmentsTab = page.locator("//a[contains(@href, '/overview/sfd-consignments#overview-tab')]");
        this.gmrDetailsTab = page.locator("//a[contains(@href, '/overview/gmr-details#overview-tab')]");
        this.newENSConsignmentBtn = page.locator("button[value='new-record']");
        this.uploadCSVBtn = page.locator("button[value='upload-csv']");
        this.associateConsignmentBtn = page.locator("button[value='associate-consignment']");

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

    async assertDraftMovementOverview(): Promise<void> {
        const localReferenceNumber = await this.getTextLocalReferenceNumber();
        const declarationStatus = await this.getTextDeclarationStatus();
        const expectedStatus = this.t!('status.draft');

        expect(localReferenceNumber).toBeTruthy();
        expect(StringUtil.verifyRegex(localReferenceNumber, LOCAL_REFERENCE.ENS_REGEX)).toBeTruthy();

        expect(declarationStatus).toBe(expectedStatus);
    }
}