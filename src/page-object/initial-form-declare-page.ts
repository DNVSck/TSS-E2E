import { BasePage } from "./base-page";
import { Page, Locator, expect } from '@playwright/test';
import { ROUTE_DECLARATION } from '../constant/route-declaration-constants';
import { ROUTES } from '../constant/endpoints-constant';


export class MovementHeaderDeclarePage extends BasePage {
    startDeclarationButton: Locator;

    gbToNIRoRoOption: Locator;
    niToGBRoRoOption: Locator;
    gbToNIIrelandOption: Locator;
    niToGBIrelandOption: Locator;
    restOfWorldToNIOption: Locator;

    simplifiedCustomsDeclarationProcessOption: Locator;
    fullFrontierOption: Locator;
    entrySummaryDeclarationOnlyOption: Locator;

    standardProcessOption: Locator;
    consignmentFirstProcessOption: Locator;

    uploadCSVOption: Locator;
    createManuallyOption: Locator;
    createFromTemplateOption: Locator;

    combinedFFDWithENSOption: Locator;
    standaloneFFDOption: Locator;

    immiOrSfdOutsideTssOption: Locator;
    eidrOutsideTssOption: Locator;
    emptyVehicleEnsForGvmsOption: Locator;
    transitOrTransshipmentNoImportTssOption: Locator;
    temporaryStorageOutsideTssOption: Locator;
    standaloneImmiOrFfdWithinTssOption: Locator;



    constructor(page: Page) {
        super(page);
        this.startDeclarationButton = page.locator("//a[contains(@class,'govuk-button--start')]");
        //"Select the direction of goods movement you want to start" screen
        this.gbToNIRoRoOption = page.locator("input#directionOfDeclaration-directionOptions-gb-ni-process");
        this.niToGBRoRoOption = page.locator("input#directionOfDeclaration-directionOptions-ni-gb-process");
        this.gbToNIIrelandOption = page.locator("input#directionOfDeclaration-directionOptions-import-transit-declaration");
        this.niToGBIrelandOption = page.locator("input#directionOfDeclaration-directionOptions-export-transit-declaration");
        this.restOfWorldToNIOption = page.locator("input#directionOfDeclaration-directionOptions-ni-arrival-mode");
        //"Select the goods movement process" screen
        this.simplifiedCustomsDeclarationProcessOption = page.locator("input#process-gbNiProcessOptions-simplified");
        this.fullFrontierOption = page.locator("input#process-gbNiProcessOptions-full-frontier");
        this.entrySummaryDeclarationOnlyOption = page.locator("input#process-gbNiProcessOptions-ens");
        //"Select a process" screen
        this.standardProcessOption = page.locator("input#processGoodsMovement-goodsMovementOptions-standard");
        this.consignmentFirstProcessOption = page.locator("input#processGoodsMovement-goodsMovementOptions-consignment-declaration");

        // "How would you like to start?" screen
        this.uploadCSVOption = page.locator("input#howToStart-goodsMovementInitializeOptions-upload-csv");
        this.createManuallyOption = page.locator("input#howToStart-goodsMovementInitializeOptions-create-manually");
        this.createFromTemplateOption = page.locator("input#howToStart-goodsMovementInitializeOptions-create-template");

        // "Are you doing an ENS with an FFD?" screen
        this.combinedFFDWithENSOption = page.locator("input#ensFfdChoice-ensFfdOptions-ffd-with-ens");
        this.standaloneFFDOption = page.locator("input#ensFfdChoice-ensFfdOptions-ffd-standalone");

        //"Why do you only need an Entry Summary Declaration?" screen
        this.immiOrSfdOutsideTssOption = page.locator("input#ensOnlyReason-ensOnlyReasons-My trader is due to submit an Internal Market Movement Information (IMMI) or a Simplified Frontier Declaration (SFD) using a system outside of TSS");
        this.eidrOutsideTssOption = page.locator("input#ensOnlyReason-ensOnlyReasons-My goods will be declared by EIDR using a customs system outside of TSS");
        this.emptyVehicleEnsForGvmsOption = page.locator("input#ensOnlyReason-ensOnlyReasons-I am transporting an empty container/trailer/van/lorry under a contract of carriage, which requires an Entry Summary Declaration for GVMS");
        this.transitOrTransshipmentNoImportTssOption = page.locator("input#ensOnlyReason-ensOnlyReasons-My goods are the subject of a Transit declaration or are using the transshipment arrangements that do not require an import declaration through TSS into NI");
        this.temporaryStorageOutsideTssOption = page.locator("input#ensOnlyReason-ensOnlyReasons-My goods are entering Temporary storage and the customs declaration (if required) will be made outside of TSS");
        this.standaloneImmiOrFfdWithinTssOption = page.locator("input#ensOnlyReason-ensOnlyReasons-I am submitting a separate/stand alone Internal Market Movement Information (IMMI) or a Full Frontier Declaration (FFD) within TSS");

    }


