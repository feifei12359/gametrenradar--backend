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
  normalizedKeyword?: string | null;
  stage: string;
  type?: string | null;
  score: number;
  opportunityScore?: number | null;
  explosionProbability?: number | null;
  source: string | null;
  region: string | null;
  aiInsight: string | null;
  growthRate?: number | null;
  acceleration?: number | null;
  recentCount?: number | null;
  totalCount?: number | null;
  current24hCount?: number | null;
  previous24hCount?: number | null;
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
  debugVersion: string;
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
  accelerationScore: number;
  totalScore: number;
};

type TimelinePoint = {
  date: string;
  count: number;
};

type TimelineQueryRow = {
  date: Date;
  count: bigint | number;
};

@Injectable()
export class TrendService {
  private static readonly RECENT_WINDOW_HOURS = 24;
  private static readonly FRESH_WINDOW_48_HOURS = 48;
  private static readonly FRESH_WINDOW_72_HOURS = 72;
  private static readonly DEFAULT_TIMELINE_DAYS = 7;
  private static readonly MAX_TIMELINE_DAYS = 30;

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
  private readonly genericKeywords = new Set<string>(
    (GENERIC_KEYWORDS as readonly string[]).filter((keyword) => !this.validSuffixes.has(keyword)),
  );

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

    return trends.map((item: TrendRecord) => this.toApiView(item));
  }

  async getEarly(): Promise<TrendApiView[]> {
    const trends = await this.prisma.trend.findMany({
      where: { stage: 'early' },
      orderBy: { score: 'desc' },
    });

    return trends.map((item: TrendRecord) => this.toApiView(item));
  }

  async getAll(): Promise<TrendApiView[]> {
    const trends = await this.prisma.trend.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return trends.map((item: TrendRecord) => this.toApiView(item));
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

    return trends.map((item: TrendRecord) => this.toApiView(item));
  }

  async getTimeline(keyword: string, days = TrendService.DEFAULT_TIMELINE_DAYS): Promise<{
    keyword: string;
    days: number;
    points: TimelinePoint[];
  }> {
    const normalizedKeyword = this.normalizeKeyword(keyword);
    const normalizedDays = this.normalizeTimelineDays(days);
    const endDate = this.startOfUtcDay(new Date());
    const startDate = new Date(endDate);
    startDate.setUTCDate(startDate.getUTCDate() - (normalizedDays - 1));
    const nextDay = new Date(endDate);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);

    const rows = await this.prisma.$queryRaw<TimelineQueryRow[]>`
      SELECT DATE_TRUNC('day', "seenAt") AS date, COUNT(*)::bigint AS count
      FROM "KeywordEvent"
      WHERE "normalizedKeyword" = ${normalizedKeyword}
        AND "seenAt" >= ${startDate}
        AND "seenAt" < ${nextDay}
      GROUP BY DATE_TRUNC('day', "seenAt")
      ORDER BY DATE_TRUNC('day', "seenAt") ASC
    `;

    const countByDate = new Map<string, number>(
      rows.map((row: TimelineQueryRow) => [this.toIsoDateString(row.date), Number(row.count)]),
    );

    const points: TimelinePoint[] = [];
    for (let index = 0; index < normalizedDays; index += 1) {
      const date = new Date(startDate);
      date.setUTCDate(startDate.getUTCDate() + index);
      const dateKey = this.toIsoDateString(date);

      points.push({
        date: dateKey,
        count: countByDate.get(dateKey) ?? 0,
      });
    }

    return {
      keyword,
      days: normalizedDays,
      points,
    };
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
    const discoverExactSet = new Set(discoverGames.map((item) => item.normalizedTitle));
    const discoverList = [...discoverExactSet];
    const robloxSearchCache = new Map<
      string,
      Promise<{ exists: boolean; title?: string; normalizedTitle?: string }>
    >();
    const trendCreateInputs = await Promise.all(
      newWords.map((item) =>
        this.buildTrendCreateInput(item, discoverExactSet, discoverList, robloxSearchCache),
      ),
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
    discoverExactSet: Set<string>,
    discoverList: string[],
    robloxSearchCache: Map<
      string,
      Promise<{ exists: boolean; title?: string; normalizedTitle?: string }>
    >,
  ) {
    const normalizedKeyword = this.normalizeKeyword(item.keyword);
    const robloxSearchResultPromise =
      robloxSearchCache.get(normalizedKeyword) ??
      this.robloxSearchService.searchGame(normalizedKeyword);

    if (!robloxSearchCache.has(normalizedKeyword)) {
      robloxSearchCache.set(normalizedKeyword, robloxSearchResultPromise);
    }

    const [counts, freshnessScore, robloxSearchResult] = await Promise.all([
      this.getKeywordCounts(item.keyword),
      this.calculateFreshnessScore(item.keyword),
      robloxSearchResultPromise,
    ]);

    const growthRate = this.calculateGrowthRate(counts.recentCount, counts.totalCount);
    const acceleration = this.calculateAcceleration(
      counts.current24hCount,
      counts.previous24hCount,
    );
    const discoverMatch = this.checkDiscoverMatch(item.keyword, discoverExactSet, discoverList);
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
      acceleration,
      type,
    });
    const stage = this.determineStage(
      scoreBreakdown.totalScore,
      growthRate,
      acceleration,
      counts.recentCount,
    );
    const opportunityScore = this.calculateOpportunityScore({
      stage,
      robloxExists,
      discoverMatch,
      growthRate,
    });
    const explosionProbability = this.calculateExplosionProbability({
      stage,
      growthRate,
      acceleration,
      opportunityScore,
      robloxExists,
      discoverMatch,
    });

    return {
      keyword: item.keyword,
      normalizedKeyword,
      score: scoreBreakdown.totalScore,
      opportunityScore,
      explosionProbability,
      stage,
      type,
      source: item.source,
      region: item.region,
      aiInsight: this.buildInsight(item.keyword, stage, growthRate, robloxExists, discoverMatch),
      growthRate,
      acceleration,
      recentCount: counts.recentCount,
      totalCount: counts.totalCount,
      current24hCount: counts.current24hCount,
      previous24hCount: counts.previous24hCount,
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
    current24hCount: number;
    previous24hCount: number;
    recentCount: number;
    totalCount: number;
  }> {
    const normalizedKeyword = this.normalizeKeyword(keyword);
    const now = Date.now();
    const current24hStart = new Date(now - TrendService.RECENT_WINDOW_HOURS * 60 * 60 * 1000);
    const previous24hStart = new Date(
      now - TrendService.FRESH_WINDOW_48_HOURS * 60 * 60 * 1000,
    );

    const [current24hCount, previous24hCount, totalCount] = await this.prisma.$transaction([
      this.prisma.keywordEvent.count({
        where: {
          normalizedKeyword,
          seenAt: {
            gte: current24hStart,
          },
        },
      }),
      this.prisma.keywordEvent.count({
        where: {
          normalizedKeyword,
          seenAt: {
            gte: previous24hStart,
            lt: current24hStart,
          },
        },
      }),
      this.prisma.keywordEvent.count({
        where: {
          normalizedKeyword,
        },
      }),
    ]);

    return {
      current24hCount,
      previous24hCount,
      recentCount: current24hCount,
      totalCount,
    };
  }

  calculateGrowthRate(recentCount: number, totalCount: number): number {
    if (totalCount <= 0) {
      return 0;
    }

    return Number((recentCount / totalCount).toFixed(4));
  }

  calculateAcceleration(current24hCount: number, previous24hCount: number): number {
    const baseline = Math.max(previous24hCount, 1);
    const acceleration = (current24hCount - previous24hCount) / baseline;
    return Number(acceleration.toFixed(2));
  }

  async calculateFreshnessScore(keyword: string): Promise<number> {
    const normalizedKeyword = this.normalizeKeyword(keyword);
    const now = Date.now();
    const [count24, count48, count72] = await this.prisma.$transaction([
      this.prisma.keywordEvent.count({
        where: {
          normalizedKeyword,
          seenAt: {
            gte: new Date(now - TrendService.RECENT_WINDOW_HOURS * 60 * 60 * 1000),
          },
        },
      }),
      this.prisma.keywordEvent.count({
        where: {
          normalizedKeyword,
          seenAt: {
            gte: new Date(now - TrendService.FRESH_WINDOW_48_HOURS * 60 * 60 * 1000),
          },
        },
      }),
      this.prisma.keywordEvent.count({
        where: {
          normalizedKeyword,
          seenAt: {
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

  checkDiscoverMatch(
    keyword: string,
    discoverExactSet: Set<string>,
    discoverList: string[],
  ): boolean {
    const normalizedKeyword = this.normalizeKeyword(keyword);

    if (discoverExactSet.has(normalizedKeyword)) {
      return true;
    }

    return discoverList.some((title) => {
      return title.includes(normalizedKeyword) || normalizedKeyword.includes(title);
    });
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
    acceleration: number;
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
    const accelerationScore = this.calculateAccelerationScore(input.acceleration);
    const totalScore =
      keywordQualityScore * 0.22 +
      growthScore * 0.25 +
      robloxExistsScore * 0.15 +
      discoverScore * 0.18 +
      input.freshnessScore * 0.1 +
      accelerationScore * 0.1;

    return {
      keywordQualityScore,
      growthScore,
      robloxExistsScore,
      discoverScore,
      freshnessScore: input.freshnessScore,
      accelerationScore,
      totalScore: Number(Math.max(0, Math.min(100, totalScore)).toFixed(2)),
    };
  }

  calculateAccelerationScore(acceleration: number): number {
    if (acceleration <= 0) {
      return 0;
    }

    if (acceleration >= 2) {
      return 100;
    }

    return Number(((acceleration / 2) * 100).toFixed(2));
  }

  determineStage(
    score: number,
    growthRate: number,
    acceleration: number,
    recentCount: number,
  ): string {
    if (score >= 75 && growthRate >= 0.5 && acceleration >= 1.0 && recentCount >= 5) {
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
    const robloxSignal = robloxExists
      ? 'Roblox 搜索已确认该游戏存在。'
      : 'Roblox 搜索暂未确认该游戏。';
    const discoverSignal = discoverMatch
      ? '该关键词已命中 Roblox Discover。'
      : '该关键词暂未命中 Roblox Discover。';

    if (stage === 'exploding') {
      return `${keyword} 当前呈现明显爆发趋势，近 24 小时增长占比约 ${growthPercent}%。${robloxSignal}${discoverSignal}`;
    }

    if (stage === 'early') {
      return `${keyword} 当前处于早期增长阶段，近 24 小时增长占比约 ${growthPercent}%。${robloxSignal}${discoverSignal}`;
    }

    return `${keyword} 当前仍属于基础观察信号，近 24 小时增长占比约 ${growthPercent}%。${robloxSignal}${discoverSignal}`;
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

  calculateOpportunityScore(input: {
    stage: string;
    robloxExists: boolean;
    discoverMatch: boolean;
    growthRate: number;
  }): number {
    const stageScore =
      input.stage === 'exploding' ? 40 : input.stage === 'early' ? 30 : 10;
    const robloxScore = input.robloxExists ? 25 : 5;
    const discoverScore = input.discoverMatch ? 20 : 0;
    const growthScore =
      input.growthRate > 0.6 ? 15 : input.growthRate > 0.3 ? 10 : input.growthRate > 0.1 ? 5 : 0;

    return Math.min(100, stageScore + robloxScore + discoverScore + growthScore);
  }

  calculateExplosionProbability(input: {
    stage: string;
    growthRate: number;
    acceleration: number;
    opportunityScore: number;
    robloxExists: boolean;
    discoverMatch: boolean;
  }): number {
    let score = 0;

    if (input.stage === 'exploding') {
      score += 35;
    } else if (input.stage === 'early') {
      score += 20;
    } else {
      score += 5;
    }

    if (input.growthRate >= 0.8) {
      score += 20;
    } else if (input.growthRate >= 0.5) {
      score += 15;
    } else if (input.growthRate >= 0.3) {
      score += 10;
    } else if (input.growthRate >= 0.1) {
      score += 5;
    }

    if (input.acceleration >= 2) {
      score += 20;
    } else if (input.acceleration >= 1) {
      score += 15;
    } else if (input.acceleration >= 0.5) {
      score += 10;
    } else if (input.acceleration > 0) {
      score += 5;
    }

    if (input.opportunityScore >= 80) {
      score += 15;
    } else if (input.opportunityScore >= 60) {
      score += 10;
    } else if (input.opportunityScore >= 40) {
      score += 5;
    }

    if (input.robloxExists) {
      score += 5;
    }

    if (input.discoverMatch) {
      score += 5;
    }

    return Math.min(100, score);
  }

  private normalizeTimelineDays(days?: number): number {
    if (typeof days !== 'number' || !Number.isFinite(days)) {
      return TrendService.DEFAULT_TIMELINE_DAYS;
    }

    const integerDays = Math.trunc(days);
    if (integerDays <= 0) {
      return TrendService.DEFAULT_TIMELINE_DAYS;
    }

    return Math.min(integerDays, TrendService.MAX_TIMELINE_DAYS);
  }

  private startOfUtcDay(date: Date): Date {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  }

  private toIsoDateString(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private toApiView(item: TrendRecord): TrendApiView {
    const normalizedKeyword = item.normalizedKeyword ?? this.normalizeKeyword(item.keyword);
    const growthRate = item.growthRate ?? 0;
    const acceleration = item.acceleration ?? 0;
    const robloxExists = item.robloxExists ?? false;
    const discoverMatch = item.discoverMatch ?? false;
    const opportunityScore =
      item.opportunityScore ??
      this.calculateOpportunityScore({
        stage: item.stage,
        robloxExists,
        discoverMatch,
        growthRate,
      });
    const explosionProbability =
      item.explosionProbability ??
      this.calculateExplosionProbability({
        stage: item.stage,
        growthRate,
        acceleration,
        opportunityScore,
        robloxExists,
        discoverMatch,
      });

    return {
      ...item,
      debugVersion: 'trend-top-v6-force',
      normalizedKeyword,
      type: item.type ?? null,
      growthRate: item.growthRate ?? null,
      acceleration,
      opportunityScore,
      explosionProbability,
      recentCount: item.recentCount ?? null,
      totalCount: item.totalCount ?? null,
      current24hCount: item.current24hCount ?? null,
      previous24hCount: item.previous24hCount ?? null,
      robloxExists,
      discoverMatch,
      keywordQualityScore: item.keywordQualityScore ?? null,
      growthScore: item.growthScore ?? null,
      robloxExistsScore: item.robloxExistsScore ?? null,
      discoverScore: item.discoverScore ?? null,
      freshnessScore: item.freshnessScore ?? null,
      prediction_score: item.score,
      growth_rate: growthRate,
      platform_score: Number((item.score / 100).toFixed(2)),
      ai_score: Number((Math.min(item.score + 5, 100) / 100).toFixed(2)),
      platforms: item.source ?? 'youtube',
      first_seen_at: item.createdAt,
    };
  }

  // TODO: FutureYoutubeSource - enrich trend confidence with YouTube title velocity.
  // TODO: FutureRobloxSource - validate gameplay popularity with Roblox player metrics.
  // TODO: FutureTrendsSource - verify regional demand with Google Trends signals.
}
