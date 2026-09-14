import { MovementData } from '../../movements-data';
import { DateTimeUtil } from '../../../core/util/date-time-util';
import { orNull, yesNoUpper } from '../../../helper/api-payload-helper';
import { TYPE_OF_MOVEMENT_OPTION_CODE } from '../../../constant/type-of-movement-code-constant';

export type HeaderPayload = {
    declaration_number: string | null;
    movement_type: string;
    type_of_passive_transport: string | null;
    identity_no_of_transport: string;
    nationality_of_transport: string;
    conveyance_ref: string | null;
    arrival_date_time: string;
    arrival_port: string;
    place_of_loading: string;
    place_of_acceptance_same_as_loading: string;
    place_of_acceptance: string | null;
    place_of_unloading: string;
    place_of_delivery_same_as_unloading: string;
    place_of_delivery: string | null;
    seal_number: string | null;
    transport_charges: string;
    carrier_eori: string;
    carrier_name: string | null;
    carrier_street_number: string | null;
    carrier_city: string | null;
    carrier_postcode: string | null;
    carrier_country: string | null;
    haulier_eori: string | null;
};

function identityOfTransport(movement: MovementData): string {
    const vessel = `IMO${movement.imoNumber}`;

    if (movement.typeOfMovement === TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED) {
        return `${vessel}#${movement.vehicleRegistrationNumber}`;
    }

    if (movement.typeOfMovement === TYPE_OF_MOVEMENT_OPTION_CODE.RORO_UNACCOMPANIED) {
        if (!movement.trailerRegistrationNumber) {
            throw new Error(
                `An unaccompanied movement must declare a trailerRegistrationNumber - the `
                + `Trader API carries it in identity_no_of_transport, and a GMR raised on a `
                + `movement without one is refused.`
            );
        }
        return `${vessel}#${movement.trailerRegistrationNumber}`;
    }

    return vessel;
}

export function headerPayload(
    movement: MovementData,
    overrides: Partial<HeaderPayload> = {}
): HeaderPayload {
    return {
        declaration_number: null,
        movement_type: movement.typeOfMovement,
        type_of_passive_transport: null,
        identity_no_of_transport: identityOfTransport(movement),
        nationality_of_transport: movement.nationalityOfMeanOfTransport,
        conveyance_ref: orNull(movement.conveyanceReferenceNumber),
        arrival_date_time: DateTimeUtil.toUkDateTime(movement.arrivalDateTime),
        arrival_port: movement.portOfArrival,
        place_of_loading: movement.placeOfLoading,
        place_of_acceptance_same_as_loading: yesNoUpper(movement.isSamePlaceOfLoading),
        place_of_acceptance: orNull(movement.placeOfacceptance),
        place_of_unloading: movement.placeOfUnloading,
        place_of_delivery_same_as_unloading: yesNoUpper(movement.isSamePlaceOfUnloading),
        place_of_delivery: orNull(movement.placeOfDelivery),
        seal_number: orNull(movement.sealNumber),
        transport_charges: movement.transportCharges,
        carrier_eori: movement.carrierEori,
        carrier_name: null,
        carrier_street_number: null,
        carrier_city: null,
        carrier_postcode: null,
        carrier_country: null,
        haulier_eori: null,
        ...overrides,
    };
}