    async startDeclareRouteJourney(): Promise<void> {
        await this.page.waitForURL(ROUTES.PORTAL.DECLARATION_FORM.INTRODUCTORY);
        await expect(this.startDeclarationButton).toBeVisible();
        await this.startDeclarationButton.click();
    }

    async selectRoute(route: string): Promise<void> {

        if (route.includes(ROUTE_DECLARATION.ROUTE.GB_TO_NI)) 
        {
            await this.gbToNIRoRoOption.click();
        } else if (route.includes(ROUTE_DECLARATION.ROUTE.NI_TO_GB)) 
        {
            await this.niToGBRoRoOption.click();
        } else if (route.includes(ROUTE_DECLARATION.ROUTE.GB_TO_NI_VIA_IRELAND)) 
        {
            await this.gbToNIIrelandOption.click();
        } else if (route.includes(ROUTE_DECLARATION.ROUTE.NI_TO_GB_VIA_IRELAND)) 
        {
            await this.niToGBIrelandOption.click();
        } else if (route.includes(ROUTE_DECLARATION.ROUTE.REST_OF_WORLD_TO_GB)) 
        {
            await this.restOfWorldToNIOption.click();
        }
    }

    async selectRouteAndContinue(route: string): Promise<void> {
        await this.selectRoute(route);
        await this.commonContinueButton.click();
    }

    async selectGoodsMovementProcess(process: string): Promise<void> {
        if (
            process.includes(
                ROUTE_DECLARATION.GOODS_MOVEMENT_PROCESS.SIMPLIFIED_CUSTOMS_DECLARATION_PROCESS
            )
        ) {
            await this.simplifiedCustomsDeclarationProcessOption.click();
        } else if (
            process.includes(
                ROUTE_DECLARATION.GOODS_MOVEMENT_PROCESS.FULL_FRONTIER
            )
        ) {
            await this.fullFrontierOption.click();
        } else if (
            process.includes(
                ROUTE_DECLARATION.GOODS_MOVEMENT_PROCESS
                    .ENTRY_SUMMARY_DECLARATION_ONLY
            )
        ) {
            await this.entrySummaryDeclarationOnlyOption.click();
        }
    }

    async selectGoodsMovementProcessAndContinue(process: string): Promise<void> {
        await this.selectGoodsMovementProcess(process);
        await this.commonContinueButton.click();
    }


    async selectProcess(process: string): Promise<void> {
        if (process.includes(ROUTE_DECLARATION.PROCESS.STANDARD_PROCESS)) {
            await this.standardProcessOption.click();
        } else if (
            process.includes(
                ROUTE_DECLARATION.PROCESS.CONSIGNMENT_FIRST_PROCESS
            )
        ) {
            await this.consignmentFirstProcessOption.click();
        }
    }

    async selectProcessAndContinue(process: string): Promise<void> {
        await this.selectProcess(process);
        await this.commonContinueButton.click();
    }

    async selectHowToStartOptionAndContinue(option: string): Promise<void> {
        if (option.includes(ROUTE_DECLARATION.HOW_TO_START.UPLOAD_CSV)) {
            await this.uploadCSVOption.click();
        } else if (
            option.includes(ROUTE_DECLARATION.HOW_TO_START.CREATE_MANUALLY)
        ) {
            await this.createManuallyOption.click();
        } else if (
            option.includes(
                ROUTE_DECLARATION.HOW_TO_START.CREATE_FROM_TEMPLATE
            )
        ) {
            await this.createFromTemplateOption.click();
        }
        await this.commonContinueButton.click();
    }

    async completeRouteDeclaration(route: string, goodsMovementProcess: string, process: string, howToStart: string): Promise<void> {
        console.log(route, goodsMovementProcess, process, howToStart);
        await this.selectRouteAndContinue(route);
        await this.selectGoodsMovementProcessAndContinue(goodsMovementProcess);
        await this.selectProcessAndContinue(process);
        await this.selectHowToStartOptionAndContinue(howToStart);
        await this.commonFinishButton.click();
    }

}