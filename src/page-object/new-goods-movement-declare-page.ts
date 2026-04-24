import { BasePage } from "./base-page";
import { Page, Locator } from '@playwright/test';
import { PASSIVE_TRANSPORT_TYPE, PassiveTransportTypeKey } from '../constant/passive-transport-type-constant';
import { PORT_OF_ARRIVAL, PortOfArrivalKey } from '../constant/port-of-arrival-constant';
import { NEW_GOODS_MOVEMENT_DECLARATION, TypeOfMovementKey, TYPE_OF_MOVEMENT_OPTION_CODE } from "../constant/goods-movement-declaration-constants";
import { COUNTRY_CODE, CountryCodeKey } from "../constant/country-code-dropdown-constant";

import { selectDropdownValue } from '../core/util/element-helper';
import { DateTimeUtil } from '../core/util/date-time-util.js';



export class NewGoodsMovementDeclarePage extends BasePage {

    typeOfMovementOption: string;

    imoNumberInput: Locator;
    nationalityOfMeanOfTransportInput: Locator;
    conveyanceReferenceNumberInput: Locator;

    trailerRegistrationNumberInput: Locator;
    typeOfPassiveTransport: Locator;
    vehicleRegistrationNumberInput: Locator;

    sealNumberInput: Locator;

    carrierResponsibleOption: Locator;
    onBehalfOfCarrierOption: Locator;
    theSameAsHaulierOption: Locator;
    differentFromHaulierOption: Locator;

    carrierEoriInput: Locator;
    haulierEoriInput: Locator;

    arrivalDateTimeInput: Locator;
    portOfArrivalDropdown: Locator;

    placeOfLoadingInput: Locator;

    placeOfUnloadingInput: Locator;

    isAcceptanceSameYesOption: Locator;
    isAcceptanceSameNoOption: Locator;
    isDeliverySameYesOption: Locator;
    isDeliverySameNoOption: Locator;

    placeOfAcceptanceAddressLineInput: Locator;
    placeOfAcceptancePostcodeInput: Locator;
    placeOfAcceptanceCityInput: Locator;

    placeOfDeliveryAddressLineInput: Locator;
    placeOfDeliveryPostcodeInput: Locator;
    placeOfDeliveryCityInput: Locator;

    transportCharges: Locator;

    constructor(page: Page) {
        super(page);

        // "Type of movement" screen
        this.typeOfMovementOption = "input#typeOfMovement-typeOfMovementOptions-{movementType}";

        // "Enter transport details" screen
        this.imoNumberInput = page.locator("input#imoNumber");
        this.nationalityOfMeanOfTransportInput = page.locator("select#nationalityMeansOfTransport ");
        this.conveyanceReferenceNumberInput = page.locator("input#conveyanceReferenceNumber");

        this.trailerRegistrationNumberInput = page.locator("input#trailerRegistrationNumber");

        this.typeOfPassiveTransport = page.locator('input[name="typeOfPassiveTransport"]');

        this.vehicleRegistrationNumberInput = page.locator("input#vehicleRegistrationNumber");

        this.sealNumberInput = page.locator("input#sealNumber");

        // "Who is responsible for this movement?" screen
        // "What is your role in this movement?" screen
        // NOTE: Need to check is it a dynamic locator or not since it's ID contains a number
        this.carrierResponsibleOption = page.locator("input#declarantRole-10002-carrier");
        this.onBehalfOfCarrierOption = page.locator("input#declarantRole-10002-declarant");
        this.theSameAsHaulierOption = page.locator("input#haulierInvolvement-10001-same");
        this.differentFromHaulierOption = page.locator("input#haulierInvolvement-10001-different");

        //"Enter carrier EORI details"
        this.carrierEoriInput = page.locator("input#carrierEori");

        //"Enter haulier EORI details"
        this.haulierEoriInput = page.locator("input#haulierEori");

        //"Enter arrival date and time"
        this.arrivalDateTimeInput = page.locator("input#arrivalDateTime");

        //"Select port of arrival"
        this.portOfArrivalDropdown = page.locator("select#portOfArrival");

        //"Enter place of loading place details" screen
        this.placeOfLoadingInput = page.locator("input#placeOfLoading");


        //"Enter place of unloading place details" screen
        this.placeOfUnloadingInput = page.locator("input#placeOfUnloading");

        // "Place of acceptance and delivery" screen
        this.isAcceptanceSameYesOption = page.locator("input#isAcceptanceSame-yesNoOptions-yes");
        this.isAcceptanceSameNoOption = page.locator("input#isAcceptanceSame-yesNoOptions-no");
        this.isDeliverySameYesOption = page.locator("input#isDeliverySame-yesNoOptions-yes");
        this.isDeliverySameNoOption = page.locator("input#isDeliverySame-yesNoOptions-no");

        this.placeOfAcceptanceAddressLineInput = page.locator("input#placeOfAcceptanceAddressLine");
        this.placeOfAcceptanceCityInput = page.locator("input#placeOfAcceptanceTownOrCity");
        this.placeOfAcceptancePostcodeInput = page.locator("input#placeOfAcceptancePostcode");

        this.placeOfDeliveryAddressLineInput = page.locator("input#placeOfDeliveryAddressLine");
        this.placeOfDeliveryCityInput = page.locator("input#placeOfDeliveryTownOrCity");
        this.placeOfDeliveryPostcodeInput = page.locator("input#placeOfDeliveryPostcode");

        //"How will the transport charges be paid?" screen
        this.transportCharges = page.locator('input[name="transportCharges"]');
    }

