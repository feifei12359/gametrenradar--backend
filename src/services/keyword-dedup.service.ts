import { Injectable } from '@nestjs/common';
import { KeywordExtractionService } from './keyword-extraction.service';

@Injectable()
export class KeywordDedupService {
  constructor(private readonly extractionService: KeywordExtractionService) {}

  deduplicate(rawKeywords: string[]): Array<{
    canonicalName: string;
    displayName: string;
    aliases: string[];
  }> {
    const map = new Map<string, Set<string>>();

    for (const rawKeyword of rawKeywords) {
      const canonicalName = this.extractionService.canonicalizeKeyword(rawKeyword);
      if (!canonicalName) continue;
      if (!map.has(canonicalName)) {
        map.set(canonicalName, new Set());
      }
      map.get(canonicalName)?.add(rawKeyword.trim());
    }

    return Array.from(map.entries()).map(([canonicalName, aliases]) => ({
      canonicalName,
      displayName: canonicalName,
      aliases: Array.from(aliases),
    }));
  }
}
