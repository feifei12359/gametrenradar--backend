import { Injectable } from '@nestjs/common';
import { RegionCode } from '@prisma/client';
import {
  KEYWORD_GENERIC_SINGLE_TOKENS,
  KEYWORD_REGION_DEFAULT,
  KEYWORD_STOP_WORDS,
} from './keyword-rules.constants';
import { KeywordExtractionService } from './keyword-extraction.service';
import { KeywordFilterService } from './keyword-filter.service';
import {
  CandidateKeyword,
  KeywordExtractInput,
  KeywordExtractionDebugResult,
} from './keyword.types';

@Injectable()
export class KeywordDebugService {
  private readonly stopWords = new Set(KEYWORD_STOP_WORDS);

  constructor(
    private readonly extractionService: KeywordExtractionService,
    private readonly filterService: KeywordFilterService,
  ) {}

  async debugExtract(input: KeywordExtractInput): Promise<KeywordExtractionDebugResult> {
    const region = input.region ?? KEYWORD_REGION_DEFAULT;
    const cleanedTitle = this.extractionService.cleanTitle(input.title);
    const candidates = this.extractionService.extractCandidateKeywordsFromTitle(input.title, {
      description: input.description,
      queryTerm: input.sourceMetadata?.queryTerm,
    });

    const seenKeys = new Set<string>();
    const accepted: KeywordExtractionDebugResult['candidates'] = [];
    const rejected: KeywordExtractionDebugResult['rejected'] = [];

    if (candidates.length === 0) {
      const fallbackReason = this.getFallbackReason(cleanedTitle);
      rejected.push({
        rawText: cleanedTitle || input.title,
        reason: fallbackReason,
      });
      return { cleanedTitle, candidates: accepted, rejected };
    }

    for (const candidate of candidates) {
      const filter = await this.filterService.filterKeyword(candidate, { region, seenKeys });
      if (filter.accepted) {
        accepted.push({
          ...candidate,
          filter,
        });
      } else {
        rejected.push({
          rawText: candidate.rawText,
          normalizedText: candidate.normalizedText,
          displayName: candidate.displayName,
          reason: filter.reason,
        });
      }
    }

    return {
      cleanedTitle,
      candidates: this.compactAccepted(accepted),
      rejected,
    };
  }

  private getFallbackReason(cleanedTitle: string) {
    if (!cleanedTitle.trim()) {
      return 'noise_pattern' as const;
    }

    const tokens = cleanedTitle
      .toLowerCase()
      .split(' ')
      .filter(Boolean);

    if (tokens.every((token) => this.stopWords.has(token))) {
      return 'stopword_only' as const;
    }

    if (
      tokens.every(
        (token) => this.stopWords.has(token) || KEYWORD_GENERIC_SINGLE_TOKENS.has(token),
      )
    ) {
      return 'generic_only' as const;
    }

    return 'noise_pattern' as const;
  }

  async batchDebugExtract(input: {
    titles: string[];
    region?: RegionCode;
    description?: string;
    sourceMetadata?: {
      queryTerm?: string;
      source?: string;
    };
  }) {
    const results = [];
    for (const title of input.titles) {
      results.push(
        await this.debugExtract({
          title,
          description: input.description,
          region: input.region,
          sourceMetadata: input.sourceMetadata,
        }),
      );
    }
    return results;
  }

  private compactAccepted(
    candidates: Array<CandidateKeyword & { filter: { accepted: boolean; reason: string; score: number } }>,
  ) {
    const seen = new Set<string>();
    return candidates.filter((candidate) => {
      const key = candidate.normalizedKey;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}
