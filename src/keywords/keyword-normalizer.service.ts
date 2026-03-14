import { Injectable } from '@nestjs/common';

export type NormalizedKeyword = {
  original: string;
  displayKey: string;
  compareKey: string;
  tokens: string[];
};

@Injectable()
export class KeywordNormalizerService {
  private readonly spellingCorrections: Record<string, string> = {
    resturaunt: 'restaurant',
    tycon: 'tycoon',
    simulater: 'simulator',
  };

  normalizeKeyword(keyword: string): NormalizedKeyword | null {
    const collapsed = keyword.trim().replace(/\s+/g, ' ');
    if (!collapsed) {
      return null;
    }

    const correctedTokens = collapsed
      .split(' ')
      .map((token) => this.correctSpelling(token))
      .filter(Boolean);

    if (!correctedTokens.length) {
      return null;
    }

    const compareTokens = correctedTokens.map((token) => token.toLowerCase());
    const displayTokens = correctedTokens.map((token) => this.toTitleCase(token));

    return {
      original: keyword,
      displayKey: displayTokens.join(' '),
      compareKey: compareTokens.join(' '),
      tokens: displayTokens,
    };
  }

  private correctSpelling(token: string): string {
    const lower = token.toLowerCase();
    return this.spellingCorrections[lower] ?? token;
  }

  private toTitleCase(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  }
}
