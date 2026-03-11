import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { YoutubeService } from '../youtube/youtube.service';

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly youtubeService: YoutubeService
  ) { }

  private readonly stopWords = new Set([
    'game', 'games', 'black', 'white', 'red', 'blue', 'green',
    'item', 'items', 'merch', 'shirt', 'shirts', 'pants',
    'free', 'sale', 'offsale', 'limited', 'pre', 'old',
    'official', 'roblox', 'version',
    '2024', '2025', '2026',
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'are', 'was', 'were', 'be',
    'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
    'would', 'should', 'could', 'may', 'might', 'must'
  ]);

  private readonly edgeNoiseWords = new Set([
    'new', 'update', 'updates', 'guide', 'tips', 'codes', 'code',
    'release', 'trailer', 'gameplay', 'best', 'worst', 'beginner',
    'beginners', 'how', 'unlock', 'getting', 'play', 'playing'
  ]);

  private readonly colorWords = new Set([
    'black', 'white', 'red', 'blue', 'green', 'yellow',
    'purple', 'orange', 'pink', 'brown', 'gray', 'grey'
  ]);

  private readonly productWords = new Set([
    'merch', 'shirt', 'shirts', 'pants', 'hat', 'hats',
    'jacket', 'jackets', 'shoe', 'shoes'
  ]);

  private readonly gameHintWords = new Set([
    'simulator', 'tycoon', 'obby', 'defense', 'battle',
    'battlegrounds', 'rpg', 'survival', 'horror', 'shooter',
    'farm', 'idle', 'clicker', 'anime', 'tower', 'racing',
    'strategy', 'soul', 'ball', 'garden'
  ]);

  async analyzeTokens(): Promise<void> {
    this.logger.log('开始分析 Roblox 新游戏词');

    const videos = await this.youtubeService.getRobloxVideos(7);
    const gameCandidates = this.extractGameCandidates(videos);

    for (const { gameName, score, count, recentCount } of gameCandidates) {
      try {
        const existingWord = await this.prisma.newWord.findUnique({
          where: { token: gameName }
        });

        if (existingWord) {
          const nextRecentCount = existingWord.recent_count + recentCount;
          const nextTotalCount = existingWord.total_count + count;

          await this.prisma.newWord.update({
            where: { token: gameName },
            data: {
              recent_count: nextRecentCount,
              total_count: nextTotalCount,
              novelty_score: Math.min(
                1,
                ((nextRecentCount / Math.max(nextTotalCount, 1)) * 0.6) + (score * 0.4)
              )
            }
          });
        } else {
          await this.prisma.newWord.create({
            data: {
              token: gameName,
              novelty_score: Math.min(1, score),
              recent_count: recentCount,
              total_count: count,
              first_seen_at: new Date()
            }
          });
        }
      } catch (error) {
        this.logger.error(`分析游戏名 ${gameName} 失败:`, error);
      }
    }
  }

  async getNewWords(): Promise<{ items: any[] }> {
    const newWords = await this.prisma.newWord.findMany({
      orderBy: { novelty_score: 'desc' },
      take: 100
    });

    return {
      items: newWords.map(word => ({
        token: word.token,
        noveltyScore: word.novelty_score,
        recentCount: word.recent_count,
        totalCount: word.total_count,
        firstSeenAt: word.first_seen_at.toISOString().split('T')[0]
      }))
    };
  }

  async calculateWordFrequency(tokens: string[]): Promise<Map<string, number>> {
    const frequencyMap = new Map<string, number>();
    for (const token of tokens) {
      frequencyMap.set(token, (frequencyMap.get(token) || 0) + 1);
    }
    return frequencyMap;
  }

  private extractGameCandidates(
    videos: any[]
  ): { gameName: string; score: number; count: number; recentCount: number }[] {
    const gameNameMap = new Map<string, { count: number; recentCount: number; bestScore: number }>();

    for (const video of videos) {
      const title = String(video.title || '').toLowerCase().trim();
      if (!title) continue;

      const phrases = this.extractPhrases(title);

      for (const phrase of phrases) {
        if (!this.isValidGameName(phrase)) continue;

        const gameName = this.normalizeGameName(phrase);
        const phraseScore = this.scorePhrase(phrase, video);

        if (gameName.length < 5) continue;

        const current = gameNameMap.get(gameName) || {
          count: 0,
          recentCount: 0,
          bestScore: 0
        };

        gameNameMap.set(gameName, {
          count: current.count + 1,
          recentCount: current.recentCount + (this.isRecentVideo(video.publishedAt) ? 1 : 0),
          bestScore: Math.max(current.bestScore, phraseScore)
        });
      }
    }

    return Array.from(gameNameMap.entries())
      .filter(([_, data]) => data.count >= 2)
      .map(([gameName, data]) => {
        const wordCount = gameName.split(' ').length;
        const score = this.calculateGameNameScore(
          data.count,
          data.recentCount,
          wordCount,
          data.bestScore
        );

        return {
          gameName,
          score,
          count: data.count,
          recentCount: data.recentCount
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 50);
  }

  private extractPhrases(text: string): string[] {
    const words = text
      .replace(/[^a-zA-Z0-9\s']/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .filter(Boolean);

    const phrases: string[] = [];

    for (let size = 2; size <= 4; size++) {
      for (let i = 0; i <= words.length - size; i++) {
        const chunk = words.slice(i, i + size);
        const cleanedChunk = this.trimEdgeNoiseWords(chunk);

        if (cleanedChunk.length >= 2 && cleanedChunk.length <= 4) {
          phrases.push(cleanedChunk.join(' '));
        }
      }
    }

    return [...new Set(phrases)];
  }

  private trimEdgeNoiseWords(words: string[]): string[] {
    let start = 0;
    let end = words.length - 1;

    while (start <= end && this.edgeNoiseWords.has(words[start])) {
      start++;
    }

    while (end >= start && this.edgeNoiseWords.has(words[end])) {
      end--;
    }

    return words.slice(start, end + 1);
  }

  private isValidGameName(phrase: string): boolean {
    const words = phrase.split(' ').filter(Boolean);

    if (words.length < 2 || words.length > 4) return false;
    if (words.some(word => word.length < 3)) return false;
    if (words.some(word => this.stopWords.has(word))) return false;
    if (words.some(word => this.colorWords.has(word))) return false;
    if (words.some(word => this.productWords.has(word))) return false;
    if (words.some(word => /^\d+$/.test(word))) return false;
    if (words.some(word => /^\d{4}$/.test(word))) return false;

    const joined = words.join(' ');

    if (/\b\d+\b/.test(joined)) return false;
    if (joined.includes('free item')) return false;
    if (joined.includes('official merch')) return false;

    return true;
  }

  private normalizeGameName(name: string): string {
    return name
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private isRecentVideo(publishedAt: Date | string): boolean {
    const publishDate = new Date(publishedAt);
    const now = new Date();
    const diffDays = (now.getTime() - publishDate.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 3;
  }

  private scorePhrase(phrase: string, video: any): number {
    const words = phrase.split(' ');
    let score = 0;

    if (words.length === 2) score += 0.18;
    if (words.length === 3) score += 0.28;
    if (words.length === 4) score += 0.2;

    const hintMatches = words.filter(word => this.gameHintWords.has(word)).length;
    score += hintMatches * 0.12;

    if (this.isRecentVideo(video.publishedAt)) {
      score += 0.2;
    }

    return Math.min(1, score);
  }

  private calculateGameNameScore(
    count: number,
    recentCount: number,
    wordCount: number,
    bestPhraseScore: number
  ): number {
    let score = 0;

    score += Math.min(count * 0.08, 0.35);
    score += Math.min(recentCount * 0.12, 0.35);

    if (wordCount === 2) score += 0.1;
    if (wordCount === 3) score += 0.16;
    if (wordCount === 4) score += 0.08;

    score += bestPhraseScore;

    return Math.min(1, score);
  }
}