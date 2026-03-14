import { Injectable } from '@nestjs/common';
import { normalizeKeyword } from '../common/utils/normalize-keyword.util';
import { DISCOVERY_CONFIG, GENERIC_KEYWORDS } from '../config/discovery.config';
import { PrismaService } from '../prisma/prisma.service';
import { RobloxDiscoverService } from '../sources/roblox/roblox-discover.service';
import { RobloxSearchService } from '../sources/roblox/roblox-search.service';

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
  robloxExists?: boolean | null;
  discoverMatch?: boolean | null;
  keywordQualityScore?: number | null;
  growthScore?: number | null;
  robloxExistsScore?: number | null;
  discoverScore?: number | null;
  freshnessScore?: number | null;
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

type ScoreBreakdown = {
  keywordQualityScore: number;
  growthScore: number;
  robloxExistsScore: number;
  discoverScore: number;
  freshnessScore: number;
  totalScore: number;
};

@Injectable()
export class TrendService {
  private static readonly RECENT_WINDOW_HOURS = 24;
  private static readonly FRESH_WINDOW_48_HOURS = 48;
  private static readonly FRESH_WINDOW_72_HOURS = 72;

  private readonly gameTypes = new Set([
    'tycoon',
    'simulator',
    'obby',
    'survival',
    'defense',
    'rng',
    'battlegrounds',
  ]);

  private readonly validSuffixes = new Set([
    'tycoon',
    'simulator',
    'obby',
    'survival',
    'defense',
    'rng',
    'battlegrounds',
  ]);
  private readonly genericKeywords = new Set<string>(GENERIC_KEYWORDS as readonly string[]);

  private readonly genericPenaltyKeywords = new Set([
    'pet simulator',
    'tap simulator',
    'game tycoon',
  ]);

  constructor(
    private readonly prisma: PrismaService,
    private readonly robloxDiscoverService: RobloxDiscoverService,
    private readonly robloxSearchService: RobloxSearchService,
  ) {}

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
    const normalizedLimit =
      typeof limit === 'number' && Number.isFinite(limit)
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