    async chooseTypeOfMovement(typeOfMovement: string): Promise<void> {
        await this.page.locator(`input[name="typeOfMovement"][value="${typeOfMovement}"]`).click();
        await this.commonContinueButton.click();
    }

    async inputImoNumber(imoNumber: string): Promise<void> {
        await this.imoNumberInput.fill(imoNumber);
    }

    async selectNationalityOfMeanOfTransport(countryCode: CountryCodeKey): Promise<void> {
        const nationalityOfMeanOfTransportCode = COUNTRY_CODE[countryCode];
        await selectDropdownValue(this.nationalityOfMeanOfTransportInput, nationalityOfMeanOfTransportCode);
    }

    async inputConveyanceReferenceNumber(conveyanceReferenceNumber: string): Promise<void> {
        await this.conveyanceReferenceNumberInput.fill(conveyanceReferenceNumber);
    }

    async selectTypeOfPassiveTransport(typeOfPassiveTransport: string, vehicleRegistrationNumber: string): Promise<void> {
        await this.page.locator(`input[name="typeOfPassiveTransport"][value="${typeOfPassiveTransport}"]`).click();
        await this.vehicleRegistrationNumberInput.fill(vehicleRegistrationNumber);
    }

    async inputVehicleRegistrationNumber(vehicleRegistrationNumber?: string): Promise<void> {
        await this.vehicleRegistrationNumberInput.fill(vehicleRegistrationNumber ?? '');
    }

    async inputTrailerRegistrationNumber(trailerRegistrationNumber?: string): Promise<void> {
        await this.trailerRegistrationNumberInput.fill(trailerRegistrationNumber ?? '');
    }

    async inputSealNumber(sealNumber?: string): Promise<void> {
        await this.sealNumberInput.fill(sealNumber ?? '');
    }

    async chooseYourRoleInThisMovement(role: string): Promise<void> {
        if (role.includes(NEW_GOODS_MOVEMENT_DECLARATION.ROLE_IN_THIS_MOVEMENT.CARRIER)) {
            await this.carrierResponsibleOption.check();
        } else if (role.includes(NEW_GOODS_MOVEMENT_DECLARATION.ROLE_IN_THIS_MOVEMENT.ON_BEHALF_OF_CARRIER)) {
            await this.onBehalfOfCarrierOption.check();
        }
    }

    async chooseHaulierInvolvement(haulierInvolvement: string): Promise<void> {
        if (haulierInvolvement.includes(NEW_GOODS_MOVEMENT_DECLARATION.SEPARATE_HAULIER_THIS_MOVEMENT.CARRIER_IS_HAULIER)) {
            await this.theSameAsHaulierOption.check();
        } else if (haulierInvolvement.includes(NEW_GOODS_MOVEMENT_DECLARATION.SEPARATE_HAULIER_THIS_MOVEMENT.SEPARATE_HAULIER)) {
            await this.differentFromHaulierOption.check();
        }
    }

    async inputPlaceOfLoading(placeOfLoading: string): Promise<void> {
        await this.placeOfLoadingInput.fill(placeOfLoading);
    }

    async inputPlaceOfUnloading(placeOfUnloading: string): Promise<void> {
        await this.placeOfUnloadingInput.fill(placeOfUnloading);
    }

    async selectPortOfArrival(portOfArrivalKey: string): Promise<void> {
        await selectDropdownValue(this.portOfArrivalDropdown, portOfArrivalKey);
    }

    async clearPortOfArrival(): Promise<void> {
        await selectDropdownValue(this.portOfArrivalDropdown, '');
    }

    async inputArrivalDateTime(arrivalDateTime?: string): Promise<void> {
        const value = arrivalDateTime ?? DateTimeUtil.generateValidArrivalDate();
        await this.arrivalDateTimeInput.fill(value);
    }

    async submitTransportDetails(imoNumber: string, nationalityOfMeanOfTransport: string): Promise<void> {
        await this.imoNumberInput.fill(imoNumber);
        await this.nationalityOfMeanOfTransportInput.selectOption({ value: nationalityOfMeanOfTransport });
    }

    async clickContinueButton(): Promise<void> {
        await this.commonContinueButton.click();
    }

    async selectAcceptanceSameAsLoading(): Promise<void> {
        await this.isAcceptanceSameYesOption.check();
    }

    async selectAcceptanceNotSameAsLoading(): Promise<void> {
        await this.isAcceptanceSameNoOption.check();
    }

    async selectDeliverySameAsUnloading(): Promise<void> {
        await this.isDeliverySameYesOption.check();
    }

    async selectDeliveryNotSameAsUnloading(): Promise<void> {
        await this.isDeliverySameNoOption.check();
    }

    async selectTransportCharges(transportChargesKey: string): Promise<void> {
        await this.transportCharges.and(this.page.locator(`[value="${transportChargesKey}"]`)).click();
    }

    async clickFinishButton(): Promise<void> {
        await this.commonFinishButton.click();
    }
}