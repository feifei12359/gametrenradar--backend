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

  private readonly bannedWords = new Set([
    'play',
    'you',
    'this',
    'try',
    'watch',
    'must',
    'today',
    'now',
    'best',
    'guide',
  ]);

  private readonly bannedPhrases = new Set([
    'play with you',
    'try out a',
    'have you play',
    'come try out a',
  ]);

  extractCandidates(title: string): string[] {
    const cleaned = this.cleanTitle(title);
    if (!cleaned) {
      return [];
    }

    const originalTokens = cleaned.split(/\s+/).filter(Boolean);
    const candidatePool = this.buildCandidatePool(originalTokens);
    const bestCandidate = this.pickBestCandidate(candidatePool);

    return bestCandidate ? [bestCandidate] : [];
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

  private buildCandidatePool(tokens: string[]): string[] {
    const candidates: string[] = [];

    for (let size = 4; size >= 2; size -= 1) {
      for (let index = 0; index <= tokens.length - size; index += 1) {
        const phraseTokens = tokens.slice(index, index + size);
        if (!this.looksLikeGamePhrase(phraseTokens)) {
          continue;
        }

        candidates.push(this.toTitleCase(phraseTokens.join(' ')));
      }
    }

    return candidates;
  }

  private pickBestCandidate(candidates: string[]): string | null {
    if (!candidates.length) {
      return null;
    }

    const ranked = candidates
      .map((candidate) => ({
        candidate,
        score: this.scoreCandidate(candidate),
      }))
      .sort((a, b) => b.score - a.score);

    return ranked[0]?.score > 0 ? ranked[0].candidate : null;
  }

  private looksLikeGamePhrase(tokens: string[]): boolean {
    if (tokens.length < 2 || tokens.length > 4) {
      return false;
    }

    const normalizedTokens = tokens.map((token) => token.toLowerCase());
    const joined = normalizedTokens.join(' ');

    if (this.bannedPhrases.has(joined)) {
      return false;
    }

    if (normalizedTokens.some((token) => this.bannedWords.has(token))) {
      return false;
    }

    const filteredTokens = normalizedTokens.filter((token) => !this.noiseWords.has(token));
    if (filteredTokens.length < 2) {
      return false;
    }

    const titleCaseCount = tokens.filter((token) => this.isTitleLikeToken(token)).length;
    if (titleCaseCount < Math.ceil(tokens.length / 2)) {
      return false;
    }

    return true;
  }

  private scoreCandidate(candidate: string): number {
    const tokens = candidate.split(' ');
    const lower = candidate.toLowerCase();

    let score = 0;

    score += tokens.length * 10;
    score += tokens.filter((token) => this.isTitleLikeToken(token)).length * 8;

    if (/simulator|tycoon/.test(lower)) {
      score += 12;
    }

    if (tokens.length === 3) {
      score += 6;
    }

    if (tokens.length === 4) {
      score += 4;
    }

    return score;
  }

  private isTitleLikeToken(token: string): boolean {
    return /^[A-Z][a-zA-Z0-9]*$/.test(token) || /^\d+[A-Z]?[a-zA-Z0-9]*$/.test(token);
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
