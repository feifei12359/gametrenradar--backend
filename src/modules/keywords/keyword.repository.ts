import { Injectable, Logger } from '@nestjs/common';
import {
  HistoricalKeywordStat,
  Keyword,
  KeywordScore,
  KeywordStage,
  Prisma,
  RegionCode,
  SignalSource,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class KeywordRepository {
  private readonly logger = new Logger(KeywordRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async upsertKeyword(params: {
    canonicalName: string;
    displayName: string;
    region: RegionCode;
    seenAt: Date;
    isGeneric?: boolean;
  }): Promise<Keyword> {
    const existing = await this.prisma.keyword.findUnique({
      where: {
        canonical_name_region: {
          canonical_name: params.canonicalName,
          region: params.region,
        },
      },
    });

    if (existing) {
      return this.prisma.keyword.update({
        where: { id: existing.id },
        data: {
          display_name: params.displayName,
          last_seen_at: params.seenAt,
          is_generic: params.isGeneric ?? existing.is_generic,
        },
      });
    }

    return this.prisma.keyword.create({
      data: {
        canonical_name: params.canonicalName,
        display_name: params.displayName,
        first_seen_at: params.seenAt,
        last_seen_at: params.seenAt,
        region: params.region,
        is_generic: params.isGeneric ?? false,
      },
    });
  }

  async createAlias(keywordId: string, rawText: string, source: SignalSource) {
    await this.prisma.keywordAlias.upsert({
      where: {
        keyword_id_raw_text: {
          keyword_id: keywordId,
          raw_text: rawText,
        },
      },
      update: {},
      create: {
        keyword_id: keywordId,
        raw_text: rawText,
        source,
      },
    });
  }

  async createYoutubeSignal(data: Prisma.YoutubeSignalUncheckedCreateInput) {
    try {
      return await this.prisma.youtubeSignal.create({ data });
    } catch (error) {
      this.logger.debug(
        `Skip duplicate YouTube signal for ${data.video_id}/${data.keyword_raw}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return null;
    }
  }

  async createGenericSample(data: {
    region: RegionCode;
    rawText: string;
    normalizedText: string;
    reason: string;
    sourceTitle: string;
    queryTerm: string;
  }) {
    return this.prisma.genericKeywordSample.create({
      data: {
        region: data.region,
        raw_text: data.rawText,
        normalized_text: data.normalizedText,
        reason: data.reason,
        source_title: data.sourceTitle,
        query_term: data.queryTerm,
      },
    });
  }

  async createRobloxValidation(data: Prisma.RobloxValidationUncheckedCreateInput) {
    return this.prisma.robloxValidation.create({ data });
  }

  async createTrendsValidation(data: Prisma.TrendsValidationUncheckedCreateInput) {
    return this.prisma.trendsValidation.create({ data });
  }

  async createKeywordScore(data: Prisma.KeywordScoreUncheckedCreateInput) {
    return this.prisma.keywordScore.create({ data });
  }

  async updateKeywordCounters(keywordId: string) {
    const [youtubeCount, robloxCount, trendsCount] = await Promise.all([
      this.prisma.youtubeSignal.count({ where: { keyword_id: keywordId } }),
      this.prisma.robloxValidation.count({ where: { keyword_id: keywordId } }),
      this.prisma.trendsValidation.count({ where: { keyword_id: keywordId } }),
    ]);

    return this.prisma.keyword.update({
      where: { id: keywordId },
      data: {
        signal_count: youtubeCount + (robloxCount > 0 ? 1 : 0) + (trendsCount > 0 ? 1 : 0),
        youtube_signal_count: youtubeCount,
        roblox_signal_count: robloxCount,
        trends_signal_count: trendsCount,
      },
    });
  }

  async updateKeywordStage(keywordId: string, stage: KeywordStage) {
    return this.prisma.keyword.update({
      where: { id: keywordId },
      data: { stage },
    });
  }

  async getKeywordById(id: string) {
    return this.prisma.keyword.findUnique({
      where: { id },
      include: {
        aliases: true,
        youtube_signals: {
          orderBy: { published_at: 'desc' },
          take: 20,
        },
        roblox_validations: {
          orderBy: { validated_at: 'desc' },
          take: 5,
        },
        trends_validations: {
          orderBy: { validated_at: 'desc' },
          take: 5,
        },
        keyword_scores: {
          orderBy: { calculated_at: 'desc' },
          take: 1,
        },
      },
    });
  }

  async getLatestScoreMap(keywordIds: string[]) {
    const scores = await this.prisma.keywordScore.findMany({
      where: { keyword_id: { in: keywordIds } },
      orderBy: { calculated_at: 'desc' },
    });

    const latest = new Map<string, KeywordScore>();
    for (const score of scores) {
      if (!latest.has(score.keyword_id)) {
        latest.set(score.keyword_id, score);
      }
    }

    return latest;
  }

  async findKeywords(params: {
    region?: RegionCode;
    stage?: KeywordStage;
    hours?: number;
    orderBy?: 'trend_score' | 'opportunity_score' | 'first_seen_at';
    take?: number;
  }) {
    const where: Prisma.KeywordWhereInput = {
      is_generic: false,
      ...(params.region ? { region: params.region } : {}),
      ...(params.stage ? { stage: params.stage } : {}),
      ...(params.hours
        ? {
            first_seen_at: {
              gte: new Date(Date.now() - params.hours * 60 * 60 * 1000),
            },
          }
        : {}),
    };

    const keywords = await this.prisma.keyword.findMany({
      where,
      include: {
        youtube_signals: true,
        keyword_scores: {
          orderBy: { calculated_at: 'desc' },
          take: 1,
        },
        roblox_validations: {
          orderBy: { validated_at: 'desc' },
          take: 1,
        },
      },
      take: params.take ?? 100,
      orderBy: { last_seen_at: 'desc' },
    });

    const sortKey = params.orderBy ?? 'trend_score';
    return keywords.sort((a, b) => {
      const scoreA = a.keyword_scores[0];
      const scoreB = b.keyword_scores[0];

      if (sortKey === 'first_seen_at') {
        return b.first_seen_at.getTime() - a.first_seen_at.getTime();
      }

      const valueA =
        sortKey === 'opportunity_score'
          ? scoreA?.opportunity_score ?? 0
          : scoreA?.trend_score ?? 0;
      const valueB =
        sortKey === 'opportunity_score'
          ? scoreB?.opportunity_score ?? 0
          : scoreB?.trend_score ?? 0;
      return valueB - valueA;
    });
  }

  async getRegionsSummary() {
    const rows = await this.prisma.keyword.groupBy({
      by: ['region', 'stage'],
      where: { is_generic: false },
      _count: { _all: true },
    });

    const summary = new Map<
      RegionCode,
      { region: RegionCode; NEW: number; EARLY: number; EXPLODING: number }
    >();

    for (const row of rows) {
      const existing = summary.get(row.region) ?? {
        region: row.region,
        NEW: 0,
        EARLY: 0,
        EXPLODING: 0,
      };

      if (row.stage === KeywordStage.NEW) existing.NEW = row._count._all;
      if (row.stage === KeywordStage.EARLY) existing.EARLY = row._count._all;
      if (row.stage === KeywordStage.EXPLODING) existing.EXPLODING = row._count._all;
      summary.set(row.region, existing);
    }

    return Array.from(summary.values());
  }

  async getGenericKeywordSamples(region?: RegionCode) {
    return this.prisma.genericKeywordSample.findMany({
      where: region ? { region } : undefined,
      orderBy: { created_at: 'desc' },
      take: 100,
    });
  }

  async upsertHistoricalStat(
    canonicalName: string,
    region: RegionCode,
    data: Omit<HistoricalKeywordStat, 'id' | 'canonical_name' | 'region' | 'updated_at'>,
  ) {
    return this.prisma.historicalKeywordStat.upsert({
      where: {
        canonical_name_region: {
          canonical_name: canonicalName,
          region,
        },
      },
      update: {
        first_seen_at: data.first_seen_at,
        last_seen_at: data.last_seen_at,
        total_mentions_7d: data.total_mentions_7d,
        total_mentions_30d: data.total_mentions_30d,
        total_mentions_90d: data.total_mentions_90d,
        total_regions: data.total_regions,
        is_legacy_keyword: data.is_legacy_keyword,
      },
      create: {
        canonical_name: canonicalName,
        region,
        first_seen_at: data.first_seen_at,
        last_seen_at: data.last_seen_at,
        total_mentions_7d: data.total_mentions_7d,
        total_mentions_30d: data.total_mentions_30d,
        total_mentions_90d: data.total_mentions_90d,
        total_regions: data.total_regions,
        is_legacy_keyword: data.is_legacy_keyword,
      },
    });
  }

  async getHistoricalStat(canonicalName: string, region: RegionCode) {
    return this.prisma.historicalKeywordStat.findUnique({
      where: {
        canonical_name_region: {
          canonical_name: canonicalName,
          region,
        },
      },
    });
  }

  async listKeywordsForScoring(region?: RegionCode) {
    return this.prisma.keyword.findMany({
      where: {
        is_generic: false,
        ...(region ? { region } : {}),
      },
      include: {
        youtube_signals: true,
        roblox_validations: {
          orderBy: { validated_at: 'desc' },
          take: 1,
        },
        trends_validations: {
          orderBy: { validated_at: 'desc' },
          take: 1,
        },
      },
    });
  }
}
