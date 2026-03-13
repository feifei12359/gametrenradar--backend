import { KeywordStage, RegionCode } from '@prisma/client';

export class DiscoveryQueryDto {
  region?: RegionCode | 'GLOBAL';
  window?: '24h' | '48h' | '72h' | '7d';
  stage?: KeywordStage;
}
