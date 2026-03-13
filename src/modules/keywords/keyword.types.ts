import { RegionCode } from '@prisma/client';

export type CandidateKeyword = {
  rawText: string;
  normalizedText: string;
  displayName: string;
  normalizedKey: string;
  tokenCount: number;
  isGeneric: boolean;
  genericReason?: string;
  confidence: number;
};

export type KeywordFilterReason =
  | 'ok'
  | 'generic_only'
  | 'too_short'
  | 'too_long'
  | 'stopword_only'
  | 'legacy_keyword'
  | 'noise_pattern'
  | 'duplicate';

export type KeywordFilterResult = {
  accepted: boolean;
  reason: KeywordFilterReason;
  score: number;
};

export type KeywordExtractInput = {
  title: string;
  description?: string;
  region?: RegionCode;
  sourceMetadata?: {
    queryTerm?: string;
    source?: string;
  };
};

export type KeywordExtractionDebugResult = {
  cleanedTitle: string;
  candidates: Array<
    CandidateKeyword & {
      filter: KeywordFilterResult;
    }
  >;
  rejected: Array<{
    rawText: string;
    normalizedText?: string;
    displayName?: string;
    reason: KeywordFilterReason;
  }>;
};
