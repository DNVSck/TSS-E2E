import { COUNTRY_CODE } from '../constant/country-code-dropdown-constant';
import { ITEM_CURRENCY } from '../constant/item-currency-constant';
import { TYPE_OF_MOVEMENT_OPTION_CODE } from '../constant/type-of-movement-code-constant';
import { PORT_OF_ARRIVAL } from '../constant/port-of-arrival-constant';
import { PreviousDocumentData } from './previous-document-data';
import { HolderOfAuthorisationData } from './holder-of-authorisation-data';
import { CONTAINER_SIZE } from '../constant/container-size-constant';
import { CONTAINER_SUPPLIER_TYPE } from '../constant/container-supplier-type-constant';
import { CONTAINER_PACKED_STATUS } from '../constant/container-packed-status-constant';
import { CONSIGNMENT_GOODS_DOMESTIC_STATUS } from '../constant/consignment-goods-domestic-status-constant';
import {
    generateRandomTransportDocumentNumber, generateRandomContainerIdentifierNumber,
    generatePreLodgedArrivalDate, generatePastArrivalDate,
} from '../helper/data-generate-helper';

/**
 * The SFD standalone consignment (the app's "Simplified Declaration").
 *
 * Only the fields the SFD wizard asks for. SFD never shows the "Representation
 * information" screen, so there is no representationType here - unlike IMMI and FFD.
 * It does have the vehicle screen, and its arrival screen asks for a date/time when
 * the movement is pre-lodged.
 */
export interface SfdStandaloneConsignmentData {
    /**
     * "Is this a pre-lodged or arrived movement?" - the first screen of the wizard, and
     * the answer the arrival date below has to agree with.
     */
    isPreLodged: boolean;

    typeOfMovement: string;
    vehicleRegistration: string;
    portOfArrival: string;
    /**
     * "When and where will the goods arrive?" - day, month, hour and minute, asked on
     * BOTH branches. The VALUE is what differs: a pre-lodged movement has not arrived so
     * its time is two minutes ahead, an arrived one half an hour back (see the generators).
     *
     * Left undefined so the factory derives whichever the branch needs. Set it only to
     * pin a specific moment, and then it is the spec's job to keep it on the right side
     * of now.
     */
    arrivalDateTime?: string;

    /**
     * "Does this consignment contain controlled goods?" - its own screen, asked right
     * after the port of arrival. Defaults to No: answering Yes opens further questions
     * that are not modelled yet.
     */
    isControlledGoods: boolean;

    exporterEORI: string;
    exporterName: string;
    exporterStreetName: string;
    exporterStreetNumber: string;
    exporterCity: string;
    exporterPostCode: string;
    exporterCountryCode: string;

    traderReference: string;

    isTransportingInContainers: boolean;
    isSameContainer: boolean;

    /** `container-information~container-identification-number` asks all four at once. */
    containerIdentifierNumber: string;
    containerSize: string;
    containerPackedStatus: string;
    containerSupplierType: string;

    invoiceCurrency: string;

    /**
     * Consignment-overview tabs, each a list of records. Empty by default so a
     * journey that declares none is unaffected; a spec opts in with entries and the
     * overview flow replays the matching wizard once per element.
     */
    headerPreviousDocuments: PreviousDocumentData[];
    holdersOfAuthorisation: HolderOfAuthorisationData[];

    transportDocumentNumber: string;

    goodsDomesticStatus: string;
}

const defaults: SfdStandaloneConsignmentData = {
    isPreLodged: true,

    typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
    vehicleRegistration: 'GB12ABC',
    portOfArrival: PORT_OF_ARRIVAL.BELFAST_GVMS_PORT,
    isControlledGoods: false,

    // Exporter profile. A blank/new EORI makes the app ask for the address, which
    // PartyBlock then fills.
    exporterEORI: '',
    exporterName: 'GB Test Exporter Ltd',
    exporterStreetName: 'High Street',
    exporterStreetNumber: '10',
    exporterCity: 'London',
    exporterPostCode: 'EC1A 1BB',
    exporterCountryCode: COUNTRY_CODE.UNITED_KINGDOM,

    traderReference: 'STD-AUTO-001',
    isTransportingInContainers: false,
    isSameContainer: false,

    // Container identification. Only reached when BOTH answers above are Yes; the
    // identifier itself is generated per consignment by the factory below.
    containerIdentifierNumber: '',
    containerSize: CONTAINER_SIZE.TRAILER,
    containerPackedStatus: CONTAINER_PACKED_STATUS.NOT_EMPTY,
    containerSupplierType: CONTAINER_SUPPLIER_TYPE.SHIPPER_SUPPLIED,

    invoiceCurrency: ITEM_CURRENCY.POUNDS_STERLING,

    headerPreviousDocuments: [],
    holdersOfAuthorisation: [],

    transportDocumentNumber: '',
    goodsDomesticStatus: CONSIGNMENT_GOODS_DOMESTIC_STATUS.NIDOM,
};

/**
 * Pre-lodged is the default; an arrived movement is the same data with
 * `isPreLodged: false`, so the two variants stay one factory.
 */
export const sfdStandaloneConsignment = (
    overrides?: Partial<SfdStandaloneConsignmentData>
): SfdStandaloneConsignmentData => {
    const data = {
        ...defaults,
        // Generated per call, not once in `defaults`: two consignments declared in the
        // same worker would otherwise carry the same references.
        transportDocumentNumber: generateRandomTransportDocumentNumber(),
        containerIdentifierNumber: generateRandomContainerIdentifierNumber(),
        ...overrides,
    };

    return {
        ...data,
        // Derived AFTER the overrides, because it depends on isPreLodged and a spec may
        // have just changed it. Deriving earlier would leave the movement holding the
        // other branch's arrival time - the two screens of one declaration disagreeing,
        // which is exactly the mistake this branch exists to avoid.
        arrivalDateTime: data.arrivalDateTime
            ?? (data.isPreLodged ? generatePreLodgedArrivalDate() : generatePastArrivalDate()),
    };
};
