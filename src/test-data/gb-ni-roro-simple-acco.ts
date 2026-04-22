import { ROUTE_DECLARATION } from '../constant/route-declaration-constants';
import {NEW_GOODS_MOVEMENT_DECLARATION} from '../constant/goods-movement-declaration-constants';
import {COUNTRY_CODE} from '../constant/country-code-dropdown-constant';
import { PORT_OF_ARRIVAL } from '../constant/port-of-arrival-constant';

export const GB_TO_NI_RORO_SIMPLE_ACCO = {
  route: {
    route: ROUTE_DECLARATION.ROUTE.GB_TO_NI,
    goodsMovementProcess: ROUTE_DECLARATION.GOODS_MOVEMENT_PROCESS.SIMPLIFIED_CUSTOMS_DECLARATION_PROCESS,
    process: ROUTE_DECLARATION.PROCESS.STANDARD_PROCESS,
    howToStart: ROUTE_DECLARATION.HOW_TO_START.CREATE_MANUALLY,
  },
  
  movement: {
    typeOfMovement: NEW_GOODS_MOVEMENT_DECLARATION.TYPE_OF_MOVEMENT.RORO_ACCOMPANIED,
    roleInThisMovement: NEW_GOODS_MOVEMENT_DECLARATION.ROLE_IN_THIS_MOVEMENT.CARRIER,
    haulierSeparateThisMovement: NEW_GOODS_MOVEMENT_DECLARATION.SEPARATE_HAULIER_THIS_MOVEMENT.CARRIER_IS_HAULIER,
    imoNumber: '1234567',
    vehicleRegistrationNumber: 'AB12CDE',
    conveyanceReferenceNumber: '',
    nationalityOfMeanOfTransport: COUNTRY_CODE.UNITED_KINGDOM,
    sealNumer: '',
    arrivalDateTime: '',
    portOfArrival: PORT_OF_ARRIVAL.BELFAST_AIRPORT,
    placeOfLoading: 'London',
    placeOfUnloading: 'Belfast',
    isSamePlaceOfLoading: true,
    isSamePlaceOfUnloading: true,
    placeOfacceptance: '',
    placeOfDelivery: '',
  },

};