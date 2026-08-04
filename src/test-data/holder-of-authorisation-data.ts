import { AUTHORISATION_TYPE_CODE } from '../constant/authorisation-type-code-constant';
import { IMPORTER_EORI } from '../../config/environment';

/**
 * One "holder of authorisation" record — the shape behind the consignment's
 * "Holder of authorisation" tab. The tab holds a list of these, so callers pass
 * an array; the wizard is replayed once per element.
 */
export interface HolderOfAuthorisationData {
    /** "Type code" — an opaque authorisation code. See AUTHORISATION_TYPE_CODE. */
    typeCode: string;
    /** "Role ID" — the GB or XI EORI number of the authorised party. */
    roleId: string;
}

const defaults: HolderOfAuthorisationData = {
    typeCode: AUTHORISATION_TYPE_CODE.SIMPLIFIED_DECLARATION_PROCEDURE,
    // The authorisation is held by the importer being declared for, so its EORI is
    // environment data - see IMPORTER_EORI.
    roleId: IMPORTER_EORI,
};

export const holderOfAuthorisation = (overrides?: Partial<HolderOfAuthorisationData>): HolderOfAuthorisationData => ({
    ...defaults,
    ...overrides,
});
