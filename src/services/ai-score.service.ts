import { Injectable } from '@nestjs/common';

@Injectable()
export class AIScoreService {
  private readonly strongBoostKeywords = [
    'simulator',
    'idle',
    'tycoon',
    'sandbox',
    'roguelike',
    'rpg',
    'shooter',
    'defense',
    'survival',
    'adventure',
    'anime',
    'battle',
    'battlegrounds',
    'obby',
    'tower',
    'farm',
    'clicker',
    'rng',
    'soul',
    'ball',
    'garden'
  ];

  private readonly weakBoostKeywords = [
    'quest',
    'world',
    'hero',
    'legends',
    'training',
    'fighters',
    'monster',
    'pets',
    'dungeon',
    'raid',
    'wars'
  ];

  private readonly noiseKeywords = [
    'free',
    'update',
    'official',
    'version',
    'guide',
    'tips',
    'codes',
    'review',
    'best',
    'how',
    'roblox',
    'game',
    'games',
    'item',
    'items',
    'merch',
    'shirt',
    'shirts',
    'pants'
  ];

  calculateAIScore(keyword: string): number {
    const normalized = String(keyword || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s']/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const words = normalized.split(' ').filter(Boolean);

    let score = 45;

    // 1. 词数加权：2~4 词更像游戏名
    if (words.length === 2) score += 8;
    if (words.length === 3) score += 15;
    if (words.length === 4) score += 10;
    if (words.length >= 5) score -= 8;

    // 2. 强游戏词加分
    const strongMatches = words.filter(word => this.strongBoostKeywords.includes(word)).length;
    score += strongMatches * 8;

    // 3. 弱游戏词加分
    const weakMatches = words.filter(word => this.weakBoostKeywords.includes(word)).length;
    score += weakMatches * 4;

    // 4. 噪音词降分
    const noiseMatches = words.filter(word => this.noiseKeywords.includes(word)).length;
    score -= noiseMatches * 10;

    // 5. 特殊命名风格加分（像 Roblox 游戏名）
    if (normalized.includes("'s")) score += 6;
    if (/^[a-z0-9\s']+$/.test(normalized)) score += 2;

    // 6. 含纯数字降分
    if (/\b\d+\b/.test(normalized)) score -= 15;

    // 7. 稳定偏移，避免完全同分
    score += this.stableKeywordOffset(normalized);

    return Math.max(0, Math.min(100, score));
  }

  calculatePlatformScore(platforms: string[] | string): number {
    const rawPlatforms = Array.isArray(platforms)
      ? platforms
      : String(platforms || '')
        .split(',')
        .map(item => item.trim())
        .filter(Boolean);

    const uniquePlatforms = [...new Set(rawPlatforms.map(p => p.toLowerCase()))];

    let score = 0;

    for (const platform of uniquePlatforms) {
      if (platform === 'youtube') score += 35;
      else if (platform === 'google_trends') score += 35;
      else if (platform === 'reddit') score += 20;
      else if (platform === 'roblox') score += 25;
      else if (platform === 'steam') score += 15;
      else score += 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  calculatePredictionScore(
    growthRate: number,
    acceleration: number,
    platformScore: number,
    aiScore: number
  ): number {
    const safeGrowthRate = Number.isFinite(growthRate) ? growthRate : 0;
    const safeAcceleration = Number.isFinite(acceleration) ? acceleration : 0;
    const safePlatformScore = Number.isFinite(platformScore) ? platformScore : 0;
    const safeAiScore = Number.isFinite(aiScore) ? aiScore : 0;

    // 归一化
    const growthComponent = Math.min(35, Math.max(0, safeGrowthRate * 18));
    const accelerationComponent = Math.min(20, Math.max(0, safeAcceleration * 20));
    const platformComponent = Math.min(20, Math.max(0, safePlatformScore * 0.2));
    const aiComponent = Math.min(25, Math.max(0, safeAiScore * 0.25));

    const total =
      growthComponent +
      accelerationComponent +
      platformComponent +
      aiComponent;

    return Math.max(0, Math.min(100, total));
  }

  private stableKeywordOffset(keyword: string): number {
    let hash = 0;

    for (let i = 0; i < keyword.length; i++) {
      hash = (hash * 31 + keyword.charCodeAt(i)) % 9973;
    }

    // -4 到 +4 的稳定偏移
    return (hash % 9) - 4;
  }
}