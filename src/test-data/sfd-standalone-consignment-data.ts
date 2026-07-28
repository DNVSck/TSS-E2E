import { INITIAL_FORM_DECLARATION } from '../constant/initial-form-declaration-constants';
import { StandaloneConsignmentData, standaloneConsignment } from './standalone-consignment-data';

/**
 * SFD (Simplified Declaration) standalone consignment: adds a vehicle-registration
 * screen after type-of-movement, and the arrival screen asks for a date/time.
 */
export const sfdStandaloneConsignment = (
    overrides?: Partial<StandaloneConsignmentData>
): StandaloneConsignmentData =>
    standaloneConsignment({
        standaloneDeclarationType: INITIAL_FORM_DECLARATION.STANDALONE_DECLARATION_TYPE.SIMPLIFIED_DECLARATION,
        ...overrides,
    });
