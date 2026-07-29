import { COUNTRY_CODE } from '../constant/country-code-dropdown-constant';
import { ITEM_CURRENCY } from '../constant/item-currency-constant';
import { TYPE_OF_MOVEMENT_OPTION_CODE } from '../constant/type-of-movement-code-constant';
import { PORT_OF_ARRIVAL } from '../constant/port-of-arrival-constant';
import { REPRESENTATION_TYPE } from '../constant/representation-type-constant';
import { PreviousDocumentData } from './previous-document-data';
import { HolderOfAuthorisationData } from './holder-of-authorisation-data';

/**
 * The FFD standalone consignment (the app's "Standard Declaration").
 *
 * The widest of the three journeys: it asks for representation AND a vehicle AND an
 * arrival date/time. It also reaches screens neither IMMI nor SFD has (flight
 * details, inland mode of transport, intended declaration type and - only for
 * customs warehousing - the warehouse type). Those fields belong HERE as they are
 * built, which is why FFD has its own type rather than optional fields on a shared one.
 */
export interface FfdStandaloneConsignmentData {
    /**
     * "What type of representation?" - shown ONLY when the agent represents a trader.
     * Leave undefined for an importer self-login journey, where the screen never appears.
     */
    representationType?: string;

    /**
     * "Is this a pre-lodged or arrived movement?" - the first screen of the wizard.
     * It also decides the arrival screen: a pre-lodged movement is asked when the
     * goods will arrive, an arrived one is not (it already has).
     */
    isPreLodged: boolean;

    typeOfMovement: string;
    vehicleRegistration: string;
    portOfArrival: string;
    /** Left undefined so the flow generates a valid (within 14 days) date/time. */
    arrivalDateTime?: string;

    exporterEORI: string;
    exporterName: string;
    exporterStreetName: string;
    exporterStreetNumber: string;
    exporterCity: string;
    exporterPostCode: string;
    exporterCountryCode: string;

    traderReference: string;
    invoiceCurrency: string;

    /**
     * Consignment-overview tabs, each a list of records. Empty by default so a
     * journey that declares none is unaffected; a spec opts in with entries and the
     * overview flow replays the matching wizard once per element.
     */
    headerPreviousDocuments: PreviousDocumentData[];
    holdersOfAuthorisation: HolderOfAuthorisationData[];
}

const defaults: FfdStandaloneConsignmentData = {
    representationType: REPRESENTATION_TYPE.DIRECT,
    isPreLodged: true,

    typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
    vehicleRegistration: 'GB12ABC',
    portOfArrival: PORT_OF_ARRIVAL.BELFAST_PORT,

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
    invoiceCurrency: ITEM_CURRENCY.POUNDS_STERLING,

    headerPreviousDocuments: [],
    holdersOfAuthorisation: [],
};

/**
 * Pre-lodged is the default; an arrived movement is the same data with
 * `isPreLodged: false`, which also drops the arrival date/time screen.
 */
export const ffdStandaloneConsignment = (
    overrides?: Partial<FfdStandaloneConsignmentData>
): FfdStandaloneConsignmentData => ({
    ...defaults,
    ...overrides,
});
