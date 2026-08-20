import { BasePage } from "./base-page";
import { Page, Locator } from '@playwright/test';
import { ROLE_IN_MOVEMENT } from "../constant/role-in-movement-constant";
import { SEPARATE_HAULIER } from "../constant/separate-haulier-constant";
import { generatePreLodgedArrivalDate } from '../helper/data-generate-helper';
import { selectDropdownValue, checkRadioByValue } from '../helper/element-helper';



export class MovementDeclarePage extends BasePage {

    private readonly imoNumberInput: Locator;
    private readonly iataFlightNumberInput: Locator;
    private readonly nationalityOfMeanOfTransportInput: Locator;

    private readonly typeOfPassiveTransportDropdown: Locator;

    private readonly trailerRegistrationNumberInput: Locator;
    private readonly vehicleRegistrationNumberInput: Locator;

    private readonly sealNumberInput: Locator;

    private readonly carrierResponsibleOption: Locator;
    private readonly onBehalfOfCarrierOption: Locator;
    private readonly theSameAsHaulierOption: Locator;
    private readonly differentFromHaulierOption: Locator;

    private readonly carrierEoriInput: Locator;
    private readonly haulierEoriInput: Locator;

    private readonly arrivalDayInput: Locator;
    private readonly arrivalMonthInput: Locator;

    private readonly arrivalTimeHourInput: Locator;
    private readonly arrivalTimeMinuteInput: Locator;

    private readonly portOfArrivalInput: Locator;
    private readonly portOfArrivalOthersInput: Locator;

    private readonly placeOfLoadingInput: Locator;

    private readonly isAcceptanceSameYesOption: Locator;
    private readonly isAcceptanceSameNoOption: Locator;

    private readonly placeOfAcceptanceInput: Locator;

    private readonly placeOfUnloadingInput: Locator;

    private readonly isDeliverySameYesOption: Locator;
    private readonly isDeliverySameNoOption: Locator;

    private readonly placeOfDeliveryInput: Locator;

    constructor(page: Page) {
        super(page);

        // "Enter transport details" screen
        this.imoNumberInput = page.locator("input#imoNumber");
        this.iataFlightNumberInput = page.locator("input#iataFlightNumber");
        this.nationalityOfMeanOfTransportInput = page.locator("select#nationalityMeansOfTransport");

        this.typeOfPassiveTransportDropdown = page.locator("select#typeOfPassiveTransport");

        this.trailerRegistrationNumberInput = page.locator("input#trailerRegistrationNumber");

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
        this.arrivalDayInput = page.locator("input#arrivalDate-day");
        this.arrivalMonthInput = page.locator("input#arrivalDate-month");
        this.arrivalTimeHourInput = page.locator("input#arrivalTime-hour");
        this.arrivalTimeMinuteInput = page.locator("input#arrivalTime-minute");

        //"Select port of arrival"
        this.portOfArrivalInput = page.locator('select#portOfArrival');
        // "Location of Goods (if not in list above)" - the free-text fallback beside
        // the dropdown above. Rendered only on the IMMI arrived branch's arrival screen.
        this.portOfArrivalOthersInput = page.locator('input#portOfArrivalOthers');

        //"Enter place of loading place details" screen
        this.placeOfLoadingInput = page.locator("input#placeOfLoading");

        // "Place of acceptance - Are the goods being accepted at the same place as they're loaded?" screen
        this.isAcceptanceSameYesOption = page.locator("input#isAcceptanceSame-yesNoOptions-yes");
        this.isAcceptanceSameNoOption = page.locator("input#isAcceptanceSame-yesNoOptions-no");
        this.placeOfAcceptanceInput = page.locator("input#placeOfAcceptance");
        
        //"Enter place of unloading place details" screen
        this.placeOfUnloadingInput = page.locator("input#placeOfUnloading");

        // "Place of acceptance and delivery" screen
        this.isDeliverySameYesOption = page.locator("input#isDeliverySame-yesNoOptions-yes");
        this.isDeliverySameNoOption = page.locator("input#isDeliverySame-yesNoOptions-no");

        this.placeOfDeliveryInput = page.locator("input#placeOfDelivery");
    }

    async chooseTypeOfMovement(typeOfMovement: string): Promise<void> {
        await checkRadioByValue(this.page, 'typeOfMovement', typeOfMovement);
        await this.clickContinueButton();
    }

    async selectTypeOfPassiveTransport(typeOfPassiveTransport: string): Promise<void> {
        await selectDropdownValue(this.typeOfPassiveTransportDropdown, typeOfPassiveTransport);
    }

    async inputVehicleRegistrationNumber(vehicleRegistrationNumber?: string): Promise<void> {
        await this.vehicleRegistrationNumberInput.fill(vehicleRegistrationNumber ?? '');
    }

    /**
     * The standalone "Enter vehicle details" screen, which asks for the registration
     * AND the nationality together. ENS splits the two: it asks the nationality on the
     * IMO screen and the registration on its own, so this is a third screen rather
     * than a combination of the two above.
     */
    async enterVehicleDetails(vehicleRegistrationNumber: string, nationality: string): Promise<void> {
        await this.vehicleRegistrationNumberInput.fill(vehicleRegistrationNumber);
        await selectDropdownValue(this.nationalityOfMeanOfTransportInput, nationality);
        await this.clickContinueButton();
    }

