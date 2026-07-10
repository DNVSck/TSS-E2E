import { BasePage } from "./base-page";
import { Page, Locator } from '@playwright/test';
import { INITIAL_FORM_DECLARATION } from '../constant/initial-form-declaration-constants';


export class InitialFormDeclaraPage extends BasePage {

    private readonly gbToNIRoRoOption: Locator;
    private readonly niToGBRoRoOption: Locator;
    private readonly gbToNIIrelandOption: Locator;
    private readonly niToGBIrelandOption: Locator;
    private readonly restOfWorldToNIOption: Locator;

    private readonly ensDeclarationOption: Locator;
    private readonly standaloneOption: Locator;

    private readonly ensCustomsOrEnsOnlyOption: Locator;

    private readonly internalMarketMovementInformationOption: Locator;
    private readonly simplifiedDeclarationOption: Locator;
    private readonly standardDeclarationOption: Locator;

    constructor(page: Page) {
        super(page);

        // "Which route are the goods taking? - Direction of declaration" screen
        this.gbToNIRoRoOption = page.locator("input#directionOfDeclaration-directionOptions__directionOfDeclaration-gb-ni-process");
        this.niToGBRoRoOption = page.locator("input#directionOfDeclaration-directionOptions-ni-gb-process");
        this.gbToNIIrelandOption = page.locator("input#directionOfDeclaration-directionOptions-import-transit-declaration");
        this.niToGBIrelandOption = page.locator("input#directionOfDeclaration-directionOptions-export-transit-declaration");
        this.restOfWorldToNIOption = page.locator("input#directionOfDeclaration-directionOptions-ni-arrival-mode");

        //"What information do you want to submit? - Type of submission" screen
        this.ensDeclarationOption = page.locator("input#process-gbNiProcessOptions-ens-with-or-without-customs");
        this.standaloneOption = page.locator("input#process-gbNiProcessOptions-standalone-customs");

        // "Which ENS process do you want to follow? - Type of ENS submission" screen
        this.ensCustomsOrEnsOnlyOption = page.locator("input#ensSubmissionType-gbNiEnsSubmissionTypeOptions__ensSubmissionType-ens-and-customs-now-or-ens-only");

        // "Which standalone customs declaration are you submitting? - Declaration type" screen
        this.internalMarketMovementInformationOption = page.locator("input#standaloneCustomsType-gbNiStandaloneCustomsTypeWithImmiOptions-immi");
        this.simplifiedDeclarationOption = page.locator("input#standaloneCustomsType-gbNiStandaloneCustomsTypeWithImmiOptions-simplified");
        this.standardDeclarationOption = page.locator("input#standaloneCustomsType-gbNiStandaloneCustomsTypeWithImmiOptions-standard");

    }   

    async selectDirectionOfDeclaration(route: string): Promise<void> {
        if (route.includes(INITIAL_FORM_DECLARATION.DIRECTION_OF_DECLARATION.GB_TO_NI)) 
        {
            await this.gbToNIRoRoOption.click();
        } 
        await this.clickContinueButton();
    }

    async selectTypeOfSubmission(submissionType: string): Promise<void> {
        if (
            submissionType.includes(
                INITIAL_FORM_DECLARATION.TYPE_OF_SUBMISSION.ENS
            )
        ) {
            await this.ensDeclarationOption.click();
        } else if (
            submissionType.includes(
                INITIAL_FORM_DECLARATION.TYPE_OF_SUBMISSION.STANDALONE
            )
        ) {
            await this.standaloneOption.click();
        }
        await this.clickContinueButton();
    }

    async selectTypeOfEnsSubmission(ensSubmissionType: string): Promise<void> {
         if (
            ensSubmissionType.includes(
                INITIAL_FORM_DECLARATION.TYPE_OF_ENS_SUBMISSION.ENS_CUSTOM_OR_ENS_ONLY
            )
        ) {
            await this.ensCustomsOrEnsOnlyOption.click();
        }
        await this.clickContinueButton();
    }

    async selectStandaloneDeclarationType(standaloneDeclarationType: string): Promise<void> {
        if (
            standaloneDeclarationType.includes(
                INITIAL_FORM_DECLARATION.STANDALONE_DECLARATION_TYPE.INTERNAL_MARKET_MOVEMENT_INFORMATION
            )
        ) {
            await this.page.locator("input#standaloneDeclarationType-standaloneDeclarationTypeOptions__standaloneDeclarationType-internal-market-movement-information").click();
        }
        else if (
            standaloneDeclarationType.includes(
                INITIAL_FORM_DECLARATION.STANDALONE_DECLARATION_TYPE.SIMPLIFIED_DECLARATION
            )
        ) {
            await this.simplifiedDeclarationOption.click();
        }
        else if (
            standaloneDeclarationType.includes(
                INITIAL_FORM_DECLARATION.STANDALONE_DECLARATION_TYPE.STANDARD_DECLARATION
            )
        ) {
            await this.standardDeclarationOption.click();
        }

        await this.clickContinueButton();
    }


}
