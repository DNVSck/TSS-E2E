import { NEW_GOODS_MOVEMENT_DECLARATION, TYPE_OF_MOVEMENT_OPTION_CODE, TRANSPORT_CHARGES_OPTION_CODE } from '../constant/goods-movement-declaration-constants';
import { COUNTRY_CODE } from '../constant/country-code-dropdown-constant';
import { PortOfArrivalCode, PORT_OF_ARRIVAL } from '../constant/port-of-arrival-constant';
import { DateTimeUtil } from '../core/util/date-time-util';

export interface MovementData {
    typeOfMovement: string;
    roleInThisMovement: string;
    haulierSeparateThisMovement: string;
    imoNumber: string;
    vehicleRegistrationNumber?: string;
    conveyanceReferenceNumber: string;
    nationalityOfMeanOfTransport: string;
    sealNumber: string;
    arrivalDateTime: string;
    portOfArrival: PortOfArrivalCode;
    placeOfLoading: string;
    placeOfUnloading: string;
    isSamePlaceOfLoading: boolean;
    isSamePlaceOfUnloading: boolean;
    placeOfacceptance: string;
    placeOfDelivery: string;
    typeOfPassiveTransport: string;
    transportCharges: string;
    trailerRegistrationNumber?: string;
}

const defaults: MovementData = {
    typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
    roleInThisMovement: NEW_GOODS_MOVEMENT_DECLARATION.ROLE_IN_THIS_MOVEMENT.CARRIER,
    haulierSeparateThisMovement: NEW_GOODS_MOVEMENT_DECLARATION.SEPARATE_HAULIER_THIS_MOVEMENT.CARRIER_IS_HAULIER,
    imoNumber: '1234567',
    vehicleRegistrationNumber: 'AB12CDE',
    conveyanceReferenceNumber: '',
    nationalityOfMeanOfTransport: COUNTRY_CODE.UNITED_KINGDOM,
    sealNumber: '',
    arrivalDateTime: DateTimeUtil.generateValidArrivalDate(),
    portOfArrival: PORT_OF_ARRIVAL.BELFAST_AIRPORT,
    placeOfLoading: 'London',
    placeOfUnloading: 'Belfast',
    isSamePlaceOfLoading: true,
    isSamePlaceOfUnloading: true,
    placeOfacceptance: '',
    placeOfDelivery: '',
    typeOfPassiveTransport: NEW_GOODS_MOVEMENT_DECLARATION.TYPE_OF_PASSIVE_TRANSPORT.TRUCK,
    transportCharges: TRANSPORT_CHARGES_OPTION_CODE.PAYMENT_IN_CASH,
    trailerRegistrationNumber: 'TR12LER',
};


export const movement = (overrides?: Partial<MovementData>): MovementData => ({
    ...defaults,
    ...overrides,
});

