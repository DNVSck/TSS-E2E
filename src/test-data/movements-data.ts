import { ROLE_IN_MOVEMENT } from '../constant/role-in-movement-constant';
import { SEPARATE_HAULIER } from '../constant/separate-haulier-constant';
import { PASSIVE_TRANSPORT_TYPE } from '../constant/passive-transport-type-constant';
import { TYPE_OF_MOVEMENT_OPTION_CODE } from '../constant/type-of-movement-code-constant';
import { TRANSPORT_CHARGES_OPTION_CODE } from '../constant/transport-charges-code-constant';
import { COUNTRY_CODE } from '../constant/country-code-dropdown-constant';
import { PORT_OF_ARRIVAL } from '../constant/port-of-arrival-constant';
import { generateValidArrivalDate } from '../helper/data-generate-helper';
import { CARRIER_EORI, HAULIER_EORI } from '../../config/environment';


/**
 * The registration the movement declares for its means of transport.
 *
 * Named rather than typed in place because a SECOND screen has to carry the same
 * value: the supplementary declaration raised from this movement asks for the vehicle
 * again, pre-populated with something else, and the two have to agree. See
 * SupplementaryDeclarationData.meansOfTransportRegistration.
 */
export const VEHICLE_REGISTRATION_NUMBER = 'AB12CDE';

/** The unaccompanied twin: a trailer instead of a vehicle. */
export const TRAILER_REGISTRATION_NUMBER = 'TR12LER';

export interface MovementData {
    typeOfMovement: string;
    roleInThisMovement: string;
    haulierSeparateThisMovement: string;
    imoNumber: string;
    vehicleRegistrationNumber: string;
    conveyanceReferenceNumber?: string;
    nationalityOfMeanOfTransport: string;
    sealNumber?: string;
    arrivalDateTime: string;
    portOfArrival: string;
    placeOfLoading: string;
    placeOfUnloading: string;
    isSamePlaceOfLoading: boolean;
    isSamePlaceOfUnloading: boolean;
    placeOfacceptance: string;
    placeOfDelivery: string;
    typeOfPassiveTransport: string;
    transportCharges: string;
    trailerRegistrationNumber?: string;
    carrierEori: string;
    haulierEori: string;
}

// `arrivalDateTime` is deliberately absent here: it must be generated per factory call,
// not frozen once at module import, or a long run reuses a stale (possibly past) date.
const defaults: Omit<MovementData, 'arrivalDateTime'> = {
    typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
    roleInThisMovement: ROLE_IN_MOVEMENT.ON_BEHALF_OF_CARRIER,
    haulierSeparateThisMovement: SEPARATE_HAULIER.CARRIER_IS_HAULIER,
    imoNumber: '9198941',
    vehicleRegistrationNumber: VEHICLE_REGISTRATION_NUMBER,
    conveyanceReferenceNumber: '',
    nationalityOfMeanOfTransport: COUNTRY_CODE.UNITED_KINGDOM,
    sealNumber: '',
    portOfArrival: PORT_OF_ARRIVAL.BELFAST_GVMS_PORT,
    placeOfLoading: 'London',
    placeOfUnloading: 'Belfast',
    isSamePlaceOfLoading: true,
    isSamePlaceOfUnloading: true,
    placeOfacceptance: '',
    placeOfDelivery: 'Belfast',
    typeOfPassiveTransport: PASSIVE_TRANSPORT_TYPE.BUS,
    transportCharges: TRANSPORT_CHARGES_OPTION_CODE.ACCOUNT_HOLDER_WITH_CARRIER,
    trailerRegistrationNumber: TRAILER_REGISTRATION_NUMBER,
    carrierEori: CARRIER_EORI,
    haulierEori: HAULIER_EORI,
};


export const movement = (overrides?: Partial<MovementData>): MovementData => ({
    ...defaults,
    arrivalDateTime: generateValidArrivalDate(),
    ...overrides,
});

