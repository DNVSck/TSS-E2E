import { ADDITIONAL_INFORMATION_CODE } from '../constant/additional-information-constant';
import { inwardProcessingAuthorisationNumber } from '../helper/authorisation-helper';
import { IMPORTER_IPO } from '../../config/environment';

/**
 * One "additional information" record — the shape behind the goods item's
 * "Additional information" tab. A tab holds a list of these, so callers pass an
 * array; the wizard is replayed once per element.
 */
export interface AdditionalInformationData {
    /** "Additional information code" — the accessible-autocomplete value (e.g. NIREM). */
    code: string;
    /** "Additional information description" — free text describing the code. */
    description: string;
}

const defaults: AdditionalInformationData = {
    code: ADDITIONAL_INFORMATION_CODE.NIREM,
    description: 'Additional information note',
};

export const additionalInformation = (): AdditionalInformationData => ({ ...defaults });

type InformationOverrides = Partial<Omit<AdditionalInformationData, 'code'>>;

const citedInformation = (fixed: AdditionalInformationData) =>
    (overrides?: InformationOverrides): AdditionalInformationData => ({ ...fixed, ...overrides });

export const information00100 = citedInformation({
    code: ADDITIONAL_INFORMATION_CODE.SIMPLIFIED_AUTHORISATION_00100,
    description: 'Simplified authorisation',
});

export const information00500 = citedInformation({
    code: ADDITIONAL_INFORMATION_CODE.SIMPLIFIED_AUTHORISATION_00500,
    description: 'IMPORTER',
});

export const information10200 = citedInformation({
    code: ADDITIONAL_INFORMATION_CODE.INWARD_PROCESSING_AUTHORISATION_10200,
    description: inwardProcessingAuthorisationNumber(IMPORTER_IPO),
});

export const informationABDIN = citedInformation({
    code: ADDITIONAL_INFORMATION_CODE.AUTHORISATION_BY_DECLARATION_ABDIN,
    description: 'Authorisation by Declaration',
});

export const informationABDOU = citedInformation({
    code: ADDITIONAL_INFORMATION_CODE.AUTHORISATION_BY_DECLARATION_ABDOU,
    description: '',
});

export const informationECONR = citedInformation({
    code: ADDITIONAL_INFORMATION_CODE.ECONR,
    description: 'Reg No. 1234567890',
});

export const informationGEN28 = citedInformation({
    code: ADDITIONAL_INFORMATION_CODE.GEN28,
    description: '28 days duration to be re exported on 30112021',
});

export const informationGEN30 = citedInformation({
    code: ADDITIONAL_INFORMATION_CODE.GEN30,
    description: 'The use to which the Temporary Admission goods will be put',
});

export const informationGEN31 = citedInformation({
    code: ADDITIONAL_INFORMATION_CODE.GEN31,
    description: 'Name and address of the non-Union owner, plus the type of ownership evidence held',
});

export const informationGEN33 = citedInformation({
    code: ADDITIONAL_INFORMATION_CODE.GEN33,
    description: 'Test Holder. 1 Main Street, Belfast BT1 1AA. Re-export date - 01/01/2027',
});

export const informationGEN45 = citedInformation({
    code: ADDITIONAL_INFORMATION_CODE.GEN45,
    description: '12345',
});

export const informationNIIMP = citedInformation({
    code: ADDITIONAL_INFORMATION_CODE.NIIMP,
    description: '',
});

export const informationNIREM = citedInformation({
    code: ADDITIONAL_INFORMATION_CODE.NIREM,
    description: '',
});

export const informationOSR42 = citedInformation({
    code: ADDITIONAL_INFORMATION_CODE.OSR42,
    description: 'French Clothing Co, 1 Rue de Vetements, Paris P12 345-FR',
});
