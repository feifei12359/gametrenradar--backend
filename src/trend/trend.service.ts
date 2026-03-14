import { Injectable } from '@nestjs/common';
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

    const createdTrends = await this.prisma.$transaction(
      newWords.map((item) =>
        this.prisma.trend.create({
          data: this.buildTrendCreateInput(item),
        }),
      ),
    );

    return {
      created: createdTrends.length,
      trends: createdTrends.map((item: TrendRecord) => this.toApiView(item)),
    };
  }

  private buildTrendCreateInput(item: NewWordForTrend) {
    const stage = this.resolveStage(item.score);
    const type = this.detectGameType(item.keyword);

    return {
      keyword: item.keyword,
      score: item.score,
      stage,
      type,
      source: item.source,
      region: item.region,
      aiInsight: this.buildInsight(item.keyword, stage),
    };
  }

  private resolveStage(score: number): string {
    if (score >= 80) {
      return 'exploding';
    }

    if (score >= 50) {
      return 'early';
    }

    return 'normal';
  }

  private buildInsight(keyword: string, stage: string): string {
    if (stage === 'exploding') {
      return `${keyword} is showing strong breakout momentum in the MVP pipeline.`;
    }

    if (stage === 'early') {
      return `${keyword} is emerging and should be monitored for sustained growth.`;
    }

    return `${keyword} is tracked as a baseline signal for future scoring updates.`;
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
      prediction_score: item.score,
      growth_rate: Number((item.score / 100).toFixed(2)),
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
