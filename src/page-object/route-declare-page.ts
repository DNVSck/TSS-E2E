import { BasePage } from "./base-page";
import { Page, Locator, expect } from '@playwright/test';


export class RouteDeclarePage extends BasePage {
    gbToNIRoRoOption: Locator;
    niToGBRoRoOption: Locator;
    gbToNIIrelandOption: Locator;
    niToGBIrelandOption: Locator;
    inventoryToNIOption: Locator;

    simplifiedCustomsDeclarationProcessOption: Locator;
    fullFrontierOption: Locator;
    entrySummaryDeclarationOnlyOption: Locator;

    standardProcessOption: Locator;
    consignmentFirstProcessOption: Locator;

    constructor(page: Page) {
        super(page);
        //"Select the direction of goods movement you want to start" screen
        this.gbToNIRoRoOption = page.locator("input#directionOfDeclaration-directionOptions-gb-ni-process");
        this.niToGBRoRoOption = page.locator("input#directionOfDeclaration-directionOptions-ni-gb-process");
        this.gbToNIIrelandOption = page.locator("input#directionOfDeclaration-directionOptions-import-transit-declaration");
        this.niToGBIrelandOption = page.locator("input#directionOfDeclaration-directionOptions-export-transit-declaration");
        this.inventoryToNIOption = page.locator("input#directionOfDeclaration-directionOptions-ni-arrival-mode");
        //"Select the goods movement process" screen
        this.simplifiedCustomsDeclarationProcessOption = page.locator("input#process-gbNiProcessOptions-goods-movement");
        this.fullFrontierOption = page.locator("input#process-gbNiProcessOptions-full-frontier");
        this.entrySummaryDeclarationOnlyOption = page.locator("input#process-gbNiProcessOptions-ens");
        //"Select a process" screen
        this.standardProcessOption = page.locator("input#processGoodsMovement-goodsMovementOptions-ens");
        this.consignmentFirstProcessOption = page.locator("input#processGoodsMovement-goodsMovementOptions-consignment-declaration");

    }

    async selectRoute(route: string): Promise<void> {
        if (route.includes("GB to NI") && route.includes("RoRo")) {
            await this.gbToNIRoRoOption.click();
        } else if (route.includes("NI to GB") && route.includes("RoRo")) {
            await this.niToGBRoRoOption.click();
        } else if (route.includes("GB to NI") && route.includes("Ireland")) {
            await this.gbToNIIrelandOption.click();
        } else if (route.includes("NI to GB") && route.includes("Ireland")) {
            await this.niToGBIrelandOption.click();
        } else if (route.includes("Inventory to NI") && route.includes("Air and Sea")) {
            await this.inventoryToNIOption.click();
        }
    }

    async selectRouteAndContinue(route: string): Promise<void> {
        await this.selectRoute(route);
        await this.commonContinueButton.click();
    }

    async selectGoodsMovementProcess(process: string): Promise<void> {
        if (process.includes("Simplified Customs Declaration Process")) {
            await this.simplifiedCustomsDeclarationProcessOption.click();
        } else if (process.includes("Full Frontier")) {
            await this.fullFrontierOption.click();
        } else if (process.includes("Entry Summary Declaration Only")) {
            await this.entrySummaryDeclarationOnlyOption.click();
        }
    }

    async selectGoodsMovementProcessAndContinue(process: string): Promise<void> {
        await this.selectGoodsMovementProcess(process);
        await this.commonContinueButton.click();
    }


    async selectProcess(process: string): Promise<void> {
        if (process.includes("Standard Process")) {
            await this.standardProcessOption.click();
        } else if (process.includes("Consignment First Process")) {
            await this.consignmentFirstProcessOption.click();
        }
    }

    async selectProcessAndContinue(process: string): Promise<void> {
        await this.selectProcess(process);
        await this.commonContinueButton.click();
    }

    async completeRouteDeclaration(route: string, goodsMovementProcess: string, process: string): Promise<void> {
        await this.selectRouteAndContinue(route);
        await this.selectGoodsMovementProcessAndContinue(goodsMovementProcess);
        await this.selectProcessAndContinue(process);
        await this.commonFinishButton.click();
    }

}