import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AIScoreService {
  private readonly logger = new Logger(AIScoreService.name);

  // 游戏领域关键词（用于 AI 评分）
  private gameKeywords = new Set([
    'anime', 'tower', 'defense', 'simulator', 'tycoon', 'obby', 'battle', 'battlegrounds',
    'rpg', 'survival', 'shooter', 'horror', 'idle', 'clicker', 'farm', 'driving', 'racing',
    'strategy', 'co-op', 'pvp', 'soul', 'garden', 'blade', 'ball', 'last', 'stand', 'rng',
    'grow', 'type', 'anime', 'defense', 'tower', 'simulator', 'tycoon'
  ]);

  // 游戏类型关键词
  private gameTypeKeywords = new Set([
    'simulator', 'tycoon', 'obby', 'rpg', 'survival', 'shooter', 'horror', 'idle', 'clicker',
    'farm', 'driving', 'racing', 'strategy', 'defense', 'battle', 'battlegrounds'
  ]);

  // 游戏题材关键词
  private gameThemeKeywords = new Set([
    'anime', 'soul', 'garden', 'blade', 'ball', 'tower', 'last', 'stand', 'rng', 'grow', 'type'
  ]);

  async calculateAIScore(keyword: string, videoCount: number, recentCount: number): Promise<number> {
    this.logger.log(`计算 ${keyword} 的 AI 分数`);

    let score = 0;

    // 基础分数（基于视频数量）
    score += Math.min(30, videoCount * 2);

    // 最近视频加分
    score += Math.min(20, recentCount * 3);

    // 游戏领域加分
    score += this.calculateGameDomainScore(keyword);

    // 词数加分（2-4 词短语得分更高）
    score += this.calculateWordCountScore(keyword);

    // 游戏名模式加分
    score += this.calculateGameNamePatternScore(keyword);

    // 确保分数在 0-100 之间
    return Math.min(100, Math.max(0, score));
  }

  async calculatePlatformScore(keyword: string, platforms: string[]): Promise<number> {
    this.logger.log(`计算 ${keyword} 的平台分数`);

    let score = 0;

    // 平台数量加分
    score += Math.min(20, platforms.length * 5);

    // 平台质量加分
    const platformQuality = this.calculatePlatformQuality(platforms);
    score += platformQuality;

    // 确保分数在 0-100 之间
    return Math.min(100, Math.max(0, score));
  }

  // 计算游戏领域分数
  private calculateGameDomainScore(keyword: string): number {
    const lowerKeyword = keyword.toLowerCase();
    let score = 0;

    // 检查是否包含游戏领域关键词
    const hasGameKeyword = Array.from(this.gameKeywords).some(key => lowerKeyword.includes(key));
    if (hasGameKeyword) {
      score += 15;
    }

    // 检查是否包含游戏类型关键词
    const hasGameTypeKeyword = Array.from(this.gameTypeKeywords).some(key => lowerKeyword.includes(key));
    if (hasGameTypeKeyword) {
      score += 10;
    }

    // 检查是否包含游戏题材关键词
    const hasGameThemeKeyword = Array.from(this.gameThemeKeywords).some(key => lowerKeyword.includes(key));
    if (hasGameThemeKeyword) {
      score += 10;
    }

    return score;
  }

  // 计算词数分数
  private calculateWordCountScore(keyword: string): number {
    const wordCount = keyword.split(' ').length;

    if (wordCount >= 2 && wordCount <= 4) {
      return 15;
    } else if (wordCount === 1) {
      return 0;
    } else {
      return 5;
    }
  }

  // 计算游戏名模式分数
  private calculateGameNamePatternScore(keyword: string): number {
    const lowerKeyword = keyword.toLowerCase();
    let score = 0;

    // 检查是否为常见游戏名模式
    const patterns = [
      /\s+(last|stand|soul|garden|blade|ball|rng|grow|type|defense|tower|simulator|tycoon)\s*$/i,
      /^(anime|tower|blade|grow|type|soul|sol)\s+/i,
      /\s+(defense|simulator|tycoon|battlegrounds|rpg|survival|shooter|horror|idle|clicker)\s*$/i
    ];

    const hasPattern = patterns.some(pattern => pattern.test(keyword));
    if (hasPattern) {
      score += 10;
    }

    return score;
  }

  // 计算平台质量
  private calculatePlatformQuality(platforms: string[]): number {
    let score = 0;

    // YouTube 平台质量高
    if (platforms.includes('youtube')) {
      score += 40;
    }

    // Google Trends 平台质量高
    if (platforms.includes('google_trends')) {
      score += 35;
    }

    // 其他平台质量中等
    const otherPlatforms = platforms.filter(p => p !== 'youtube' && p !== 'google_trends');
    score += Math.min(25, otherPlatforms.length * 10);

    return score;
  }
}
