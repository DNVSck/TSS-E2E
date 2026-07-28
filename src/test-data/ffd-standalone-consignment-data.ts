import { INITIAL_FORM_DECLARATION } from '../constant/initial-form-declaration-constants';
import { StandaloneConsignmentData, standaloneConsignment } from './standalone-consignment-data';

/**
 * FFD standalone consignment - the app labels it "Standard Declaration". Adds a
 * vehicle-registration screen after type-of-movement, and the arrival screen asks
 * for a date/time.
 */
export const ffdStandaloneConsignment = (
    overrides?: Partial<StandaloneConsignmentData>
): StandaloneConsignmentData =>
    standaloneConsignment({
        standaloneDeclarationType: INITIAL_FORM_DECLARATION.STANDALONE_DECLARATION_TYPE.STANDARD_DECLARATION,
        ...overrides,
    });
