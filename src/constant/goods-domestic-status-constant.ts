export const GOODS_DOMESTIC_STATUS = {
	NIDOM: 'NIDOM',
	NIIMP: 'NIIMP'

} as const;

export type GoodsDomesticStatusKey = keyof typeof GOODS_DOMESTIC_STATUS;
export type GoodsDomesticStatus =
(typeof GOODS_DOMESTIC_STATUS)[keyof typeof GOODS_DOMESTIC_STATUS];
