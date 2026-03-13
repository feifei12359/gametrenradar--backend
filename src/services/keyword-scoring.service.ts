import { Injectable } from '@nestjs/common';
import { Keyword, KeywordStage, RegionCode, YoutubeSignal } from '@prisma/client';

type ScoreInput = {
  keyword: Keyword;
  region: RegionCode;
  youtubeSignals: YoutubeSignal[];
  robloxPlayers?: number | null;
  hasRobloxValidation: boolean;
  hasTrendsValidation: boolean;
  isLegacyKeyword: boolean;
};

@Injectable()
export class KeywordScoringService {
  compute(input: ScoreInput) {
    const now = Date.now();
    const hoursSinceFirstSeen = Math.max(
      (now - input.keyword.first_seen_at.getTime()) / (60 * 60 * 1000),
      1,
    );
    const newnessScore = Math.max(0, Math.min(100, 100 / hoursSinceFirstSeen));

    const last24hBoundary = new Date(now - 24 * 60 * 60 * 1000);
    const prev24hBoundary = new Date(now - 48 * 60 * 60 * 1000);
    const mentionsLast24h = input.youtubeSignals.filter(
      (signal) => signal.published_at >= last24hBoundary,
    ).length;
    const mentionsPrev24h = input.youtubeSignals.filter(
      (signal) =>
        signal.published_at >= prev24hBoundary && signal.published_at < last24hBoundary,
    ).length;
    const youtubeViews24h = input.youtubeSignals
      .filter((signal) => signal.published_at >= last24hBoundary)
      .reduce((sum, signal) => sum + signal.view_count, 0);

    const rawAcceleration = (mentionsLast24h + 1) / (mentionsPrev24h + 1);
    const accelerationScore = Math.max(
      0,
      Math.min(100, Number(((rawAcceleration / 4) * 100).toFixed(2))),
    );

    let validationScore = 30;
    if (input.hasRobloxValidation) validationScore = 70;
    if (input.hasTrendsValidation) validationScore = 80;
    if (input.hasRobloxValidation && input.hasTrendsValidation) validationScore = 100;

    const trendScore = Number(
      (
        newnessScore * 0.4 +
        accelerationScore * 0.35 +
        validationScore * 0.25
      ).toFixed(2),
    );

    const competitionScore = input.keyword.competition_score ?? 50;
    const opportunityScore = Number(
      (trendScore * 0.6 + (100 - competitionScore) * 0.4).toFixed(2),
    );

    const stage = this.classifyStage({
      firstSeenAt: input.keyword.first_seen_at,
      trendScore,
      accelerationScore,
      robloxPlayers: input.robloxPlayers ?? null,
      hasCrossSourceBoost: input.hasRobloxValidation && input.hasTrendsValidation,
      signalCount: input.keyword.signal_count,
      isLegacyKeyword: input.isLegacyKeyword,
    });

    return {
      region: input.region,
      newnessScore,
      accelerationScore,
      validationScore,
      trendScore,
      opportunityScore,
      competitionScore,
      stage,
      mentionsLast24h,
      mentionsPrev24h,
      youtubeViews24h,
      youtubeVideoCount: mentionsLast24h,
    };
  }

  private classifyStage(params: {
    firstSeenAt: Date;
    trendScore: number;
    accelerationScore: number;
    robloxPlayers: number | null;
    hasCrossSourceBoost: boolean;
    signalCount: number;
    isLegacyKeyword: boolean;
  }): KeywordStage {
    if (params.isLegacyKeyword || params.signalCount < 2) {
      return KeywordStage.FILTERED;
    }

    const hoursSinceFirstSeen =
      (Date.now() - params.firstSeenAt.getTime()) / (60 * 60 * 1000);

    if (
      params.trendScore >= 70 &&
      ((params.robloxPlayers ?? 0) >= 5000 || params.hasCrossSourceBoost)
    ) {
      return KeywordStage.EXPLODING;
    }

    if (
      params.trendScore >= 55 &&
      params.accelerationScore >= 60 &&
      (params.robloxPlayers ?? 0) < 5000
    ) {
      return KeywordStage.EARLY;
    }

    if (
      hoursSinceFirstSeen < 72 &&
      params.trendScore >= 40 &&
      ((params.robloxPlayers ?? 0) < 2000 || params.robloxPlayers == null)
    ) {
      return KeywordStage.NEW;
    }

    return KeywordStage.FILTERED;
  }
}