    /** The unaccompanied twin of the screen above: a trailer instead of a vehicle. */
    async enterTrailerDetails(trailerRegistrationNumber: string, nationality: string): Promise<void> {
        await this.trailerRegistrationNumberInput.fill(trailerRegistrationNumber);
        await selectDropdownValue(this.nationalityOfMeanOfTransportInput, nationality);
        await this.clickContinueButton();
    }

    /** The ILP Air twin: a flight number instead of a registration. */
    async enterFlightDetails(iataFlightNumber: string, nationality: string): Promise<void> {
        await this.iataFlightNumberInput.fill(iataFlightNumber);
        await selectDropdownValue(this.nationalityOfMeanOfTransportInput, nationality);
        await this.clickContinueButton();
    }

    /** The ILP Maritime twin: an IMO number (exactly 7 digits) instead of a registration. */
    async enterVesselDetails(imoNumber: string, nationality: string): Promise<void> {
        await this.imoNumberInput.fill(imoNumber);
        await selectDropdownValue(this.nationalityOfMeanOfTransportInput, nationality);
        await this.clickContinueButton();
    }

    async inputTrailerRegistrationNumber(trailerRegistrationNumber?: string): Promise<void> {
        await this.trailerRegistrationNumberInput.fill(trailerRegistrationNumber ?? '');
    }

    async inputSealNumber(sealNumber?: string): Promise<void> {
        await this.sealNumberInput.fill(sealNumber ?? '');
    }

    async chooseYourRoleInThisMovement(role: string): Promise<void> {
        if (role.includes(ROLE_IN_MOVEMENT.CARRIER)) {
            await this.carrierResponsibleOption.check();
        } else if (role.includes(ROLE_IN_MOVEMENT.ON_BEHALF_OF_CARRIER)) {
            await this.onBehalfOfCarrierOption.check();
        }
    }

    async chooseHaulierInvolvement(haulierInvolvement: string): Promise<void> {
        if (haulierInvolvement.includes(SEPARATE_HAULIER.CARRIER_IS_HAULIER)) {
            await this.theSameAsHaulierOption.check();
        } else if (haulierInvolvement.includes(SEPARATE_HAULIER.SEPARATE_HAULIER)) {
            await this.differentFromHaulierOption.check();
        }
    }

    async inputPlaceOfLoading(placeOfLoading: string): Promise<void> {
        await this.placeOfLoadingInput.fill(placeOfLoading);
    }

    async inputPlaceOfUnloading(placeOfUnloading: string): Promise<void> {
        await this.placeOfUnloadingInput.fill(placeOfUnloading);
    }

    async selectPortOfArrival(portCode: string): Promise<void> {
        await selectDropdownValue(this.portOfArrivalInput, portCode);
    }

    /** Blank leaves the field as the app renders it, which is the usual case. */
    async inputPortOfArrivalOthers(locationOfGoods: string): Promise<void> {
        await this.portOfArrivalOthersInput.fill(locationOfGoods);
    }

    async inputArrivalDateTime(arrivalDateTime?: string): Promise<void> {
        const value = arrivalDateTime ?? generatePreLodgedArrivalDate();

        const [, month, day, hour, minute] = value.split(/[-T:]/);

        await this.arrivalDayInput.fill(day);
        await this.arrivalMonthInput.fill(month);
        await this.arrivalTimeHourInput.fill(hour);
        await this.arrivalTimeMinuteInput.fill(minute);
    }

    async inputImoAndNationalityOfMeanOfTransport(imoNumber: string, nationalityOfMeanOfTransport: string): Promise<void> {
        await this.imoNumberInput.fill(imoNumber);
        await selectDropdownValue(this.nationalityOfMeanOfTransportInput, nationalityOfMeanOfTransport);
    }

    async selectDeliverySameAsUnloading(): Promise<void> {
        await this.isDeliverySameYesOption.check();
        await this.clickContinueButton();
    }

    async selectDeliveryNotSameAsUnloading(): Promise<void> {
        await this.isDeliverySameNoOption.check();
        await this.clickContinueButton();
    }

    async selectAcceptanceSameAsloading(): Promise<void> {
        await this.isAcceptanceSameYesOption.check();
        await this.clickContinueButton();
    }

    async selectAcceptanceNotSameAsloading(): Promise<void> {
        await this.isAcceptanceSameNoOption.check();
        await this.clickContinueButton();
    }

    async selectTransportCharges(transportChargesKey: string): Promise<void> {
        await checkRadioByValue(this.page, 'transportCharges', transportChargesKey);
    }

    async inputCarrierEori(carrierEori: string): Promise<void> {
        await this.carrierEoriInput.fill(carrierEori);
    }

    async inputHaulierEori(haulierEori: string): Promise<void> {
        await this.haulierEoriInput.fill(haulierEori);
    }

    async inputPlaceOfDelivery(placeOfDelivery: string): Promise<void> {
        await this.placeOfDeliveryInput.fill(placeOfDelivery);
        await this.clickContinueButton();
    }

    async inputPlaceOfAcceptance(placeOfAcceptance: string): Promise<void> {
        await this.placeOfAcceptanceInput.fill(placeOfAcceptance);
        await this.clickContinueButton();
    }
}
