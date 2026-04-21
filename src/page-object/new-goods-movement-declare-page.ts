import { BasePage } from "./base-page";
import { Page, Locator } from '@playwright/test';
import { PASSIVE_TRANSPORT_TYPE, PassiveTransportTypeKey } from '../constant/passive-transport-type-constant';
import { PORT_OF_ARRIVAL, PortOfArrivalKey } from '../constant/port-of-arrival-constant';
import { NEW_GOODS_MOVEMENT_DECLARATION, TypeOfMovementKey, TYPE_OF_MOVEMENT_OPTION_CODE } from "../constant/goods-movement-declaration-constants";
import { COUNTRY_CODE, CountryCodeKey } from "../constant/country-code-dropdown-constant";

import { selectDropdownValue} from '../core/util/element-helper';
import { DateTimeUtil } from '../core/util/date-time-util';



export class NewGoodsMovementDeclarePage extends BasePage {

    typeOfMovementOption: string;

    imoNumberInput: Locator;
    nationalOfMeansOfTransportDropdown: Locator;
    conveyanceReferenceNumberInput: Locator;

    trailerRegistrationNumberInput: Locator;
    typeOfPassiveTransportOption: string;
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

    accountHolderWithCarrierOption: Locator;
    thirdPartyOption: Locator;
    consigneeOption: Locator;
    consignorOption: Locator;
    freightForwarderOption: Locator;

    constructor(page: Page) {
        super(page);
        
        // "Type of movement" screen
        this.typeOfMovementOption = "input#typeOfMovement-typeOfMovementOptions-{movementType}";

        // "Enter transport details" screen
        this.imoNumberInput = page.locator("input#imoNumber");
        this.nationalOfMeansOfTransportDropdown = page.locator("select#nationalityMeansOfTransport");
        this.conveyanceReferenceNumberInput = page.locator("input#conveyanceReferenceNumber");

        this.trailerRegistrationNumberInput = page.locator("input#trailerRegistrationNumber");

        this.typeOfPassiveTransportOption = "input#typeOfPassiveTransport-typeOfPassiveTransport-{transportType}";
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
        this.accountHolderWithCarrierOption = page.locator("input#transportCharges-10003-account-holder-with-carrier");
        this.thirdPartyOption = page.locator("input#transportCharges-10003-third-party");
        this.consigneeOption = page.locator("input#transportCharges-10003-consignee");
        this.consignorOption = page.locator("input#transportCharges-10003-consignor");
        this.freightForwarderOption = page.locator("input#transportCharges-10003-freight-forwarder");
    }

    async chooseTypeOfMovement(movementType: TypeOfMovementKey): Promise<void> {
        const movementTypeCode = TYPE_OF_MOVEMENT_OPTION_CODE[movementType];
        const locator = this.typeOfMovementOption.replace('{movementType}', movementTypeCode);
        await this.page.locator(locator).check();
    }

    async inputImoNumber(imoNumber: string): Promise<void> {
        await this.imoNumberInput.fill(imoNumber);
    }

    async selectNationalOfMeansOfTransport(countryCode: CountryCodeKey): Promise<void> {
        const nationalOfMeansOfTransportCode = COUNTRY_CODE[countryCode];
        await selectDropdownValue(this.nationalOfMeansOfTransportDropdown, nationalOfMeansOfTransportCode);
    }

    async inputConveyanceReferenceNumber(conveyanceReferenceNumber: string): Promise<void> {
        await this.conveyanceReferenceNumberInput.fill(conveyanceReferenceNumber);
    }
    
    async chooseTypeOfPassiveTransport(transportTypeKey: PassiveTransportTypeKey): Promise<void> {
        const transportTypeCode = PASSIVE_TRANSPORT_TYPE[transportTypeKey];
        const locator = this.typeOfPassiveTransportOption.replace('{transportType}',transportTypeCode);
        await this.page.locator(locator).check();
    }

    async inputVehicleRegistrationNumber (vehicleRegistrationNumber?: string): Promise<void> {
        await this.vehicleRegistrationNumberInput.fill(vehicleRegistrationNumber ?? '');
    }

    async inputTrailerRegistrationNumber (trailerRegistrationNumber?: string): Promise<void> {
        await this.trailerRegistrationNumberInput.fill(trailerRegistrationNumber ?? '');
    }

    async inputSealNumber (sealNumber?: string): Promise<void> {
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