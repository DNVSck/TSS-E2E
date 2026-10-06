import {
    COMPANY_ADDRESS_FIELD, COMPANY_PROFILE_ACTION, CompanyProfileActionKey,
} from '../constant/company-profile-action-constant';
import { COUNTRY_CODE } from '../constant/country-code-dropdown-constant';
import { METHOD_OF_PAYMENT, MethodOfPaymentCode } from '../constant/method-of-payment-constant';
import { defermentAuthorisation } from '../helper/authorisation-helper';
import {
    generateRandomAddressLine, generateRandomBusinessEmail, generateRandomBusinessName, generateRandomCountryCode,
    generateRandomCity, generateRandomStreetNumber, generateRandomUkPhoneNumber, generateRandomUkPostcode,
    generateRandomUkVatNumber,
    generateRandomCseAuthorisationNumber, generateRandomSdpAuthorisationNumber, generateRandomEidrAuthorisationNumber,
    generateRandomDefermentAccountNumber, generateRandomXiGuaranteeReferenceNumber,
    pickRandomExcept,
} from '../helper/data-generate-helper';

export interface CompanyProfileInput {
    id: string;
    value: string;
    shownAsOptionText?: boolean;
    shownOnSameLine?: boolean;
}

export interface CompanyProfileFieldEdit {
    field: CompanyProfileActionKey;
    inputs: CompanyProfileInput[];
}

export interface CompanyProfileSection {
    name: string;
    edits: () => CompanyProfileFieldEdit[];
}

const singleInputEdit = (field: CompanyProfileActionKey, value: string): CompanyProfileFieldEdit => ({
    field,
    inputs: [{ id: COMPANY_PROFILE_ACTION[field], value }],
});

export const businessDetailsEdits = (): CompanyProfileFieldEdit[] => [
    singleInputEdit('BUSINESS_NAME', generateRandomBusinessName()),
    singleInputEdit('VAT_REGISTRATION_NUMBER', generateRandomUkVatNumber()),
];

export const authorisationsEdits = (): CompanyProfileFieldEdit[] => [
    singleInputEdit('CSE_AUTHORISATION_NUMBER', generateRandomCseAuthorisationNumber()),
    singleInputEdit('SIMPLIFIED_DECLARATIONS_PROCESS_NUMBER', generateRandomSdpAuthorisationNumber()),
    singleInputEdit('ENTRY_IN_DECLARANTS_RECORDS_NUMBER', generateRandomEidrAuthorisationNumber()),
];

export const dutyDefermentEdits = (): CompanyProfileFieldEdit[] => {
    const defermentAccount = generateRandomDefermentAccountNumber();
    return [
        singleInputEdit(
            'XI_DPO_AUTHORISATION_NUMBER',
            defermentAuthorisation(COUNTRY_CODE.NORTHERN_IRELAND, defermentAccount)
        ),
        singleInputEdit('XI_DEFERMENT_ACCOUNT_NUMBER', defermentAccount),
        singleInputEdit('XI_GUARANTEE_REFERENCE_NUMBER', generateRandomXiGuaranteeReferenceNumber()),
    ];
};

export const contactDetailsEdits = (): CompanyProfileFieldEdit[] => [
    singleInputEdit('BUSINESS_EMAIL', generateRandomBusinessEmail()),
    singleInputEdit('BUSINESS_PHONE', generateRandomUkPhoneNumber()),
    {
        field: 'ADDRESS',
        inputs: [
            { id: COMPANY_ADDRESS_FIELD.STREET_NUMBER, value: generateRandomStreetNumber() },
            { id: COMPANY_ADDRESS_FIELD.LINE_1, value: generateRandomAddressLine(), shownOnSameLine: true },
            { id: COMPANY_ADDRESS_FIELD.CITY, value: generateRandomCity() },
            { id: COMPANY_ADDRESS_FIELD.POST_CODE, value: generateRandomUkPostcode() },
            {
                id: COMPANY_ADDRESS_FIELD.COUNTRY,
                value: generateRandomCountryCode(COUNTRY_CODE.UNITED_KINGDOM, COUNTRY_CODE.NORTHERN_IRELAND),
            },
        ],
    },
];

export const COMPANY_PROFILE_SECTIONS: readonly CompanyProfileSection[] = [
    { name: 'Business Details', edits: businessDetailsEdits },
    { name: 'Contact Details', edits: contactDetailsEdits },
    { name: 'Authorisations', edits: authorisationsEdits },
    { name: 'Duty Deferment Account Details', edits: dutyDefermentEdits },
];

export const PROFILE_PAYMENT_METHODS: readonly MethodOfPaymentCode[] = [
    METHOD_OF_PAYMENT.CARD_PAYMENT_THROUGH_TSS,
    METHOD_OF_PAYMENT.TRADERS_OWN_DDA,
    METHOD_OF_PAYMENT.IMMEDIATE_PAYMENT_BY_ELECTRONIC_TRANSFER,
];

export const pickPreferredPaymentMethod = (current?: string): MethodOfPaymentCode =>
    pickRandomExcept(PROFILE_PAYMENT_METHODS, PROFILE_PAYMENT_METHODS.find(method => method === current));

export const preferredPaymentMethodEdits = (method: MethodOfPaymentCode): CompanyProfileFieldEdit[] => [{
    field: 'PREFERRED_METHOD_OF_PAYMENT',
    inputs: [{
        id: COMPANY_PROFILE_ACTION.PREFERRED_METHOD_OF_PAYMENT,
        value: method,
        shownAsOptionText: true,
    }],
}];
