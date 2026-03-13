import { RegionCode } from '@prisma/client';

export class BatchExtractKeywordDto {
  titles!: string[];
  description?: string;
  region?: RegionCode;
  sourceMetadata?: {
    queryTerm?: string;
    source?: string;
  };
}
