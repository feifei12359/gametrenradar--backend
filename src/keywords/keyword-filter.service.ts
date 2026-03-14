import { Injectable } from '@nestjs/common';
import { GENERIC_KEYWORDS } from '../config/discovery.config';

@Injectable()
export class KeywordFilterService {
  private readonly blacklist = new Set<string>(GENERIC_KEYWORDS);

  filterCandidates(candidates: string[]): string[] {
    const deduped = new Set<string>();

    for (const rawCandidate of candidates) {
      const candidate = rawCandidate.trim().replace(/\s+/g, ' ');
      if (!candidate) {
        continue;
      }

      const lower = candidate.toLowerCase();
      const tokenCount = candidate.split(' ').length;

      if (tokenCount < 2 || tokenCount > 5) {
        continue;
      }

      if (this.blacklist.has(lower)) {
        continue;
      }

      if (!this.hasMeaningfulPrefix(candidate)) {
        continue;
      }

      deduped.add(candidate);
    }

    return [...deduped];
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
}
