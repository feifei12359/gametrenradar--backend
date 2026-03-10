import { Injectable } from '@nestjs/common';

@Injectable()
export class AIScoreService {
  private readonly boostKeywords = [
    'simulator',
    'idle',
    'tycoon',
    'sandbox',
    'roguelike',
    'rpg',
    'shooter',
    'defense',
    'survival',
    'adventure'
  ];

  calculateAIScore(keyword: string): number {
    let score = 50; // 基础分数
    
    // 检查关键词是否包含高潜力词汇
    const lowerKeyword = keyword.toLowerCase();
    
    this.boostKeywords.forEach(boostWord => {
      if (lowerKeyword.includes(boostWord)) {
        score += 10; // 每个高潜力词加10分
      }
    });
    
    // 限制分数范围
    return Math.min(100, Math.max(0, score));
  }

  calculatePlatformScore(platforms: string[]): number {
    // 平台数量越多，分数越高
    return platforms.length * 20;
  }

  calculatePredictionScore(
    growthRate: number,
    acceleration: number,
    platformScore: number,
    aiScore: number
  ): number {
    // 趋势评分公式
    const score = 
      growthRate * 40 +
      acceleration * 20 +
      platformScore * 0.2 +
      aiScore * 0.2;
    
    return Math.min(100, Math.max(0, score));
  }
}
