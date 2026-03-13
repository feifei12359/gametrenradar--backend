import { Injectable } from '@nestjs/common';
import { RegionCode } from '@prisma/client';
import { KeywordRepository } from './keyword.repository';
import {
  KEYWORD_GENERIC_SINGLE_TOKENS,
  KEYWORD_NOISE_PATTERNS,
  KEYWORD_REGION_DEFAULT,
  KEYWORD_STOP_WORDS,
} from './keyword-rules.constants';
import { CandidateKeyword, KeywordFilterResult } from './keyword.types';

@Injectable()
export class KeywordFilterService {
  private readonly stopWords = new Set(KEYWORD_STOP_WORDS);

  constructor(private readonly keywordRepository: KeywordRepository) {}

  async filterKeyword(
    candidate: CandidateKeyword,
    options?: {
      region?: RegionCode;
      seenKeys?: Set<string>;
    },
  ): Promise<KeywordFilterResult> {
    const region = options?.region ?? KEYWORD_REGION_DEFAULT;
    const seenKeys = options?.seenKeys;

    if (seenKeys?.has(candidate.normalizedKey)) {
      return { accepted: false, reason: 'duplicate', score: 0 };
    }

    if (candidate.tokenCount < 2) {
      return {
        accepted: false,
        reason: candidate.isGeneric ? 'generic_only' : 'too_short',
        score: candidate.confidence,
      };
    }

    if (candidate.tokenCount > 5) {
      return { accepted: false, reason: 'too_long', score: candidate.confidence };
    }

    if (this.matchesNoisePattern(candidate.normalizedText)) {
      return { accepted: false, reason: 'noise_pattern', score: 0 };
    }

    const tokens = candidate.normalizedText.split(' ').filter(Boolean);
    if (tokens.length === 0 || tokens.every((token) => this.stopWords.has(token))) {
      return { accepted: false, reason: 'stopword_only', score: 0 };
    }

    if (
      candidate.isGeneric ||
      tokens.every((token) => KEYWORD_GENERIC_SINGLE_TOKENS.has(token))
    ) {
      return { accepted: false, reason: 'generic_only', score: Math.max(0, candidate.confidence - 30) };
    }

    const isLegacy = await this.isLegacyKeyword(candidate.displayName, region);
    if (isLegacy) {
      return {
        accepted: false,
        reason: 'legacy_keyword',
        score: Math.max(0, candidate.confidence - 25),
      };
    }

    seenKeys?.add(candidate.normalizedKey);
    return { accepted: true, reason: 'ok', score: candidate.confidence };
  }

  async isLegacyKeyword(canonicalName: string, region: RegionCode): Promise<boolean> {
    const stat = await this.keywordRepository.getHistoricalStat(canonicalName, region);
    if (!stat) return false;
    return stat.is_legacy_keyword || stat.total_mentions_90d >= 20;
  }

  private matchesNoisePattern(text: string) {
    if (!text.trim()) return true;
    return KEYWORD_NOISE_PATTERNS.some((pattern) => pattern.test(text));
  }
}
