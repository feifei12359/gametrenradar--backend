import { Injectable, Logger } from '@nestjs/common';
import { KeywordStage, RegionCode, SignalSource } from '@prisma/client';
import {
  DEFAULT_REGION,
  TARGET_REGIONS,
  YOUTUBE_DISCOVERY_QUERIES,
} from '../discovery/discovery.constants';
import { KeywordExtractionService } from '../modules/keywords/keyword-extraction.service';
import { KeywordFilterService } from '../modules/keywords/keyword-filter.service';
import { KeywordRepository } from '../modules/keywords/keyword.repository';
import { KeywordScoringService } from './keyword-scoring.service';
import { RobloxValidationService } from './roblox-validation.service';
import { TrendsValidationService } from './trends-validation.service';
import { YoutubeCrawlerService } from './youtube-crawler.service';
import { YoutubeEnrichmentService } from './youtube-enrichment.service';

@Injectable()
export class DiscoveryPipelineService {
  private readonly logger = new Logger(DiscoveryPipelineService.name);

  constructor(
    private readonly youtubeCrawlerService: YoutubeCrawlerService,
    private readonly youtubeEnrichmentService: YoutubeEnrichmentService,
    private readonly keywordExtractionService: KeywordExtractionService,
    private readonly keywordFilterService: KeywordFilterService,
    private readonly robloxValidationService: RobloxValidationService,
    private readonly trendsValidationService: TrendsValidationService,
    private readonly keywordScoringService: KeywordScoringService,
    private readonly keywordRepository: KeywordRepository,
  ) {}

  async runDiscovery(params?: {
    region?: RegionCode;
    query?: string;
    hours?: number;
  }) {
    const regions =
      params?.region && params.region !== RegionCode.GLOBAL
        ? [params.region]
        : TARGET_REGIONS;

    const results = [];
    for (const region of regions) {
      results.push(await this.runDiscoveryForRegion(region, params?.query, params?.hours ?? 72));
    }

    return {
      success: true,
      regions: results,
    };
  }

  async runDiscoveryForRegion(region: RegionCode = DEFAULT_REGION, query?: string, hours = 72) {
    this.logger.log(`Running discovery pipeline for region=${region}, hours=${hours}`);
    const videos = await this.youtubeCrawlerService.crawlRecentVideos({ region, query, hours });
    const processedKeywordIds = new Set<string>();
    let genericSamples = 0;

    for (const video of videos) {
      const enriched = this.youtubeEnrichmentService.enrich(video);
      const seenKeys = new Set<string>();
      const candidates = this.keywordExtractionService.extractCandidateKeywordsFromTitle(enriched.title, {
        description: enriched.description,
        queryTerm: enriched.queryTerm,
      });

      if (candidates.length === 0) {
        genericSamples += 1;
        await this.keywordRepository.createGenericSample({
          region,
          rawText: enriched.title,
          normalizedText: this.keywordExtractionService.cleanTitle(enriched.title).toLowerCase(),
          reason: 'noise_pattern',
          sourceTitle: enriched.title,
          queryTerm: enriched.queryTerm,
        });
        continue;
      }

      for (const candidate of candidates) {
        const filter = await this.keywordFilterService.filterKeyword(candidate, {
          region,
          seenKeys,
        });

        if (!filter.accepted) {
          genericSamples += 1;
          await this.keywordRepository.createGenericSample({
            region,
            rawText: candidate.rawText,
            normalizedText: candidate.normalizedText,
            reason: filter.reason,
            sourceTitle: enriched.title,
            queryTerm: enriched.queryTerm,
          });
          continue;
        }

        const keyword = await this.keywordRepository.upsertKeyword({
          canonicalName: candidate.displayName,
          displayName: candidate.displayName,
          region,
          seenAt: enriched.publishedAt,
        });

        processedKeywordIds.add(keyword.id);
        await this.keywordRepository.createAlias(keyword.id, candidate.rawText, SignalSource.YOUTUBE);
        await this.keywordRepository.createYoutubeSignal({
          keyword_id: keyword.id,
          region,
          video_id: enriched.videoId,
          title: enriched.title,
          description: enriched.description,
          channel_title: enriched.channelTitle,
          thumbnail_url: enriched.thumbnails,
          published_at: enriched.publishedAt,
          fetched_at: new Date(),
          view_count: enriched.viewCount,
          like_count: enriched.likeCount,
          comment_count: enriched.commentCount,
          query_term: enriched.queryTerm,
          keyword_raw: candidate.displayName,
        });
      }
    }

    const scoredKeywords = [];
    for (const keywordId of processedKeywordIds) {
      const keyword = await this.keywordRepository.getKeywordById(keywordId);
      if (!keyword) continue;

      await this.keywordRepository.updateKeywordCounters(keyword.id);
      await this.refreshHistoricalStats(keyword.canonical_name, keyword.region);

      const refreshedKeyword = await this.keywordRepository.getKeywordById(keyword.id);
      if (!refreshedKeyword) continue;

      const robloxValidation = await this.robloxValidationService.validateKeyword(
        refreshedKeyword.canonical_name,
        refreshedKeyword.region,
      );
      if (robloxValidation.matched) {
        await this.keywordRepository.createRobloxValidation({
          keyword_id: refreshedKeyword.id,
          region: refreshedKeyword.region,
          roblox_game_id: robloxValidation.gameId,
          game_name: robloxValidation.gameName,
          players: robloxValidation.players,
          favorites: robloxValidation.favorites,
          visits: robloxValidation.visits,
          validated_at: new Date(),
        });
      }

      const trendsValidation = await this.trendsValidationService.validateKeyword(
        refreshedKeyword.canonical_name,
        refreshedKeyword.region,
      );
      if (trendsValidation) {
        await this.keywordRepository.createTrendsValidation({
          keyword_id: refreshedKeyword.id,
          region: refreshedKeyword.region,
          score: trendsValidation.score,
          source_window: trendsValidation.sourceWindow,
          validated_at: new Date(),
        });
      }

      await this.keywordRepository.updateKeywordCounters(refreshedKeyword.id);
      const score = await this.recomputeKeywordScore(refreshedKeyword.id);
      if (score && score.stage !== KeywordStage.FILTERED) {
        scoredKeywords.push({
          id: refreshedKeyword.id,
          keyword: refreshedKeyword.canonical_name,
          stage: score.stage,
          trendScore: score.trendScore,
          opportunityScore: score.opportunityScore,
        });
      }
    }

    return {
      region,
      queryCount: query ? 1 : YOUTUBE_DISCOVERY_QUERIES.length,
      videoCount: videos.length,
      processedKeywordCount: processedKeywordIds.size,
      genericSamples,
      scoredKeywords,
    };
  }

