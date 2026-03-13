import { Injectable } from '@nestjs/common';
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

  async getTop(limit = 10): Promise<TrendApiView[]> {
    const normalizedLimit = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 100) : 10;

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

    return {
      keyword: item.keyword,
      score: item.score,
      stage,
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

  private toApiView(item: TrendRecord): TrendApiView {
    return {
      ...item,
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
