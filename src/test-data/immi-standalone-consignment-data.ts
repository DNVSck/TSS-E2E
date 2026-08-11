import { COUNTRY_CODE } from '../constant/country-code-dropdown-constant';
import { ITEM_CURRENCY } from '../constant/item-currency-constant';
import { TYPE_OF_MOVEMENT_OPTION_CODE } from '../constant/type-of-movement-code-constant';
import { PORT_OF_ARRIVAL } from '../constant/port-of-arrival-constant';
import { REPRESENTATION_TYPE } from '../constant/representation-type-constant';
import { PreviousDocumentData, previousDocument } from './previous-document-data';
import { HolderOfAuthorisationData } from './holder-of-authorisation-data';

/**
 * The IMMI standalone consignment ("Internal Market Movement Information").
 *
 * Only the fields the IMMI wizard actually asks for. It has NO vehicle screen, and
 * its arrival screen is a port select only - it never asks for an arrival date/time,
 * whether the movement is pre-lodged or arrived. So neither vehicleRegistration nor
 * arrivalDateTime exists here; a spec cannot set a field this journey ignores.
 */
export interface ImmiStandaloneConsignmentData {
    /**
     * "What type of representation?" - shown ONLY when the agent represents a trader.
     * Leave undefined for an importer self-login journey, where the screen never
     * appears (see REPRESENTATION_TYPE for the values).
     */
    representationType?: string;

    /**
     * "Is this a pre-lodged or arrived movement?" - the first screen of the wizard.
     * Unlike SFD/FFD it decides nothing further: IMMI asks no arrival date/time either way.
     */
    isPreLodged: boolean;

    typeOfMovement: string;
    portOfArrival: string;
    arrivalDateTime?: string

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
     * Consignment-overview tabs, each a list of records - the overview flow replays
     * the matching wizard once per element. headerPreviousDocuments carries the ENS
     * declaration this consignment moves under, which every IMMI standalone journey
     * needs, so it has a default; a spec that wants none passes an empty array.
     */
    headerPreviousDocuments: PreviousDocumentData[];
    holdersOfAuthorisation: HolderOfAuthorisationData[];
}

const defaults: ImmiStandaloneConsignmentData = {
    representationType: REPRESENTATION_TYPE.DIRECT,
    isPreLodged: true,

    typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
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

    headerPreviousDocuments: [
        previousDocument({ documentReference: '4GBXI553202734852-20240501' }),
    ],
    holdersOfAuthorisation: [],
};

/**
 * Pre-lodged is the default; an arrived movement is the same data with
 * `isPreLodged: false`, so the two variants stay one factory.
 */
export const immiStandaloneConsignment = (
    overrides?: Partial<ImmiStandaloneConsignmentData>
): ImmiStandaloneConsignmentData => ({
    ...defaults,
    ...overrides,
});
