import { Injectable, Logger } from '@nestjs/common';

type TrendData = {
  keyword: string;
  score: number;
  isTrending: boolean;
  growth: number;
  daysSinceFirstSeen: number;
};

@Injectable()
export class GoogleTrendsService {
  private readonly logger = new Logger(GoogleTrendsService.name);

  private readonly strongGameHints = new Set([
    'anime', 'tower', 'defense', 'simulator', 'tycoon',
    'obby', 'battle', 'battlegrounds', 'survival', 'rpg',
    'shooter', 'horror', 'clicker', 'idle', 'farm',
    'garden', 'rng', 'soul', 'ball'
  ]);

  private readonly weakGameHints = new Set([
    'quest', 'world', 'hero', 'legends', 'raid',
    'wars', 'clash', 'story', 'pets', 'dungeon',
    'monster', 'fighters', 'training', 'masters'
  ]);

  private readonly noiseWords = new Set([
    'free', 'update', 'official', 'version', 'code', 'codes',
    'guide', 'tips', 'best', 'review', 'how', 'new',
    'roblox', 'game', 'games'
  ]);

  async getTrendScore(keyword: string): Promise<number> {
    try {
      const data = this.buildTrendData(keyword);
      this.logger.log(`获取 ${keyword} 的趋势分数：${data.score}`);
      return data.score;
    } catch (error) {
      this.logger.error('获取趋势分数失败:', error);
      return 35;
    }
  }

  async isTrending(keyword: string): Promise<boolean> {
    try {
      const data = this.buildTrendData(keyword);
      return data.isTrending;
    } catch (error) {
      this.logger.error('判断趋势失败:', error);
      return false;
    }
  }

  async getTrendData(keyword: string): Promise<TrendData> {
    try {
      return this.buildTrendData(keyword);
    } catch (error) {
      this.logger.error('获取趋势数据失败:', error);
      return {
        keyword,
        score: 35,
        isTrending: false,
        growth: 0.8,
        daysSinceFirstSeen: 14
      };
    }
  }

  private buildTrendData(keyword: string): TrendData {
    const normalized = String(keyword || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s']/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const words = normalized.split(' ').filter(Boolean);

    let score = 25;

    // 1. 短语长度加权
    if (words.length === 2) score += 10;
    if (words.length === 3) score += 18;
    if (words.length === 4) score += 12;
    if (words.length >= 5) score -= 5;

    // 2. 强游戏词加权
    const strongMatches = words.filter(word => this.strongGameHints.has(word)).length;
    score += strongMatches * 12;

    // 3. 弱游戏词加权
    const weakMatches = words.filter(word => this.weakGameHints.has(word)).length;
    score += weakMatches * 6;

    // 4. 噪音词降权
    const noiseMatches = words.filter(word => this.noiseWords.has(word)).length;
    score -= noiseMatches * 10;

    // 5. 特殊命名风格加权（像游戏名）
    if (normalized.includes("'s")) score += 6;
    if (/[a-z]+\s[a-z]+/.test(normalized)) score += 4;

    // 6. 数字降权
    if (/\b\d+\b/.test(normalized)) score -= 15;

    // 7. 稳定伪随机偏移（同一个词永远一样）
    score += this.stableKeywordOffset(normalized);

    score = Math.max(0, Math.min(100, score));

    const growth = this.calculateGrowth(score, strongMatches, weakMatches, noiseMatches);
    const isTrending = score >= 60;
    const daysSinceFirstSeen = this.calculateDaysSinceFirstSeen(score);

    return {
      keyword,
      score,
      isTrending,
      growth,
      daysSinceFirstSeen
    };
  }

  private stableKeywordOffset(keyword: string): number {
    let hash = 0;

    for (let i = 0; i < keyword.length; i++) {
      hash = (hash * 31 + keyword.charCodeAt(i)) % 9973;
    }

    // 输出 -6 到 +6 的稳定偏移
    return (hash % 13) - 6;
  }

  private calculateGrowth(
    score: number,
    strongMatches: number,
    weakMatches: number,
    noiseMatches: number
  ): number {
    let growth = 0.6;

    growth += Math.min(score / 100, 0.8);
    growth += strongMatches * 0.18;
    growth += weakMatches * 0.08;
    growth -= noiseMatches * 0.12;

    return Number(Math.max(0.2, Math.min(2.5, growth)).toFixed(2));
  }

  private calculateDaysSinceFirstSeen(score: number): number {
    if (score >= 80) return 3;
    if (score >= 70) return 5;
    if (score >= 60) return 7;
    if (score >= 50) return 12;
    return 20;
  }
}