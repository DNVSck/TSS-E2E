export const ADDITIONAL_RISK_STATUS = {
	NO_ADDITIONAL_RISK_STATUS: 'No additional risk status',
	NIPRO: 'NIPRO',
	NIQUO: 'NIQUO',
	NIREM: 'NIREM',

} as const;

export type AdditionalRiskStatusKey = keyof typeof ADDITIONAL_RISK_STATUS;
export type AdditionalRiskStatus =
(typeof ADDITIONAL_RISK_STATUS)[keyof typeof ADDITIONAL_RISK_STATUS];
