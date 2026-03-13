import { RegionCode } from '@prisma/client';

export class ExtractKeywordDto {
  title!: string;
  description?: string;
  region?: RegionCode;
  sourceMetadata?: {
    queryTerm?: string;
    source?: string;
  };
}
