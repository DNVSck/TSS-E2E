import { BasePage } from "./base-page";
import { Page, Locator } from '@playwright/test';
import { INITIAL_FORM_DECLARATION } from '../constant/initial-form-declaration-constants';
import { selectAutocompleteValue, checkRadioByValue } from '../helper/element-helper';


export class InitialFormDeclaraPage extends BasePage {

    private readonly directionOfDeclarationRadios: Locator;

    private readonly typeOfSubmissionRadios: Locator;

    private readonly typeOfEnsSubmissionRadios: Locator;

    private readonly importerEoriInput: Locator;
    private readonly importerEoriOptions: Locator;

    private readonly standaloneDeclarationTypeRadios: Locator;
    private readonly internalMarketMovementOption: Locator;

    constructor(page: Page) {
        super(page);

        // "Which route are the goods taking? - Direction of declaration" screen
        this.directionOfDeclarationRadios = page.locator('input[name="directionOfDeclaration"]');

        //"What information do you want to submit? - Type of submission" screen
        this.typeOfSubmissionRadios = page.locator('input[name="process"]');

        // "Which ENS process do you want to follow? - Type of ENS submission" screen
        this.typeOfEnsSubmissionRadios = page.locator('input[name="ensSubmissionType"]');

        // "Who is the importer?" screen
        this.importerEoriInput = page.locator("input#importerEORI");
        this.importerEoriOptions = page.locator("[id^='importerEORI__option--']");

        // "Which standalone customs declaration are you submitting? - Declaration type" screen
        const standaloneDeclarationType = 'input[name="standaloneCustomsType"]';
        this.standaloneDeclarationTypeRadios = page.locator(standaloneDeclarationType);
        this.internalMarketMovementOption = page.locator(
            `${standaloneDeclarationType}[value="${INITIAL_FORM_DECLARATION.STANDALONE_DECLARATION_TYPE.INTERNAL_MARKET_MOVEMENT_INFORMATION}"]`
        );
    }

    async selectDirectionOfDeclaration(route: string): Promise<void> {
        await checkRadioByValue(this.directionOfDeclarationRadios, route);
        await this.clickContinueButton();
    }

    async selectTypeOfSubmission(submissionType: string): Promise<void> {
        await checkRadioByValue(this.typeOfSubmissionRadios, submissionType);
        await this.clickContinueButton();
    }

    async selectTypeOfEnsSubmission(ensSubmissionType: string): Promise<void> {
        await checkRadioByValue(this.typeOfEnsSubmissionRadios, ensSubmissionType);
        await this.clickContinueButton();
    }

    async selectImporter(eori: string): Promise<void> {
        await selectAutocompleteValue(this.importerEoriInput, this.importerEoriOptions, eori);
        await this.clickContinueButton();
    }

    /**
     * Whether this screen offers the Internal Market Movement option at all.
     *
     * Waiting on whichever of the three options arrives first tells "the screen has
     * painted and IMMI is not among the choices" apart from "the screen has not
     * painted yet", without spending a timeout on the answer.
     */
    async isInternalMarketMovementOffered(): Promise<boolean> {
        await this.standaloneDeclarationTypeRadios.first().waitFor();

        return this.internalMarketMovementOption.isVisible();
    }

    async selectStandaloneDeclarationType(standaloneDeclarationType: string): Promise<void> {
        await checkRadioByValue(this.standaloneDeclarationTypeRadios, standaloneDeclarationType);
        await this.clickContinueButton();
    }
}
