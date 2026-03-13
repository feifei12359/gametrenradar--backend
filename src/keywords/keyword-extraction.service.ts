import { Injectable } from '@nestjs/common';

@Injectable()
export class KeywordExtractionService {
  private readonly noiseWords = new Set([
    'roblox',
    'new',
    'update',
    'updates',
    'codes',
    'code',
    'game',
    'games',
    'best',
    'official',
    'release',
    'released',
    'just',
    'video',
    'videos',
    'how',
    'to',
    'in',
    'on',
    'for',
    'the',
    'all',
    'free',
    'admin',
  ]);

  extractCandidates(title: string): string[] {
    const cleaned = this.cleanTitle(title);
    if (!cleaned) {
      return [];
    }

    const originalTokens = cleaned.split(/\s+/).filter(Boolean);
    const tokens = originalTokens.filter((token) => !this.noiseWords.has(token.toLowerCase()));

    const candidates = new Set<string>();

    for (let size = 5; size >= 2; size -= 1) {
      for (let index = 0; index <= tokens.length - size; index += 1) {
        const phraseTokens = tokens.slice(index, index + size);
        if (!this.looksLikeGamePhrase(phraseTokens)) {
          continue;
        }

        candidates.add(this.toTitleCase(phraseTokens.join(' ')));
      }
    }

    if (!candidates.size && tokens.length >= 2) {
      candidates.add(this.toTitleCase(tokens.slice(0, Math.min(tokens.length, 4)).join(' ')));
    }

    return [...candidates];
  }

  private cleanTitle(title: string): string {
    return title
      .normalize('NFKD')
      .replace(/[\u{1F300}-\u{1FAFF}]/gu, ' ')
      .replace(/\[[^\]]*\]|\([^)]*\)|\{[^}]*\}/g, ' ')
      .replace(/[^a-zA-Z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private looksLikeGamePhrase(tokens: string[]): boolean {
    if (tokens.length < 2 || tokens.length > 5) {
      return false;
    }

    const significantCount = tokens.filter((token) => token.length > 2 || /\d/.test(token)).length;
    const titleLikeCount = tokens.filter((token) => /^[A-Z0-9][a-zA-Z0-9]*$/.test(token)).length;

    return significantCount >= 2 && titleLikeCount >= Math.max(2, tokens.length - 1);
  }

  private toTitleCase(value: string): string {
    return value
      .split(/\s+/)
      .filter(Boolean)
      .map((token) => {
        if (token === token.toUpperCase()) {
          return token.charAt(0) + token.slice(1).toLowerCase();
        }

        return token.charAt(0).toUpperCase() + token.slice(1);
      })
      .join(' ');
  }
}