  async recomputeKeywordScore(keywordId: string) {
    const keyword = await this.keywordRepository.getKeywordById(keywordId);
    if (!keyword) return null;

    const historical = await this.keywordRepository.getHistoricalStat(
      keyword.canonical_name,
      keyword.region,
    );
    const latestRoblox = keyword.roblox_validations[0];
    const latestTrends = keyword.trends_validations[0];

    const score = this.keywordScoringService.compute({
      keyword,
      region: keyword.region,
      youtubeSignals: keyword.youtube_signals,
      robloxPlayers: latestRoblox?.players ?? null,
      hasRobloxValidation: Boolean(latestRoblox),
      hasTrendsValidation: Boolean(latestTrends),
      isLegacyKeyword: historical?.is_legacy_keyword ?? false,
    });

    await this.keywordRepository.createKeywordScore({
      keyword_id: keyword.id,
      region: keyword.region,
      newness_score: score.newnessScore,
      acceleration_score: score.accelerationScore,
      validation_score: score.validationScore,
      trend_score: score.trendScore,
      opportunity_score: score.opportunityScore,
      competition_score: score.competitionScore,
      stage: score.stage,
      calculated_at: new Date(),
      mentions_last_24h: score.mentionsLast24h,
      mentions_prev_24h: score.mentionsPrev24h,
      youtube_views_24h: score.youtubeViews24h,
      youtube_video_count: score.youtubeVideoCount,
    });
    await this.keywordRepository.updateKeywordStage(keyword.id, score.stage);

    return score;
  }

  async refreshHistoricalStats(canonicalName: string, region: RegionCode) {
    const keywords = await this.keywordRepository.findKeywords({
      region,
      take: 500,
    });
    const matching = keywords.find((item) => item.canonical_name === canonicalName);
    if (!matching) return null;

    const now = Date.now();
    const youtubeSignals = matching.youtube_signals ?? [];
    const mentions7d = youtubeSignals.filter(
      (signal) => signal.published_at.getTime() >= now - 7 * 24 * 60 * 60 * 1000,
    ).length;
    const mentions30d = youtubeSignals.filter(
      (signal) => signal.published_at.getTime() >= now - 30 * 24 * 60 * 60 * 1000,
    ).length;
    const mentions90d = youtubeSignals.filter(
      (signal) => signal.published_at.getTime() >= now - 90 * 24 * 60 * 60 * 1000,
    ).length;

    const regionsSummary = await this.keywordRepository.getRegionsSummary();
    const totalRegions = regionsSummary.filter(
      (item) => item.NEW + item.EARLY + item.EXPLODING > 0,
    ).length;
    const isLegacyKeyword =
      mentions90d >= 20 || totalRegions >= 4 || matching.is_generic === true;

    return this.keywordRepository.upsertHistoricalStat(canonicalName, region, {
      first_seen_at: matching.first_seen_at,
      last_seen_at: matching.last_seen_at,
      total_mentions_7d: mentions7d,
      total_mentions_30d: mentions30d,
      total_mentions_90d: mentions90d,
      total_regions: totalRegions,
      is_legacy_keyword: isLegacyKeyword,
    });
  }
}
