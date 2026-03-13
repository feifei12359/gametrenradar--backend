import { Injectable } from '@nestjs/common';
import {
  KEYWORD_GENERIC_BLACKLIST,
  KEYWORD_GENERIC_SINGLE_TOKENS,
  KEYWORD_SOURCE_CONTEXT_TERMS,
  KEYWORD_STOP_WORDS,
} from './keyword-rules.constants';
import { KeywordNormalizerService } from './keyword-normalizer.service';
import { CandidateKeyword } from './keyword.types';

@Injectable()
export class KeywordExtractionService {
  private readonly stopWords = new Set(KEYWORD_STOP_WORDS);
  private readonly genericTerms = new Set(KEYWORD_GENERIC_SINGLE_TOKENS);
  private readonly genericBlacklist = new Set(KEYWORD_GENERIC_BLACKLIST);

  constructor(private readonly normalizer: KeywordNormalizerService) {}

  cleanTitle(rawTitle: string): string {
    return this.normalizer.cleanTitle(rawTitle);
  }

  extractCandidateKeywordsFromTitle(
    title: string,
    options?: {
      queryTerm?: string;
      description?: string;
    },
  ): CandidateKeyword[] {
    const cleanedTitle = this.cleanTitle(title);
    if (!cleanedTitle) {
      return [];
    }

    const originalTokens = cleanedTitle.split(' ').filter(Boolean);
    const candidates = new Map<string, CandidateKeyword>();

    for (let start = 0; start < originalTokens.length; start += 1) {
      for (let size = 1; size <= 5 && start + size <= originalTokens.length; size += 1) {
        const slice = originalTokens.slice(start, start + size);
        const rawText = slice.join(' ').trim();
        const normalizedRaw = this.normalizer.normalizeKeywordKey(rawText);
        const tokenCount = normalizedRaw ? normalizedRaw.split(' ').length : 0;

        const canonical = this.normalizer.canonicalizeKeyword(rawText);
        const normalizedText = this.normalizer.normalizeKeywordKey(canonical);

        if (!normalizedText) continue;

        const isGeneric = this.isGenericPhrase(normalizedText);
        const genericReason = isGeneric ? 'generic_phrase' : undefined;
        const confidence = this.computeConfidence(slice, normalizedText, {
          queryTerm: options?.queryTerm,
          title,
          description: options?.description,
        });

        const candidate: CandidateKeyword = {
          rawText,
          normalizedText,
          displayName: canonical || rawText,
          normalizedKey: normalizedText,
          tokenCount,
          isGeneric,
          genericReason,
          confidence,
        };

        const existing = candidates.get(`${candidate.normalizedKey}:${candidate.tokenCount}`);
        if (!existing || existing.confidence < candidate.confidence) {
          candidates.set(`${candidate.normalizedKey}:${candidate.tokenCount}`, candidate);
        }
      }
    }

    return Array.from(candidates.values())
      .filter((candidate) => candidate.tokenCount <= 5)
      .sort((left, right) => right.confidence - left.confidence);
  }

  private isGenericPhrase(normalizedText: string): boolean {
    if (this.genericBlacklist.has(normalizedText)) {
      return true;
    }

    const tokens = normalizedText.split(' ').filter(Boolean);
    return tokens.every((token) => this.genericTerms.has(token));
  }

  private computeConfidence(
    originalTokens: string[],
    normalizedText: string,
    options: { queryTerm?: string; title: string; description?: string },
  ) {
    let score = 35;
    const tokens = normalizedText.split(' ').filter(Boolean);

    if (tokens.length >= 2 && tokens.length <= 4) score += 18;
    else if (tokens.length === 5) score += 10;
    else if (tokens.length === 1) score -= 18;

    const capitalizedCount = originalTokens.filter((token) =>
      /^[A-Z][a-zA-Z0-9-]*$/.test(token) || token === token.toUpperCase(),
    ).length;
    score += Math.round((capitalizedCount / Math.max(originalTokens.length, 1)) * 20);

    if (tokens.some((token) => !this.stopWords.has(token) && !this.genericTerms.has(token))) {
      score += 12;
    }

    if (tokens.every((token) => this.genericTerms.has(token))) {
      score -= 40;
    } else {
      const genericCount = tokens.filter((token) => this.genericTerms.has(token)).length;
      score -= genericCount * 6;
    }

    const stopWordCount = tokens.filter((token) => this.stopWords.has(token)).length;
    score -= stopWordCount * 8;

    const queryTerm = options.queryTerm?.toLowerCase().trim();
    if (
      queryTerm &&
      KEYWORD_SOURCE_CONTEXT_TERMS.includes(queryTerm) &&
      tokens.some((token) => !this.genericTerms.has(token))
    ) {
      score += 8;
    }

    if (/\b(first time|just released|new release|update)\b/i.test(options.title)) {
      score += 4;
    }

    return Math.max(0, Math.min(100, score));
  }
}
