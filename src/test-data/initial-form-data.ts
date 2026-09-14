import { INITIAL_FORM_DECLARATION } from '../constant/initial-form-declaration-constants';
import { IMPORTER_EORI } from '../../config/environment';

export interface InitialFormData {
  directionOfDeclaration: string;
  typeOfSubmission: string;
  /** Only applies when typeOfSubmission is ENS. */
  typeOfEnsSubmission?: string;
  /** Only applies when typeOfSubmission is STANDALONE. */
  standaloneDeclarationType?: string;
  declaringForEori: string;
}

const defaults: InitialFormData = {
  directionOfDeclaration: INITIAL_FORM_DECLARATION.DIRECTION_OF_DECLARATION.GB_TO_NI,
  typeOfSubmission: INITIAL_FORM_DECLARATION.TYPE_OF_SUBMISSION.ENS,
  typeOfEnsSubmission: INITIAL_FORM_DECLARATION.TYPE_OF_ENS_SUBMISSION.ENS_CUSTOM_OR_ENS_ONLY,
  declaringForEori: IMPORTER_EORI,
};

export const initialFormData = (overrides?: Partial<InitialFormData>): InitialFormData => ({
  ...defaults,
  ...overrides,
});