import { Injectable, Logger } from '@nestjs/common';
import { DISCOVERY_CONFIG } from '../config/discovery.config';
import { PrismaService } from '../prisma/prisma.service';

type NewWordForTrend = {
  keyword: string;
  source: string | null;
  region: string | null;
  score: number;
};

type TrendRecord = {
  id: string;
  keyword: string;
  stage: string;
  type?: string | null;
  score: number;
  source: string | null;
  region: string | null;
  aiInsight: string | null;
  growthRate?: number | null;
  recentCount?: number | null;
  totalCount?: number | null;
  createdAt: Date;
  updatedAt: Date;
};

type TrendApiView = TrendRecord & {
  prediction_score: number;
  growth_rate: number;
  platform_score: number;
  ai_score: number;
  acceleration: number;
  platforms: string;
  first_seen_at: Date;
};

@Injectable()
export class TrendService {
  private static readonly RECENT_WINDOW_HOURS = 24;
  private readonly logger = new Logger(TrendService.name);
  private readonly gameTypes = new Set([
    'tycoon',
    'simulator',
    'obby',
    'survival',
    'defense',
    'rng',
    'battlegrounds',
  ]);

  constructor(private readonly prisma: PrismaService) {}

  async getExploding(): Promise<TrendApiView[]> {
    const trends = await this.prisma.trend.findMany({
      where: { stage: 'exploding' },
      orderBy: { score: 'desc' },
    });

    return trends.map((item) => this.toApiView(item));
  }

  async getEarly(): Promise<TrendApiView[]> {
    const trends = await this.prisma.trend.findMany({
      where: { stage: 'early' },
      orderBy: { score: 'desc' },
    });

    return trends.map((item) => this.toApiView(item));
  }

  async getAll(): Promise<TrendApiView[]> {
    const trends = await this.prisma.trend.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return trends.map((item) => this.toApiView(item));
  }

  async getTop(limit?: number): Promise<TrendApiView[]> {
    const normalizedLimit = typeof limit === 'number' && Number.isFinite(limit)
      ? Math.min(Math.max(limit, 1), DISCOVERY_CONFIG.filtering.maxAcceptedNewWords)
      : DISCOVERY_CONFIG.filtering.dashboardTopLimit;

    const trends = await this.prisma.trend.findMany({
      orderBy: [{ score: 'desc' }, { createdAt: 'desc' }],
      take: normalizedLimit,
    });

    return trends.map((item) => this.toApiView(item));
  }

  async clearAll(): Promise<{ count: number }> {
    const result = await this.prisma.trend.deleteMany();
    return { count: result.count };
  }

  async generateFromNewWords(newWords: NewWordForTrend[]): Promise<{
    created: number;
    trends: TrendApiView[];
  }> {
    if (!newWords.length) {
      return { created: 0, trends: [] };
    }

    await this.prisma.trend.deleteMany();

    const trendCreateInputs = await Promise.all(
      newWords.map((item) => this.buildTrendCreateInput(item)),
    );

    const createdTrends = await this.prisma.$transaction(
      trendCreateInputs.map((input) =>
        this.prisma.trend.create({
          data: input,
        }),
      ),
    );

    return {
      created: createdTrends.length,
      trends: createdTrends.map((item: TrendRecord) => this.toApiView(item)),
    };
  }

  private async buildTrendCreateInput(item: NewWordForTrend) {
    const [{ recentCount, totalCount }, existsOnRoblox] = await Promise.all([
      this.getKeywordCounts(item.keyword),
      this.checkRobloxGameExists(item.keyword),
    ]);
    const growthRate = this.calculateGrowthRate(recentCount, totalCount);
    const score = this.calculateTrendScore(item.score, growthRate, existsOnRoblox);
    const stage = this.determineStage(growthRate, recentCount, totalCount);
    const type = this.detectGameType(item.keyword);

    return {
      keyword: item.keyword,
      score,
      stage,
      type,
      source: item.source,
      region: item.region,
      aiInsight: this.buildInsight(item.keyword, stage, growthRate),
      growthRate,
      recentCount,
      totalCount,
    };
  }

