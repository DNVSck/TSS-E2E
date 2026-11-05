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

type HolderOverrides = Partial<Omit<HolderOfAuthorisationData, 'typeCode'>>;

const citedHolder = (fixed: HolderOfAuthorisationData) =>
    (overrides?: HolderOverrides): HolderOfAuthorisationData => ({ ...fixed, ...overrides });

export const holderCGU = citedHolder({
    typeCode: AUTHORISATION_TYPE_CODE.CUSTOMS_COMPREHENSIVE_GUARANTEE_CGU,
    roleId: IMPORTER_EORI,
});

export const holderCWP = citedHolder({
    typeCode: AUTHORISATION_TYPE_CODE.PRIVATE_CUSTOMS_WAREHOUSE_CWP,
    roleId: IMPORTER_EORI,
});

export const holderDPO = citedHolder({
    typeCode: AUTHORISATION_TYPE_CODE.DEFERMENT_OF_PAYMENT_DPO,
    roleId: IMPORTER_EORI,
});

export const holderEXW = citedHolder({
    typeCode: AUTHORISATION_TYPE_CODE.EXCISE_WAREHOUSE_EXW,
    roleId: IMPORTER_EORI,
});

export const holderIPO = citedHolder({
    typeCode: AUTHORISATION_TYPE_CODE.INWARD_PROCESSING_IPO,
    roleId: IMPORTER_EORI,
});

export const holderOPO = citedHolder({
    typeCode: AUTHORISATION_TYPE_CODE.OUTWARD_PROCESSING_OPO,
    roleId: IMPORTER_EORI,
});

export const holderSDE = citedHolder({
    typeCode: AUTHORISATION_TYPE_CODE.SIMPLIFIED_DECLARATION_PROCEDURE_SDE,
    roleId: IMPORTER_EORI,
});

export const holderTEA = citedHolder({
    typeCode: AUTHORISATION_TYPE_CODE.TEMPORARY_ADMISSION_TEA,
    roleId: IMPORTER_EORI,
});

export const holderUKIM = citedHolder({
    typeCode: AUTHORISATION_TYPE_CODE.UK_INTERNAL_MARKET_SCHEME_UKIM,
    roleId: IMPORTER_EORI,
});
