import { ADDITIONAL_INFORMATION_CODE } from '../constant/additional-information-constant';
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

export const additionalInformation = (overrides?: Partial<AdditionalInformationData>): AdditionalInformationData => ({
    ...defaults,
    ...overrides,
});
