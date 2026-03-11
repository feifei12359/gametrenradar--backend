import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';

type CandidateKeyword = {
  keyword: string;
  source: 'steam' | 'roblox' | 'reddit';
  score: number;
  matchedFrom: string;
};

@Injectable()
export class CrawlerService {
  private readonly logger = new Logger(CrawlerService.name);

  private readonly stopWords = new Set([
    'game', 'games', 'gaming', 'play', 'playing',
    'black', 'white', 'red', 'blue', 'green',
    'item', 'items', 'merch', 'shirt', 'shirts', 'pants',
    'free', 'sale', 'offsale', 'limited', 'pre', 'new', 'old',
    'update', 'official', 'version', 'guide', 'tips',
    'best', 'how', 'get', 'more', 'code', 'codes',
    'roblox', 'steam', 'reddit',
    'and', 'the', 'for', 'with', 'from', 'into', 'your',
    '2024', '2025', '2026'
  ]);

  private readonly gameHintWords = new Set([
    'simulator', 'tycoon', 'obby', 'defense', 'battle', 'battlegrounds',
    'rpg', 'survival', 'horror', 'shooter', 'farm', 'idle', 'clicker',
    'anime', 'tower', 'racing', 'strategy', 'soul', 'ball'
  ]);

  async crawlSteam(): Promise<CandidateKeyword[]> {
    try {
      this.logger.log('开始抓取 Steam 新游戏');
      const url = 'https://store.steampowered.com/search/?sort_by=Released_DESC';
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 GameTrendRadarBot/1.0'
        }
      });

      const $ = cheerio.load(response.data);
      const candidates: CandidateKeyword[] = [];

      $('.search_result_row').each((_, element) => {
        const title = $(element).find('.title').text().trim();
        if (title) {
          candidates.push(...this.extractCandidateKeywords(title, 'steam'));
        }
      });

      return this.deduplicateCandidates(candidates);
    } catch (error) {
      this.logger.error('Steam 抓取失败:', error);
      return [];
    }
  }

  async crawlRoblox(): Promise<CandidateKeyword[]> {
    try {
      this.logger.log('开始抓取 Roblox 热门游戏');
      const url = 'https://www.roblox.com/discover';
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 GameTrendRadarBot/1.0'
        }
      });

      const $ = cheerio.load(response.data);
      const candidates: CandidateKeyword[] = [];

      const possibleSelectors = [
        '.game-card-name',
        '.game-card .game-card-name',
        '[data-testid="game-tile-name"]',
        '.game-name',
        '.game-card-title'
      ];

      for (const selector of possibleSelectors) {
        $(selector).each((_, element) => {
          const title = $(element).text().trim();
          if (title) {
            candidates.push(...this.extractCandidateKeywords(title, 'roblox'));
          }
        });
      }

      return this.deduplicateCandidates(candidates);
    } catch (error) {
      this.logger.error('Roblox 抓取失败:', error);
      return [];
    }
  }

  async crawlReddit(): Promise<CandidateKeyword[]> {
    try {
      this.logger.log('开始抓取 Reddit 游戏讨论');
      const subreddits = ['roblox', 'robloxgamedev', 'indiegames'];
      const candidates: CandidateKeyword[] = [];

      for (const subreddit of subreddits) {
        const url = `https://www.reddit.com/r/${subreddit}/hot.json?limit=30`;

        try {
          const response = await axios.get(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 GameTrendRadarBot/1.0'
            }
          });

          const posts = response.data?.data?.children || [];
          for (const post of posts) {
            const title = post?.data?.title;
            if (title) {
              candidates.push(...this.extractCandidateKeywords(title, 'reddit'));
            }
          }
        } catch (subError) {
          this.logger.error(`Reddit ${subreddit} 抓取失败:`, subError);
        }
      }

      return this.deduplicateCandidates(candidates);
    } catch (error) {
      this.logger.error('Reddit 抓取失败:', error);
      return [];
    }
  }

  async crawlAllPlatforms(): Promise<CandidateKeyword[]> {
    const [steamKeywords, robloxKeywords, redditKeywords] = await Promise.all([
      this.crawlSteam(),
      this.crawlRoblox(),
      this.crawlReddit()
    ]);

    return this.deduplicateCandidates([
      ...robloxKeywords,
      ...steamKeywords,
      ...redditKeywords
    ]).sort((a, b) => b.score - a.score);
  }

  private extractCandidateKeywords(text: string, source: 'steam' | 'roblox' | 'reddit'): CandidateKeyword[] {
    const normalized = text
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\s']/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!normalized) return [];

    const words = normalized
      .split(' ')
      .map(w => w.trim())
      .filter(Boolean)
      .filter(w => !this.isNoiseWord(w));

    const candidates: CandidateKeyword[] = [];

    for (let size = 2; size <= 4; size++) {
      for (let i = 0; i <= words.length - size; i++) {
        const phraseWords = words.slice(i, i + size);
        const phrase = phraseWords.join(' ').trim();

        if (!this.isValidPhrase(phrase, phraseWords)) continue;

        candidates.push({
          keyword: this.toTitleCase(phrase),
          source,
          score: this.scorePhrase(phrase, phraseWords, source),
          matchedFrom: text
        });
      }
    }

    if (words.length > 0) {
      const wholePhrase = words.join(' ').trim();
      if (this.isValidPhrase(wholePhrase, words) && words.length >= 2 && words.length <= 5) {
        candidates.push({
          keyword: this.toTitleCase(wholePhrase),
          source,
          score: this.scorePhrase(wholePhrase, words, source) + 2,
          matchedFrom: text
        });
      }
    }

    return this.deduplicateCandidates(candidates);
  }

  private isNoiseWord(word: string): boolean {
    if (!word) return true;
    if (word.length < 3) return true;
    if (/^\d+$/.test(word)) return true;
    if (/^20\d{2}$/.test(word)) return true;
    if (this.stopWords.has(word)) return true;
    return false;
  }

  private isValidPhrase(phrase: string, words: string[]): boolean {
    if (!phrase) return false;
    if (words.length < 2) return false;
    if (words.length > 5) return false;
    if (phrase.length < 6) return false;

    const joined = phrase.toLowerCase();

    if (joined.includes('free item')) return false;
    if (joined.includes('limited item')) return false;
    if (joined.includes('official merch')) return false;
    if (joined.includes('roblox game')) return false;

    const usefulWordCount = words.filter(w => !this.stopWords.has(w)).length;
    if (usefulWordCount < 2) return false;

    return true;
  }

  private scorePhrase(
    phrase: string,
    words: string[],
    source: 'steam' | 'roblox' | 'reddit'
  ): number {
    let score = 0;

    if (source === 'roblox') score += 8;
    if (source === 'reddit') score += 4;
    if (source === 'steam') score += 3;

    if (words.length === 2) score += 6;
    if (words.length === 3) score += 8;
    if (words.length === 4) score += 5;

    const hintMatches = words.filter(w => this.gameHintWords.has(w)).length;
    score += hintMatches * 5;

    if (phrase.includes("'s")) score += 3;

    if (/^[a-z0-9\s']+$/.test(phrase)) score += 1;

    return score;
  }

  private deduplicateCandidates(candidates: CandidateKeyword[]): CandidateKeyword[] {
    const map = new Map<string, CandidateKeyword>();

    for (const item of candidates) {
      const key = item.keyword.toLowerCase();
      const existing = map.get(key);

      if (!existing || item.score > existing.score) {
        map.set(key, item);
      }
    }

    return [...map.values()];
  }

  private toTitleCase(text: string): string {
    return text
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}