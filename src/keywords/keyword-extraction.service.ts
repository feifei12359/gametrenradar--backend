import { Injectable } from '@nestjs/common';

@Injectable()
export class KeywordExtractionService {
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
    'roblox',
    'game',
    'video',
  ]);

  private readonly noiseWords = new Set([
    'new',
    'update',
    'updates',
    'codes',
    'code',
    'official',
    'release',
    'released',
    'just',
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

    const tokens = cleaned.split(/\s+/).filter(Boolean);
    const candidates: string[] = [];

    for (let size = 4; size >= 2; size -= 1) {
      for (let index = 0; index <= tokens.length - size; index += 1) {
        const phraseTokens = tokens.slice(index, index + size);
        if (!this.isValidGameNamePhrase(phraseTokens)) {
          continue;
        }

        candidates.push(this.toTitleCase(phraseTokens.join(' ')));
      }
    }

    const bestCandidate = this.pickBestCandidate(candidates);
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

  private isValidGameNamePhrase(tokens: string[]): boolean {
    if (tokens.length < 2 || tokens.length > 4) {
      return false;
    }

    const lowered = tokens.map((token) => token.toLowerCase());

    if (lowered.some((token) => this.bannedWords.has(token))) {
      return false;
    }

    const meaningfulTokens = lowered.filter((token) => !this.noiseWords.has(token));
    if (meaningfulTokens.length < 2) {
      return false;
    }

    const titleLikeCount = tokens.filter((token) => this.isTitleLikeToken(token)).length;
    if (titleLikeCount < Math.ceil(tokens.length / 2)) {
      return false;
    }

    return true;
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

  private scoreCandidate(candidate: string): number {
    const tokens = candidate.split(' ');
    let score = 0;

    score += tokens.length * 10;
    score += tokens.filter((token) => this.isTitleLikeToken(token)).length * 12;

    if (/simulator|tycoon|saga|extraction|defense/i.test(candidate)) {
      score += 8;
    }

    if (tokens.length === 3) {
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
      .map((token) => token.charAt(0).toUpperCase() + token.slice(1).toLowerCase())
      .join(' ');
  }
}
