import { PartyAddress } from '../page-object/components/party-block';
import { COUNTRY_CODE } from '../constant/country-code-dropdown-constant';
import { ITEM_CURRENCY } from '../constant/item-currency-constant';
import { TYPE_OF_MOVEMENT_OPTION_CODE } from '../constant/type-of-movement-code-constant';
import { PORT_OF_ARRIVAL } from '../constant/port-of-arrival-constant';
import { REPRESENTATION_TYPE } from '../constant/representation-type-constant';
import { PreviousDocumentData } from './previous-document-data';
import { HolderOfAuthorisationData } from './holder-of-authorisation-data';

/**
 * One shape for the three standalone consignment journeys (IMMI / SFD / FFD). They
 * share almost everything; the journey is selected by `standaloneDeclarationType`
 * plus the per-journey factories below (immi/sfd/ffd), not by three types.
 *
 * Which screens each journey shows (a vehicle screen? a port select vs a date/time
 * arrival?) is DERIVED from the declaration type in the flow (see
 * STANDALONE_STRUCTURE), not stored here - it is a fact about the journey, not
 * something a test inputs. Mirrors how the ENS flow derives its goods-journey context.
 */
export interface StandaloneConsignmentData {
    standaloneDeclarationType: string;

    /**
     * "What type of representation?" - shown ONLY when the agent represents a trader.
     * Leave undefined for an importer self-login journey, where the screen never
     * appears (see REPRESENTATION_TYPE for the values).
     */
    representationType?: string;

    /**
     * "Is this a pre-lodged or arrived movement?" - the first screen of every
     * standalone wizard. It also decides the arrival screen: a pre-lodged movement is
     * asked when the goods will arrive, an arrived one is not (it already has).
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

// The per-journey factories set standaloneDeclarationType; everything else defaults here.
const defaults: StandaloneConsignmentData = {
    standaloneDeclarationType: '',

    representationType: REPRESENTATION_TYPE.DIRECT,

    isPreLodged: true,

    typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
    vehicleRegistration: 'GB12ABC',
    portOfArrival: PORT_OF_ARRIVAL.BELFAST_PORT,

    // Exporter profile. A blank/new EORI makes the app ask for the address, which
    // PartyBlock then fills; the address uses the same GB shape as the ENS exporter.
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

/** Base factory - callers use the per-journey factories, not this directly. */
export const standaloneConsignment = (overrides?: Partial<StandaloneConsignmentData>): StandaloneConsignmentData => ({
    ...defaults,
    ...overrides,
});

/** Map the flat exporter fields to a PartyAddress for the exporter PartyBlock. */
export const exporterAddress = (i: StandaloneConsignmentData): PartyAddress => ({
    name: i.exporterName,
    streetName: i.exporterStreetName,
    streetNumber: i.exporterStreetNumber,
    city: i.exporterCity,
    postCode: i.exporterPostCode,
    country: i.exporterCountryCode,
});
