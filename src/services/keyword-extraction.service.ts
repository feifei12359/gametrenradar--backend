import { Injectable } from '@nestjs/common';
import { GENERIC_KEYWORD_PATTERNS } from '../discovery/discovery.constants';

type ExtractedKeywordCandidate = {
  raw: string;
  normalized: string;
  canonical: string;
  display: string;
  isGeneric: boolean;
  reason?: string;
};

@Injectable()
export class KeywordExtractionService {
  private readonly stopWords = new Set([
    'roblox',
    'new',
    'best',
    'update',
    'updates',
    'codes',
    'code',
    'game',
    'games',
    'release',
    'released',
    'crazy',
    'just',
    'this',
    'that',
    'guide',
    'wiki',
    'official',
    'the',
    'a',
    'an',
    'in',
    'on',
    'for',
    'to',
    'of',
    'with',
    'is',
    'are',
    'was',
    'were',
    'play',
    'played',
    'playing',
    'how',
  ]);

  private readonly genericTokens = new Set([
    'simulator',
    'tycoon',
    'tower',
    'defense',
    'obby',
    'rng',
    'clicker',
    'game',
    'update',
    'roblox',
    'codes',
    'guide',
    'wiki',
  ]);

  normalizeKeyword(input: string): string {
    return input
      .normalize('NFKD')
      .replace(/[^\w\s]/g, ' ')
      .replace(/\b\d+\b/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  canonicalizeKeyword(input: string): string {
    const normalized = this.normalizeKeyword(input);
    return normalized
      .split(' ')
      .filter(Boolean)
      .map((token) => (token === 'rng' ? 'RNG' : token.charAt(0).toUpperCase() + token.slice(1)))
      .join(' ');
  }

  extractCandidateKeywordsFromTitle(title: string): ExtractedKeywordCandidate[] {
    const originalTokens = title
      .replace(
        /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu,
        ' ',
      )
      .replace(/[|[\]{}()\-_:;,.!?/\\]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .filter(Boolean);

    const candidates = new Map<string, ExtractedKeywordCandidate>();

    for (let start = 0; start < originalTokens.length; start += 1) {
      for (let length = 2; length <= 5 && start + length <= originalTokens.length; length += 1) {
        const rawPhrase = originalTokens.slice(start, start + length).join(' ');
        const normalized = this.normalizeKeyword(rawPhrase);
        if (!normalized) continue;

        const cleanedTokens = normalized
          .split(' ')
          .filter((token) => token && !this.stopWords.has(token));

        if (cleanedTokens.length < 2 || cleanedTokens.length > 5) continue;
        if (!cleanedTokens.some((token) => !this.genericTokens.has(token))) continue;

        const cleaned = cleanedTokens.join(' ');
        const isGeneric = this.isGenericPhrase(cleaned);
        const canonical = this.canonicalizeKeyword(cleaned);

        if (!canonical) continue;

        const existing = candidates.get(canonical);
        const current: ExtractedKeywordCandidate = {
          raw: rawPhrase,
          normalized: cleaned,
          canonical,
          display: canonical,
          isGeneric,
          reason: isGeneric ? 'generic-pattern' : undefined,
        };

        if (!existing || existing.normalized.length < current.normalized.length) {
          candidates.set(canonical, current);
        }
      }
    }

    return Array.from(candidates.values()).filter((candidate) => {
      if (candidate.isGeneric) {
        const hasWhitelistPattern =
          candidate.normalized.split(' ').length >= 2 &&
          candidate.normalized.split(' ').some((token) => !this.genericTokens.has(token));
        return hasWhitelistPattern;
      }
      return true;
    });
  }

  private isGenericPhrase(phrase: string): boolean {
    const normalized = this.normalizeKeyword(phrase);
    if (!normalized) return true;

    if (GENERIC_KEYWORD_PATTERNS.includes(normalized)) {
      return true;
    }

    const tokens = normalized.split(' ');
    return tokens.every((token) => this.genericTokens.has(token));
  }
}
