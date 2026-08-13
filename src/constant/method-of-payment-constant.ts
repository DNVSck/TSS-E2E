export const METHOD_OF_PAYMENT = {
    CARD_PAYMENT_THROUGH_TSS: 'tss-dda',
    TRADERS_OWN_DDA: 'trader-own-dda',
    CUSTOMS_AGENTS_DDA: 'agent-dda',
    TRADERS_CDS_CASH_ACCOUNT: 'trader-cds-cash-account',
    AGENTS_CDS_CASH_ACCOUNT: 'agent-cds-cash-account',
    IMMEDIATE_PAYMENT_BY_ELECTRONIC_TRANSFER: 'electronic-transfer',
} as const;

export type MethodOfPaymentCode = (typeof METHOD_OF_PAYMENT)[keyof typeof METHOD_OF_PAYMENT];
