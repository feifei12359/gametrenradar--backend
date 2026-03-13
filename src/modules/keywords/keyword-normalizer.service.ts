import { Injectable } from '@nestjs/common';
import {
  KEYWORD_ALLOWED_SUFFIXES,
  KEYWORD_GENERIC_SINGLE_TOKENS,
  KEYWORD_STOP_WORDS,
} from './keyword-rules.constants';

@Injectable()
export class KeywordNormalizerService {
  private readonly stopWords = new Set(KEYWORD_STOP_WORDS);

  cleanTitle(rawTitle: string): string {
    return rawTitle
      .replace(/https?:\/\/\S+/gi, ' ')
      .replace(/www\.\S+/gi, ' ')
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, ' ')
      .replace(/[^\p{L}\p{N}\s-]+/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  normalizeKeywordKey(input: string): string {
    return this.cleanTitle(input)
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  canonicalizeKeyword(input: string): string {
    const cleaned = this.cleanTitle(input);
    const tokens = cleaned.split(' ').filter(Boolean);
    const trimmed = this.trimContextTokens(tokens);

    return trimmed
      .map((token) => {
        const lower = token.toLowerCase();
        if (lower === 'rng') return 'RNG';
        return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
      })
      .join(' ')
      .trim();
  }

  private trimContextTokens(tokens: string[]) {
    const work = [...tokens];

    while (work.length > 0) {
      const lower = work[0].toLowerCase();
      if (this.stopWords.has(lower) || KEYWORD_GENERIC_SINGLE_TOKENS.has(lower)) {
        work.shift();
        continue;
      }
      break;
    }

    while (work.length > 0) {
      const lower = work[work.length - 1].toLowerCase();
      if (this.stopWords.has(lower)) {
        work.pop();
        continue;
      }

      if (KEYWORD_GENERIC_SINGLE_TOKENS.has(lower) && !KEYWORD_ALLOWED_SUFFIXES.has(lower)) {
        work.pop();
        continue;
      }

      break;
    }

    return work;
  }
}
