import { SetMetadata } from '@nestjs/common';

export const PRODUCTION_DISABLED_KEY = 'productionDisabled';
export const ProductionDisabled = () =>
  SetMetadata(PRODUCTION_DISABLED_KEY, true);
