import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class GoogleTrendsService {
  private readonly logger = new Logger(GoogleTrendsService.name);

  // 游戏领域关键词列表（用于稳定评分）
  private gameKeywords = new Set([
    'anime', 'tower', 'defense', 'simulator', 'tycoon', 'obby', 'battle', 'battlegrounds',
    'rpg', 'survival', 'shooter', 'horror', 'idle', 'clicker', 'farm', 'driving', 'racing',
    'strategy', 'co-op', 'pvp', 'soul', 'garden', 'blade', 'ball', 'last', 'stand', 'rng',
    'grow', 'type', 'anime', 'defense', 'tower', 'simulator', 'tycoon'
  ]);

  async getTrendScore(keyword: string): Promise<number> {
    this.logger.log(`获取 ${keyword} 的趋势分数`);

    // 稳定的趋势分数计算（不使用随机数）
    const baseScore = this.calculateStableScore(keyword);

    return baseScore;
  }

  async isTrending(keyword: string): Promise<boolean> {
    const score = await this.getTrendScore(keyword);
    return score > 50;
  }

  async getTrendData(keyword: string): Promise<any> {
    const score = await this.getTrendScore(keyword);
    const growth = this.calculateStableGrowth(keyword);

    return {
      score,
      growth,
      isTrending: score > 50,
      hasBreakout: score > 70
    };
  }

  // 稳定的分数计算（基于关键词特征）
  private calculateStableScore(keyword: string): number {
    const lowerKeyword = keyword.toLowerCase();
    let score = 30; // 基础分

    // 检查是否包含游戏领域关键词
    const hasGameKeyword = Array.from(this.gameKeywords).some(key => lowerKeyword.includes(key));
    if (hasGameKeyword) {
      score += 25;
    }

    // 检查词数（2-4 词短语得分更高）
    const wordCount = lowerKeyword.split(' ').length;
    if (wordCount >= 2 && wordCount <= 4) {
      score += 20;
    }

    // 检查是否为常见游戏名模式
    if (this.isGameNamePattern(lowerKeyword)) {
      score += 15;
    }

    // 确保分数在 0-100 之间
    return Math.min(100, Math.max(0, score));
  }

  // 稳定的增长率计算
  private calculateStableGrowth(keyword: string): number {
    const lowerKeyword = keyword.toLowerCase();
    let growth = 0.5; // 基础增长率

    // 检查是否包含游戏领域关键词
    const hasGameKeyword = Array.from(this.gameKeywords).some(key => lowerKeyword.includes(key));
    if (hasGameKeyword) {
      growth += 0.8;
    }

    // 检查词数
    const wordCount = lowerKeyword.split(' ').length;
    if (wordCount >= 2 && wordCount <= 4) {
      growth += 0.5;
    }

    // 检查是否为常见游戏名模式
    if (this.isGameNamePattern(lowerKeyword)) {
      growth += 0.3;
    }

    // 确保增长率在 0-2 之间
    return Math.min(2.0, Math.max(0, growth));
  }

  // 检查是否为游戏名模式
  private isGameNamePattern(keyword: string): boolean {
    const patterns = [
      /\s+(last|stand|soul|garden|blade|ball|rng|grow|type|defense|tower|simulator|tycoon)\s*$/i,
      /^(anime|tower|blade|grow|type|soul|sol)\s+/i,
      /\s+(defense|simulator|tycoon|battlegrounds|rpg|survival|shooter|horror|idle|clicker)\s*$/i
    ];

    return patterns.some(pattern => pattern.test(keyword));
  }
}