  private async getKeywordCounts(keyword: string): Promise<{
    recentCount: number;
    totalCount: number;
  }> {
    const recentWindowStart = new Date(
      Date.now() - TrendService.RECENT_WINDOW_HOURS * 60 * 60 * 1000,
    );

    const [recentCount, totalCount] = await this.prisma.$transaction([
      this.prisma.newWord.count({
        where: {
          keyword,
          firstSeenAt: {
            gte: recentWindowStart,
          },
        },
      }),
      this.prisma.newWord.count({
        where: {
          keyword,
        },
      }),
    ]);

    return {
      recentCount,
      totalCount,
    };
  }

  calculateGrowthRate(recentCount: number, totalCount: number): number {
    if (totalCount <= 0) {
      return 0;
    }

    return Number((recentCount / totalCount).toFixed(4));
  }

  async checkRobloxGameExists(keyword: string): Promise<boolean> {
    const url = `https://www.roblox.com/search/games?keyword=${encodeURIComponent(keyword)}`;

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; GameTrendRadar/1.0)',
          Accept: 'text/html,application/xhtml+xml',
        },
      });

      if (!response.ok) {
        this.logger.warn(`Roblox existence check failed for "${keyword}" with ${response.status}`);
        return false;
      }

      const html = await response.text();
      const normalizedHtml = html.toLowerCase();
      const normalizedKeyword = keyword.trim().toLowerCase();

      return (
        normalizedHtml.includes('/games/') ||
        normalizedHtml.includes('game-card') ||
        normalizedHtml.includes('game-tile') ||
        normalizedHtml.includes(normalizedKeyword)
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      this.logger.warn(`Roblox existence check failed for "${keyword}": ${message}`);
      return false;
    }
  }

  calculateTrendScore(baseScore: number, growthRate: number, existsOnRoblox: boolean): number {
    const growthScore = growthRate * 100;
    const robloxExistsScore = existsOnRoblox ? 20 : 0;
    const weightedScore =
      baseScore * 0.5 + growthScore * 0.3 + robloxExistsScore * 0.2;

    return Number(weightedScore.toFixed(2));
  }

  determineStage(growthRate: number, recentCount: number, totalCount: number): string {
    if (totalCount < 5) {
      return 'early';
    }

    if (growthRate >= 0.6 && recentCount >= 6) {
      return 'exploding';
    }

    if (growthRate >= 0.3) {
      return 'early';
    }

    return 'normal';
  }

  private buildInsight(keyword: string, stage: string, growthRate: number): string {
    const growthPercent = Math.round(growthRate * 100);

    if (stage === 'exploding') {
      return `${keyword} is showing strong breakout momentum with ${growthPercent}% recent growth concentration.`;
    }

    if (stage === 'early') {
      return `${keyword} is emerging with ${growthPercent}% recent growth concentration and should be monitored.`;
    }

    return `${keyword} is currently a baseline signal with ${growthPercent}% recent growth concentration.`;
  }

  detectGameType(keyword: string): string | null {
    const tokens = keyword.trim().split(/\s+/).filter(Boolean);
    if (!tokens.length) {
      return null;
    }

    const lastToken = tokens[tokens.length - 1].toLowerCase();
    return this.gameTypes.has(lastToken) ? lastToken : null;
  }

  private toApiView(item: TrendRecord): TrendApiView {
    return {
      ...item,
      type: item.type ?? null,
      growthRate: item.growthRate ?? null,
      recentCount: item.recentCount ?? null,
      totalCount: item.totalCount ?? null,
      prediction_score: item.score,
      growth_rate: item.growthRate ?? 0,
      platform_score: Number((item.score / 100).toFixed(2)),
      ai_score: Number((Math.min(item.score + 5, 100) / 100).toFixed(2)),
      acceleration: Number((item.score / 120).toFixed(2)),
      platforms: item.source ?? 'youtube',
      first_seen_at: item.createdAt,
    };
  }

  // TODO: FutureYoutubeSource - enrich trend confidence with YouTube title velocity.
  // TODO: FutureRobloxSource - validate gameplay popularity with Roblox player metrics.
  // TODO: FutureTrendsSource - verify regional demand with Google Trends signals.
}
