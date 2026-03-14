import { Injectable } from '@nestjs/common';

@Injectable()
export class KeywordExtractionService {
  private readonly bannedWords = new Set([
    'unlock',
    'this',
    'how',
    'watch',
    'play',
    'played',
    'playing',
    'recently',
    'live',
    'present',
    'welcome',
    'try',
    'build',
    'make',
    'start',
    'must',
    'today',
    'now',
    'guide',
    'video',
  ]);

  private readonly noiseWords = new Set([
    'roblox',
    'game',
    'gameplay',
    'update',
    'updates',
    'codes',
    'code',
    'new',
    'player',
    'ever',
  ]);

  private readonly stopWords = new Set(['a', 'the', 'my', 'your', 'our', 'we', 'you', 'i']);

  private readonly bannedLeadWords = new Set([
    'how',
    'why',
    'when',
    'where',
    'what',
    'every',
    'best',
    'top',
    'guys',
  ]);

  private readonly weakLeadWords = new Set([
    'an',
    'come',
    'have',
    'super',
    'scary',
    'any',
    'millionaire',
    'research',
    'mode',
    'sec',
    'secret',
    'steal',
    'pats',
    'khaleel',
  ]);

  private readonly connectorWords = new Set(['in', 'for', 'of', 'with', 'to']);

  private readonly gameTypeWords = new Set([
    'tycoon',
    'simulator',
    'survival',
    'obby',
    'rng',
    'defense',
    'battlegrounds',
    'factory',
    'clicker',
  ]);

  extractCandidates(title: string): string[] {
    const cleaned = this.cleanTitle(title);
    if (!cleaned) {
      return [];
    }

    const originalTokens = cleaned.split(/\s+/).filter(Boolean);
    const normalizedTokens = this.normalizeTokens(originalTokens);
    if (normalizedTokens.length < 2) {
      return [];
    }

    const candidate = this.pickBestCandidate(normalizedTokens);
    return candidate ? [candidate] : [];
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

  private normalizeTokens(tokens: string[]): string[] {
    return tokens.filter((token) => !this.noiseWords.has(token.toLowerCase()));
  }

  private pickBestCandidate(tokens: string[]): string | null {
    const candidates: string[] = [];

    for (let size = 3; size >= 2; size -= 1) {
      for (let index = 0; index <= tokens.length - size; index += 1) {
        const phraseTokens = tokens.slice(index, index + size);
        const normalizedPhrase = this.normalizePhraseByConnector(phraseTokens);
        if (!normalizedPhrase || !this.isValidGameNamePhrase(normalizedPhrase)) {
          continue;
        }

        candidates.push(this.toTitleCase(normalizedPhrase.join(' ')));
      }
    }

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

  private normalizePhraseByConnector(tokens: string[]): string[] | null {
    const lowered = tokens.map((token) => token.toLowerCase());
    const connectorIndex = lowered.findIndex((token) => this.connectorWords.has(token));

    const sliced = connectorIndex >= 0 ? tokens.slice(connectorIndex + 1) : tokens;
    const filtered = sliced.filter((token) => !this.noiseWords.has(token.toLowerCase()));

    return filtered.length >= 2 ? filtered : null;
  }

  private isValidGameNamePhrase(tokens: string[]): boolean {
    if (tokens.length < 2 || tokens.length > 3) {
      return false;
    }

    const lowered = tokens.map((token) => token.toLowerCase());

    if (this.bannedLeadWords.has(lowered[0]) || this.weakLeadWords.has(lowered[0])) {
      return false;
    }

    if (lowered.some((token) => this.bannedWords.has(token) || this.stopWords.has(token))) {
      return false;
    }

    if (tokens.some((token) => /\d/.test(token))) {
      return false;
    }

    const titleLikeCount = tokens.filter((token) => this.isTitleLikeToken(token)).length;
    if (titleLikeCount < Math.ceil(tokens.length / 2)) {
      return false;
    }

    const hasGameType = lowered.some((token) => this.gameTypeWords.has(token));
    if (!hasGameType) {
      return false;
    }

    return true;
  }

  private scoreCandidate(candidate: string): number {
    const tokens = candidate.split(' ');
    const lowered = tokens.map((token) => token.toLowerCase());

    let score = 0;

    score += tokens.length * 10;
    score += tokens.filter((token) => this.isTitleLikeToken(token)).length * 12;
    score += lowered.filter((token) => this.gameTypeWords.has(token)).length * 24;

    if (tokens.length === 3) {
      score += 4;
    }

    return score;
  }

  private isTitleLikeToken(token: string): boolean {
    return /^[A-Z][a-zA-Z]*$/.test(token);
  }

  private toTitleCase(value: string): string {
    return value
      .split(/\s+/)
      .filter(Boolean)
      .map((token) => token.charAt(0).toUpperCase() + token.slice(1).toLowerCase())
      .join(' ');
  }
}
