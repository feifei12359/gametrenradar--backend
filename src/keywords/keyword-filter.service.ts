import { Injectable } from '@nestjs/common';
import { KeywordNormalizerService } from './keyword-normalizer.service';

@Injectable()
export class KeywordFilterService {
  private readonly validSuffixTokens = new Set([
    'tycoon',
    'simulator',
    'obby',
    'survival',
    'defense',
    'rng',
    'battlegrounds',
  ]);
  private readonly seoTokens = new Set([
    'viral',
    'shorts',
    'short',
    'gameplay',
    'update',
    'review',
    'trailer',
    'live',
    'official',
  ]);
  private readonly verbPrefixTokens = new Set([
    'play',
    'playing',
    'watch',
    'trying',
    'make',
    'making',
    'build',
    'building',
    'test',
    'testing',
  ]);
  private readonly multilingualPrefixTokens = new Set([
    'apakah',
    'cara',
    'como',
    'para',
  ]);
  private readonly stopwords = new Set(['a', 'the', 'my', 'your', 'our', 'we', 'you', 'i']);

  constructor(private readonly keywordNormalizerService: KeywordNormalizerService) {}

  filterCandidates(candidates: string[]): string[] {
    const deduped = new Map<string, string>();

    for (const rawCandidate of candidates) {
      const filteredKeyword = this.filterKeyword(rawCandidate);
      if (!filteredKeyword) {
        continue;
      }

      const normalized = this.keywordNormalizerService.normalizeKeyword(filteredKeyword);
      if (!normalized) {
        continue;
      }

      const candidate = normalized.compareKey;
      const lower = normalized.compareKey;

      deduped.set(lower, candidate);
    }

    return [...deduped.values()];
  }

  filterKeyword(input: string): string | null {
    const keyword = this.normalize(input);
    let tokens = keyword.split(' ').filter(Boolean);

    if (tokens.length < 2) {
      return null;
    }

    if (this.multilingualPrefixTokens.has(tokens[0])) {
      return null;
    }

    if (this.verbPrefixTokens.has(tokens[0])) {
      return null;
    }

    if (this.stopwords.has(tokens[0])) {
      return null;
    }

    if (this.seoTokens.has(tokens[tokens.length - 1])) {
      tokens = tokens.slice(0, -1);
    }

    if (tokens.length < 2 || tokens.length > 3) {
      return null;
    }

    const suffix = tokens[tokens.length - 1];
    if (!this.validSuffixTokens.has(suffix)) {
      return null;
    }

    return tokens.join(' ');
  }

  private normalize(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  getQualityScoreAdjustment(keyword: string): number {
    const lower = keyword.toLowerCase();
    const tokens = lower.split(' ');
    let adjustment = 0;

    if (tokens.length >= 3) {
      adjustment += 8;
    }

    if (!this.validSuffixTokens.has(tokens[tokens.length - 1] ?? '')) {
      adjustment -= 20;
    }

    if (lower === 'pet simulator' || lower === 'tap simulator' || lower === 'game tycoon') {
      adjustment -= 18;
    }

    if (tokens[0] === 'game' || tokens[0] === 'pet' || tokens[0] === 'tap') {
      adjustment -= 8;
    }

    return adjustment;
  }
}
