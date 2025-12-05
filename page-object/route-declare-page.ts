import { th } from "@faker-js/faker";
import { Element } from "../core/element/element";
import { BasePage } from "./base-page";


export class RouteDeclarePage extends BasePage {
    gbToNIRoRoOption: Element;
    niToGBRoRoOption: Element;
    gbToNIIrelandOption: Element;
    niToGBIrelandOption: Element;
    inventoryToNIOption: Element;

    simplifiedCustomsDeclarationProcessOption: Element;
    fullFrontierOption: Element;
    entrySummaryDeclarationOnlyOption: Element;

    standardProcessOption: Element;
    consignmentFirstProcessOption: Element;

    constructor() {
        super();
        //"Select the direction of goods movement you want to start" screen
        this.gbToNIRoRoOption = new Element("input#directionOfDeclaration-directionOptions-gb-ni-process");
        this.niToGBRoRoOption = new Element("input#directionOfDeclaration-directionOptions-ni-gb-process");
        this.gbToNIIrelandOption = new Element("input#directionOfDeclaration-directionOptions-import-transit-declaration");
        this.niToGBIrelandOption = new Element("input#directionOfDeclaration-directionOptions-export-transit-declaration");
        this.inventoryToNIOption = new Element("input#directionOfDeclaration-directionOptions-ni-arrival-mode");
        //"Select the goods movement process" screen
        this.simplifiedCustomsDeclarationProcessOption = new Element("input#process-gbNiProcessOptions-goods-movement");
        this.fullFrontierOption = new Element("input#process-gbNiProcessOptions-full-frontier");
        this.entrySummaryDeclarationOnlyOption = new Element("input#process-gbNiProcessOptions-ens");
        //"Select a process" screen
        this.standardProcessOption = new Element("input#processGoodsMovement-goodsMovementOptions-ens");
        this.consignmentFirstProcessOption = new Element("input#processGoodsMovement-goodsMovementOptions-consignment-declaration");

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