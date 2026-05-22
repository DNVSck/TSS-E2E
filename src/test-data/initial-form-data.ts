import { ROUTE_DECLARATION } from '../constant/route-declaration-constants';

export interface InitialFormData {
  route: string;
  goodsMovementProcess: string;
  process: string;
  howToStart: string;
}

const defaults: InitialFormData = {
  route: ROUTE_DECLARATION.ROUTE.GB_TO_NI,
  goodsMovementProcess: ROUTE_DECLARATION.GOODS_MOVEMENT_PROCESS.SIMPLIFIED_CUSTOMS_DECLARATION_PROCESS,
  process: ROUTE_DECLARATION.PROCESS.STANDARD_PROCESS,
  howToStart: ROUTE_DECLARATION.HOW_TO_START.CREATE_MANUALLY,
};

export const route = (overrides?: Partial<InitialFormData>): InitialFormData => ({
  ...defaults,
  ...overrides,
});