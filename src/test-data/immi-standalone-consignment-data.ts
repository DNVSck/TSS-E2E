import { INITIAL_FORM_DECLARATION } from '../constant/initial-form-declaration-constants';
import { StandaloneConsignmentData, standaloneConsignment } from './standalone-consignment-data';

/**
 * IMMI standalone consignment: no vehicle-registration screen, and the arrival
 * screen is a port select.
 */
export const immiStandaloneConsignment = (
    overrides?: Partial<StandaloneConsignmentData>
): StandaloneConsignmentData =>
    standaloneConsignment({
        standaloneDeclarationType: INITIAL_FORM_DECLARATION.STANDALONE_DECLARATION_TYPE.INTERNAL_MARKET_MOVEMENT_INFORMATION,
        ...overrides,
    });
