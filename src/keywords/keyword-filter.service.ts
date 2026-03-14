import { Injectable } from '@nestjs/common';
import { GENERIC_KEYWORDS } from '../config/discovery.config';
import { KeywordNormalizerService } from './keyword-normalizer.service';

@Injectable()
export class KeywordFilterService {
  private readonly blacklist = new Set<string>(GENERIC_KEYWORDS);
  private readonly rejectedPrefixTokens = new Set([
    'play',
    'playing',
    'are',
    'is',
    'was',
    'official',
    'best',
    'new',
    'update',
  ]);
  private readonly validSuffixTokens = new Set([
    'tycoon',
    'simulator',
    'obby',
    'survival',
    'defense',
    'rng',
    'battlegrounds',
  ]);
  private readonly weekdayTokens = new Set([
    'mon',
    'monday',
    'tue',
    'tuesday',
    'wed',
    'wednesday',
    'thu',
    'thursday',
    'fri',
    'friday',
    'sat',
    'saturday',
    'sun',
    'sunday',
  ]);
  private readonly prefixTokens = new Set([
    'here',
    'new',
    'best',
    'top',
    'playing',
    'trying',
    'watching',
    'latest',
    'this',
  ]);

  constructor(private readonly keywordNormalizerService: KeywordNormalizerService) {}

  filterCandidates(candidates: string[]): string[] {
    const deduped = new Map<string, string>();

    for (const rawCandidate of candidates) {
      if (this.shouldRejectByPrefix(rawCandidate)) {
        continue;
      }

      const cleanedPrefix = this.cleanKeywordPrefix(rawCandidate);
      if (!cleanedPrefix) {
        continue;
      }

      const normalized = this.keywordNormalizerService.normalizeKeyword(cleanedPrefix);
      if (!normalized) {
        continue;
      }

      const candidate = normalized.displayKey;
      const lower = normalized.compareKey;
      const tokenCount = normalized.tokens.length;
      const lastToken = normalized.tokens[normalized.tokens.length - 1] ?? '';

      if (tokenCount < 2 || tokenCount > 5) {
        continue;
      }

      if (lastToken.length < 2) {
        continue;
      }

      if (this.shouldRejectTruncatedKeyword(normalized.tokens)) {
        continue;
      }

      if (!this.hasValidSuffix(normalized.tokens)) {
        continue;
      }

      if (this.blacklist.has(lower)) {
        continue;
      }

      if (!this.hasMeaningfulPrefix(candidate)) {
        continue;
      }

      deduped.set(lower, candidate);
    }

    return [...deduped.values()];
  }

  shouldRejectByPrefix(keyword: string): boolean {
    const tokens = keyword
      .trim()
      .replace(/\s+/g, ' ')
      .split(' ')
      .filter(Boolean);

    if (!tokens.length) {
      return true;
    }

    const firstToken = tokens[0].toLowerCase();
    return this.rejectedPrefixTokens.has(firstToken) || tokens[0].length < 3;
  }

  cleanKeywordPrefix(keyword: string): string | null {
    const tokens = keyword
      .trim()
      .replace(/\s+/g, ' ')
      .split(' ')
      .filter(Boolean);

    if (!tokens.length) {
      return null;
    }

    const normalizedFirstToken = tokens[0].toLowerCase();
    const cleanedTokens = this.prefixTokens.has(normalizedFirstToken) ? tokens.slice(1) : tokens;

    if (cleanedTokens.length < 2) {
      return null;
    }

    return cleanedTokens.join(' ');
  }

  hasValidSuffix(tokens: string[]): boolean {
    if (!tokens.length) {
      return false;
    }

    const lastToken = tokens[tokens.length - 1].toLowerCase();
    return this.validSuffixTokens.has(lastToken);
  }

  private hasMeaningfulPrefix(candidate: string): boolean {
    const tokens = candidate.toLowerCase().split(' ');

    if (tokens.every((token) => this.blacklist.has(token))) {
      return false;
    }

    const phraseWithoutTrailingNoise = [...tokens];
    while (phraseWithoutTrailingNoise.length > 1) {
      const joined = phraseWithoutTrailingNoise.join(' ');
      if (!this.blacklist.has(joined)) {
        break;
      }
      phraseWithoutTrailingNoise.pop();
    }

    const meaningfulTokens = tokens.filter((token) => !this.blacklist.has(token));
    return meaningfulTokens.length >= 1;
  }

  isWeekdayToken(token: string): boolean {
    return this.weekdayTokens.has(token.toLowerCase());
  }

  hasInvalidShortToken(tokens: string[]): boolean {
    return tokens.some((token) => token.length < 2);
  }

  shouldRejectTruncatedKeyword(tokens: string[]): boolean {
    if (!tokens.length) {
      return true;
    }

    const normalizedTokens = tokens.map((token) => token.toLowerCase());

    if (this.isWeekdayToken(normalizedTokens[0])) {
      return true;
    }

    if (this.hasInvalidShortToken(tokens)) {
      return true;
    }

    if (tokens[0].length < 3) {
      return true;
    }

    return false;
  }

  getQualityScoreAdjustment(keyword: string): number {
    const lower = keyword.toLowerCase();
    const tokens = lower.split(' ');
    let adjustment = 0;

    if (tokens.length >= 3) {
      adjustment += 8;
    }

    if (tokens.some((token) => this.blacklist.has(token))) {
      adjustment -= 12;
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
