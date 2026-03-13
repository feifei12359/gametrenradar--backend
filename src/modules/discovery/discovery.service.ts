import { Injectable } from '@nestjs/common';
import { KeywordStage, RegionCode } from '@prisma/client';
import { DEFAULT_REGION } from '../../discovery/discovery.constants';
import { KeywordRepository } from '../keywords/keyword.repository';
import { DiscoveryQueryDto } from './dto/discovery-query.dto';

@Injectable()
export class DiscoveryService {
  constructor(private readonly keywordRepository: KeywordRepository) {}

  async getStageResults(stage: KeywordStage, query: DiscoveryQueryDto) {
    const region = this.resolveRegion(query.region);
    const hours = this.resolveWindow(query.window);

    const keywords = await this.keywordRepository.findKeywords({
      region,
      stage,
      hours,
      orderBy: stage === KeywordStage.EARLY ? 'opportunity_score' : 'trend_score',
      take: 100,
    });

    return keywords.map((keyword) => {
      const score = keyword.keyword_scores[0];
      const roblox = keyword.roblox_validations[0];

      return {
        id: keyword.id,
        keyword: keyword.display_name,
        canonicalName: keyword.canonical_name,
        region: keyword.region,
        firstSeenAt: keyword.first_seen_at,
        lastSeenAt: keyword.last_seen_at,
        signalCount: keyword.signal_count,
        youtubeSignalCount: keyword.youtube_signal_count,
        robloxSignalCount: keyword.roblox_signal_count,
        trendsSignalCount: keyword.trends_signal_count,
        stage: keyword.stage,
        scores: score
          ? {
              newnessScore: score.newness_score,
              accelerationScore: score.acceleration_score,
              validationScore: score.validation_score,
              trendScore: score.trend_score,
              opportunityScore: score.opportunity_score,
            }
          : null,
        roblox: roblox
          ? {
              players: roblox.players,
              favorites: roblox.favorites,
              visits: roblox.visits,
            }
          : null,
      };
    });
  }

  async getKeywordDetail(id: string) {
    const keyword = await this.keywordRepository.getKeywordById(id);
    if (!keyword) {
      return null;
    }

    return {
      id: keyword.id,
      canonicalName: keyword.canonical_name,
      displayName: keyword.display_name,
      region: keyword.region,
      stage: keyword.stage,
      firstSeenAt: keyword.first_seen_at,
      lastSeenAt: keyword.last_seen_at,
      signalCount: keyword.signal_count,
      youtubeSignalCount: keyword.youtube_signal_count,
      robloxSignalCount: keyword.roblox_signal_count,
      trendsSignalCount: keyword.trends_signal_count,
      aliases: keyword.aliases.map((alias) => ({
        rawText: alias.raw_text,
        source: alias.source,
      })),
      score: keyword.keyword_scores[0]
        ? {
            newnessScore: keyword.keyword_scores[0].newness_score,
            accelerationScore: keyword.keyword_scores[0].acceleration_score,
            validationScore: keyword.keyword_scores[0].validation_score,
            trendScore: keyword.keyword_scores[0].trend_score,
            opportunityScore: keyword.keyword_scores[0].opportunity_score,
            stage: keyword.keyword_scores[0].stage,
            calculatedAt: keyword.keyword_scores[0].calculated_at,
          }
        : null,
      youtubeSignals: keyword.youtube_signals.map((signal) => ({
        videoId: signal.video_id,
        title: signal.title,
        channelTitle: signal.channel_title,
        publishedAt: signal.published_at,
        viewCount: signal.view_count,
        likeCount: signal.like_count,
        commentCount: signal.comment_count,
        queryTerm: signal.query_term,
      })),
      robloxValidations: keyword.roblox_validations,
      trendsValidations: keyword.trends_validations,
    };
  }

  async getRegionsSummary() {
    return this.keywordRepository.getRegionsSummary();
  }

  async getGenericKeywordSamples(region?: RegionCode) {
    return this.keywordRepository.getGenericKeywordSamples(region);
  }

  private resolveRegion(region?: RegionCode | 'GLOBAL') {
    if (!region) return DEFAULT_REGION;
    if (region === 'GLOBAL') return undefined;
    return region;
  }

  private resolveWindow(window?: DiscoveryQueryDto['window']) {
    switch (window) {
      case '24h':
        return 24;
      case '48h':
        return 48;
      case '72h':
        return 72;
      case '7d':
        return 168;
      default:
        return 72;
    }
  }
}
