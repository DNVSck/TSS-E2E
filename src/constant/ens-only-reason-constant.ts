
export const ENS_ONLY_REASON = {
    /** I/my customer is submitting a separate standalone IMMI, Standard or Simplified Declaration using the TSS service. */
    STANDALONE_DECLARATION_IN_TSS: 'R1',

    /** I/my customer is submitting an IMMI, Standard or Simplified Declaration not using the TSS service. */
    DECLARATION_OUTSIDE_TSS: 'R2',

    /** I/my customers goods are moving by EIDR or UKIMS-EIDR with their own authorisation. */
    EIDR_WITH_OWN_AUTHORISATION: 'R3',

    /** I am transporting an empty vehicle under a contract of carriage, which requires no customs declaration. */
    EMPTY_VEHICLE: 'R4',

    /** I/my customers goods are moving by Transit or Transshipment and do not require a declaration. */
    TRANSIT_OR_TRANSSHIPMENT: 'R5',

    /** I/my customers goods are entering Temporary Storage; the customs declaration will not use the TSS service. */
    TEMPORARY_STORAGE_OUTSIDE_TSS: 'R6',

    /** I/my customers goods will be declared by 'oral' or 'by conduct' and do not require a written declaration. */
    ORAL_OR_BY_CONDUCT: 'R7',
} as const;

export type EnsOnlyReasonKey = keyof typeof ENS_ONLY_REASON;
export type EnsOnlyReasonCode = (typeof ENS_ONLY_REASON)[keyof typeof ENS_ONLY_REASON];