    const discoverGames = await this.robloxDiscoverService.fetchDiscoverGames();
    const discoverPool = new Set(discoverGames.map((item) => item.normalizedTitle));
    const trendCreateInputs = await Promise.all(
      newWords.map((item) => this.buildTrendCreateInput(item, discoverPool)),
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

  private async buildTrendCreateInput(
    item: NewWordForTrend,
    discoverPool: Set<string>,
  ) {
    const [counts, freshnessScore, robloxSearchResult] = await Promise.all([
      this.getKeywordCounts(item.keyword),
      this.calculateFreshnessScore(item.keyword),
      this.robloxSearchService.searchGame(item.keyword),
    ]);

    const growthRate = this.calculateGrowthRate(counts.recentCount, counts.totalCount);
    const discoverMatch = this.checkDiscoverMatch(item.keyword, discoverPool);
    const type = this.detectGameType(item.keyword);
    const robloxExists = robloxSearchResult.exists;
    const scoreBreakdown = this.calculateTrendScore({
      keyword: item.keyword,
      recentCount: counts.recentCount,
      totalCount: counts.totalCount,
      growthRate,
      robloxExists,
      discoverMatch,
      freshnessScore,
      type,
    });
    const stage = this.determineStage(
      scoreBreakdown.totalScore,
      growthRate,
      counts.recentCount,
      robloxExists,
      discoverMatch,
    );

    return {
      keyword: item.keyword,
      score: scoreBreakdown.totalScore,
      stage,
      type,
      source: item.source,
      region: item.region,
      aiInsight: this.buildInsight(item.keyword, stage, growthRate, robloxExists, discoverMatch),
      growthRate,
      recentCount: counts.recentCount,
      totalCount: counts.totalCount,
      robloxExists,
      discoverMatch,
      keywordQualityScore: scoreBreakdown.keywordQualityScore,
      growthScore: scoreBreakdown.growthScore,
      robloxExistsScore: scoreBreakdown.robloxExistsScore,
      discoverScore: scoreBreakdown.discoverScore,
      freshnessScore: scoreBreakdown.freshnessScore,
    };
  }

  private async getKeywordCounts(keyword: string): Promise<{
    recentCount: number;
    totalCount: number;
  }> {
    const normalizedKeyword = this.normalizeKeyword(keyword);
    const recentWindowStart = new Date(
      Date.now() - TrendService.RECENT_WINDOW_HOURS * 60 * 60 * 1000,
    );

    const [recentCount, totalCount] = await this.prisma.$transaction([
      this.prisma.newWord.count({
        where: {
          normalizedKeyword,
          firstSeenAt: {
            gte: recentWindowStart,
          },
        },
      }),
      this.prisma.newWord.count({
        where: {
          normalizedKeyword,
        },
      }),
    ]);

    return { recentCount, totalCount };
  }

  calculateGrowthRate(recentCount: number, totalCount: number): number {
    if (totalCount <= 0) {
      return 0;
    }

    return Number((recentCount / totalCount).toFixed(4));
  }

  async calculateFreshnessScore(keyword: string): Promise<number> {
    const normalizedKeyword = this.normalizeKeyword(keyword);
    const now = Date.now();
    const [count24, count48, count72] = await this.prisma.$transaction([
      this.prisma.newWord.count({
        where: {
          normalizedKeyword,
          firstSeenAt: {
            gte: new Date(now - TrendService.RECENT_WINDOW_HOURS * 60 * 60 * 1000),
          },
        },
      }),
      this.prisma.newWord.count({
        where: {
          normalizedKeyword,
          firstSeenAt: {
            gte: new Date(now - TrendService.FRESH_WINDOW_48_HOURS * 60 * 60 * 1000),
          },
        },
      }),
      this.prisma.newWord.count({
        where: {
          normalizedKeyword,
          firstSeenAt: {
            gte: new Date(now - TrendService.FRESH_WINDOW_72_HOURS * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    const freshnessScore = Math.min(
      100,
      count24 * 40 + Math.max(count48 - count24, 0) * 20 + Math.max(count72 - count48, 0) * 10,
    );

    return Number(freshnessScore.toFixed(2));
  }

  checkDiscoverMatch(keyword: string, discoverPool: Set<string>): boolean {
    return discoverPool.has(this.normalizeKeyword(keyword));
  }

  calculateKeywordQualityScore(keyword: string, type: string | null): number {
    const normalized = this.normalizeKeyword(keyword);
    const tokens = normalized.split(' ').filter(Boolean);
    let score = 55;

    if (tokens.length >= 3) {
      score += 15;
    } else if (tokens.length === 2) {
      score += 8;
    }

    if (type && this.validSuffixes.has(type)) {
      score += 20;
    }

    if (this.genericPenaltyKeywords.has(normalized)) {
      score -= 20;
    }

    if (tokens.some((token) => this.genericKeywords.has(token))) {
      score -= 10;
    }

    return Number(Math.max(20, Math.min(100, score)).toFixed(2));
  }

  calculateGrowthScore(recentCount: number, totalCount: number, growthRate: number): number {
    if (totalCount <= 0) {
      return 0;
    }

    const volumeScore = Math.min(100, totalCount * 8);
    const recentVolumeScore = Math.min(100, recentCount * 12);
    const rateScore = growthRate * 100;
    const score = volumeScore * 0.2 + recentVolumeScore * 0.3 + rateScore * 0.5;

    return Number(Math.max(0, Math.min(100, score)).toFixed(2));
  }

  calculateTrendScore(input: {
    keyword: string;
    recentCount: number;
    totalCount: number;
    growthRate: number;
    robloxExists: boolean;
    discoverMatch: boolean;
    freshnessScore: number;
    type: string | null;
  }): ScoreBreakdown {
    const keywordQualityScore = this.calculateKeywordQualityScore(input.keyword, input.type);
    const growthScore = this.calculateGrowthScore(
      input.recentCount,
      input.totalCount,
      input.growthRate,
    );
    const robloxExistsScore = input.robloxExists ? 100 : 0;
    const discoverScore = input.discoverMatch ? 100 : 0;
    const totalScore =
      keywordQualityScore * 0.25 +
      growthScore * 0.3 +
      robloxExistsScore * 0.15 +
      discoverScore * 0.2 +
      input.freshnessScore * 0.1;

    return {
      keywordQualityScore,
      growthScore,
      robloxExistsScore,
      discoverScore,
      freshnessScore: input.freshnessScore,
      totalScore: Number(Math.max(0, Math.min(100, totalScore)).toFixed(2)),
    };
  }

  determineStage(
    score: number,
    growthRate: number,
    recentCount: number,
    robloxExists: boolean,
    discoverMatch: boolean,
  ): string {
    if (
      score >= 80 &&
      growthRate >= 0.5 &&
      recentCount >= 5 &&
      (robloxExists || discoverMatch)
    ) {
      return 'exploding';
    }

    if (score >= 55 && growthRate >= 0.25) {
      return 'early';
    }

    return 'normal';
  }

  private buildInsight(
    keyword: string,
    stage: string,
    growthRate: number,
    robloxExists: boolean,
    discoverMatch: boolean,
  ): string {
    const growthPercent = Math.round(growthRate * 100);
    const robloxSignal = robloxExists ? 'Roblox search confirms it exists.' : 'Roblox search has no strong match yet.';
    const discoverSignal = discoverMatch ? 'It is visible in Roblox Discover.' : 'It is not matched in Roblox Discover.';

    if (stage === 'exploding') {
      return `${keyword} is showing strong breakout momentum with ${growthPercent}% growth concentration. ${robloxSignal} ${discoverSignal}`;
    }

    if (stage === 'early') {
      return `${keyword} is emerging with ${growthPercent}% growth concentration. ${robloxSignal} ${discoverSignal}`;
    }

    return `${keyword} is currently a baseline signal with ${growthPercent}% growth concentration. ${robloxSignal} ${discoverSignal}`;
  }

  detectGameType(keyword: string): string | null {
    const tokens = keyword.trim().split(/\s+/).filter(Boolean);
    if (!tokens.length) {
      return null;
    }

    const lastToken = tokens[tokens.length - 1].toLowerCase();
    return this.gameTypes.has(lastToken) ? lastToken : null;
  }

  normalizeKeyword(input: string): string {
    return normalizeKeyword(input);
  }

  private toApiView(item: TrendRecord): TrendApiView {
    return {
      ...item,
      type: item.type ?? null,
      growthRate: item.growthRate ?? null,
      recentCount: item.recentCount ?? null,
      totalCount: item.totalCount ?? null,
      robloxExists: item.robloxExists ?? false,
      discoverMatch: item.discoverMatch ?? false,
      keywordQualityScore: item.keywordQualityScore ?? null,
      growthScore: item.growthScore ?? null,
      robloxExistsScore: item.robloxExistsScore ?? null,
      discoverScore: item.discoverScore ?? null,
      freshnessScore: item.freshnessScore ?? null,
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
