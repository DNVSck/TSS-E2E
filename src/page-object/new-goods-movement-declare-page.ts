import { BasePage } from "./base-page";
import { Page, Locator } from '@playwright/test';
import { PASSIVE_TRANSPORT_TYPE, PassiveTransportTypeKey } from '../constant/passive-transport-type-constant';
import { PORT_OF_ARRIVAL, PortOfArrivalKey } from '../constant/port-of-arrival-constant';

import { selectDropdownValue} from '../core/util/element-helper';
import { DateTimeUtil } from '../core/util/date-time-util';



export class NewGoodsMovementDeclarePage extends BasePage {

    roroAccompaniedOption: Locator;
    roroUnaccompaniedOption: Locator;
    airOption: Locator;
    maritimeOption: Locator;

    imoNumberInput: Locator;
    nationalOfMeansOfTransportDropdown: Locator;
    conveyanceReferenceNumberInput: Locator;

    trailerRegistrationNumberInput: Locator;
    typeOfPassiveTransportDropdown: Locator;
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

    loadingAddressLineInput: Locator;
    loadingAddressPostcodeInput: Locator;
    loadingAddressCityInput: Locator;

    unloadingAddressLineInput: Locator;
    unloadingAddressPostcodeInput: Locator;
    unloadingAddressCityInput: Locator;

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

    accountHolderWithCarrierOption: Locator;
    thirdPartyOption: Locator;
    consigneeOption: Locator;
    consignorOption: Locator;
    freightForwarderOption: Locator;

    constructor(page: Page) {
        super(page);
        
        // "Type of movement" screen
        this.roroAccompaniedOption = page.locator("input#typeOfMovement-typeOfMovementOptions-roro-accompanied-ics2");
        this.roroUnaccompaniedOption = page.locator("input#typeOfMovement-typeOfMovementOptions-roro-unaccompanied-ics2");
        this.airOption = page.locator("input#typeOfMovement-typeOfMovementOptions-air");
        this.maritimeOption = page.locator("input#typeOfMovement-typeOfMovementOptions-maritime");

        // "Enter transport details" screen
        this.imoNumberInput = page.locator("input#imoNumber");
        this.nationalOfMeansOfTransportDropdown = page.locator("select#transportNationality");
        this.conveyanceReferenceNumberInput = page.locator("input#conveyanceReferenceNumber");

        this.trailerRegistrationNumberInput = page.locator("input#trailerRegistrationNumber");
        this.typeOfPassiveTransportDropdown = page.locator("select#typeOfPassiveTransport");
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
        this.loadingAddressLineInput = page.locator("input#placeOfLoadingAddressLine");
        this.loadingAddressCityInput = page.locator("input#placeOfLoadingTownOrCity");
        this.loadingAddressPostcodeInput = page.locator("input#placeOfLoadingPostcode");

        //"Enter place of unloading place details" screen
        this.unloadingAddressLineInput = page.locator("input#placeOfUnloadingAddressLine");
        this.unloadingAddressCityInput = page.locator("input#placeOfUnloadingTownOrCity");
        this.unloadingAddressPostcodeInput = page.locator("input#placeOfUnloadingPostcode");

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
        this.accountHolderWithCarrierOption = page.locator("input#transportCharges-10003-account-holder-with-carrier");
        this.thirdPartyOption = page.locator("input#transportCharges-10003-third-party");
        this.consigneeOption = page.locator("input#transportCharges-10003-consignee");
        this.consignorOption = page.locator("input#transportCharges-10003-consignor");
        this.freightForwarderOption = page.locator("input#transportCharges-10003-freight-forwarder");
    }

    async selectTypeOfPassiveTransport(
        transportTypeKey: PassiveTransportTypeKey
    ): Promise<void> {
        const transportTypeCode = PASSIVE_TRANSPORT_TYPE[transportTypeKey];
        await selectDropdownValue(this.typeOfPassiveTransportDropdown, transportTypeCode);
    }

    async clearTypeOfPassiveTransport(): Promise<void> {
        await selectDropdownValue(this.typeOfPassiveTransportDropdown, '');
    }

    async selectPortOfArrival(portOfArrivalKey: PortOfArrivalKey): Promise<void> {
        const portOfArrivalCode = PORT_OF_ARRIVAL[portOfArrivalKey];
        await selectDropdownValue(this.portOfArrivalDropdown, portOfArrivalCode);
    }

    async clearPortOfArrival(): Promise<void> {
        await selectDropdownValue(this.portOfArrivalDropdown, '');
    }


    async inputArrivalDateTime(arrivalDateTime?: string): Promise<void> {
        const value = arrivalDateTime ?? DateTimeUtil.generateValidArrivalDate();
        await this.arrivalDateTimeInput.fill(value);
    }


}