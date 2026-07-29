import { COUNTRY_CODE } from '../constant/country-code-dropdown-constant';
import { ITEM_CURRENCY } from '../constant/item-currency-constant';
import { TYPE_OF_MOVEMENT_OPTION_CODE } from '../constant/type-of-movement-code-constant';
import { PORT_OF_ARRIVAL } from '../constant/port-of-arrival-constant';
import { PreviousDocumentData } from './previous-document-data';
import { HolderOfAuthorisationData } from './holder-of-authorisation-data';

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
    invoiceCurrency: string;

    /**
     * Consignment-overview tabs, each a list of records. Empty by default so a
     * journey that declares none is unaffected; a spec opts in with entries and the
     * overview flow replays the matching wizard once per element.
     */
    headerPreviousDocuments: PreviousDocumentData[];
    holdersOfAuthorisation: HolderOfAuthorisationData[];
}

const defaults: SfdStandaloneConsignmentData = {
    isPreLodged: true,

    typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
    vehicleRegistration: 'GB12ABC',
    portOfArrival: PORT_OF_ARRIVAL.BELFAST_PORT,
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
    invoiceCurrency: ITEM_CURRENCY.POUNDS_STERLING,

    headerPreviousDocuments: [],
    holdersOfAuthorisation: [],
};

/**
 * Pre-lodged is the default; an arrived movement is the same data with
 * `isPreLodged: false`, which also drops the arrival date/time screen.
 */
export const sfdStandaloneConsignment = (
    overrides?: Partial<SfdStandaloneConsignmentData>
): SfdStandaloneConsignmentData => ({
    ...defaults,
    ...overrides,
});
