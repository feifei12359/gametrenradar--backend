import { Injectable, Logger } from '@nestjs/common';
import { NewWordsService } from '../new-words/new-words.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  RobloxDiscoverService,
  type DiscoverGameItem,
} from '../sources/roblox/roblox-discover.service';
import { TrendService } from '../trend/trend.service';
import { RunDailyJobDto } from './dto/run-daily-job.dto';

type JobRunRecord = {
  id: string;
  type: string;
  status: string;
  summary: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type NewWordSeedRecord = {
  keyword: string;
  source: string | null;
  region: string | null;
  score: number;
};

type TrendSeedItem = {
  keyword: string;
  source: string | null;
  region: string | null;
  score: number;
};

type KeywordEventAggregate = {
  keyword: string;
  source: string | null;
  region: string | null;
  latestSeenAt: number;
  count: number;
  scoreSum: number;
  scoreCount: number;
};

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);
  private readonly validDiscoverSuffixes = new Set([
    'tycoon',
    'simulator',
    'obby',
    'defense',
    'survival',
    'rng',
    'battlegrounds',
  ]);

  private readonly ignoredDiscoverTitles = new Set([
    'roblox',
    'home',
    'discover',
    'recommended for you',
    'continue',
  ]);

  constructor(
    private readonly prisma: PrismaService,
    private readonly newWordsService: NewWordsService,
    private readonly trendService: TrendService,
    private readonly robloxDiscoverService: RobloxDiscoverService,
  ) {}

  async getLatestJob(): Promise<JobRunRecord | { status: string; summary: string }> {
    const latest = await this.prisma.jobRun.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    if (latest) {
      return latest;
    }

    return {
      status: 'idle',
      summary: 'No job has been run yet.',
    };
  }

  async runDailyJob(_dto: RunDailyJobDto = {}): Promise<{
    __responseMessage?: string;
    job: JobRunRecord;
    summary: {
      newWordsCreated: number;
      trendsCreated: number;
      warning?: string;
    };
  }> {
    const analysis = await this.newWordsService.analyze();
    const existingNewWords: NewWordSeedRecord[] =
      analysis.items.length > 0
        ? []
        : await this.prisma.newWord.findMany({
            select: {
              keyword: true,
              source: true,
              region: true,
              score: true,
            },
            orderBy: { lastSeenAt: 'desc' },
          });
    const keywordEventSeedItems =
      analysis.items.length === 0 && existingNewWords.length === 0
        ? await this.buildTrendSeedFromKeywordEvents()
        : [];
    const robloxDiscoverSeedItems =
      analysis.items.length === 0 &&
      existingNewWords.length === 0 &&
      keywordEventSeedItems.length === 0
        ? await this.buildTrendSeedFromRobloxDiscover()
        : [];

    this.logger.log(`analysis.items=${analysis.items.length}`);
    this.logger.log(`existingNewWords=${existingNewWords.length}`);
    this.logger.log(`keywordEventSeedItems=${keywordEventSeedItems.length}`);
    this.logger.log(`robloxDiscoverSeedItems=${robloxDiscoverSeedItems.length}`);

    const trendSeedItems: TrendSeedItem[] =
      analysis.items.length > 0
        ? analysis.items.map((item) => ({
            keyword: item.keyword,
            source: item.source,
            region: item.region,
            score: item.score,
          }))
        : existingNewWords.length > 0
          ? existingNewWords.map((item) => ({
              keyword: item.keyword,
              source: item.source,
              region: item.region,
              score: item.score,
            }))
          : keywordEventSeedItems.length > 0
            ? keywordEventSeedItems
            : robloxDiscoverSeedItems;

    this.logger.log(`trendSeedItems=${trendSeedItems.length}`);

    const trendResult = await this.trendService.generateFromNewWords(trendSeedItems);

    const summaryText =
      analysis.created === 0
        ? trendSeedItems.length > 0
          ? existingNewWords.length > 0
            ? 'YouTube API quota exceeded or no new videos were fetched, regenerated trends from existing NewWord data.'
            : keywordEventSeedItems.length > 0
              ? 'YouTube API quota exceeded or no new videos were fetched, regenerated trends from KeywordEvent history.'
              : robloxDiscoverSeedItems.length > 0
                ? 'Regenerated trends from Roblox Discover fallback data.'
                : 'No data available to rebuild trends.'
          : 'No data available to rebuild trends.'
        : `Processed ${analysis.created} new words and generated ${trendResult.created} trends.`;

    const job = await this.prisma.jobRun.create({
      data: {
        type: 'daily-job',
        status: 'success',
        summary: summaryText,
      },
    });

    return {
      __responseMessage:
        analysis.created === 0
          ? trendSeedItems.length > 0
            ? existingNewWords.length > 0
              ? 'Daily job completed, and trends were regenerated from existing NewWord data.'
              : keywordEventSeedItems.length > 0
                ? 'Daily job completed, and trends were regenerated from KeywordEvent history.'
                : robloxDiscoverSeedItems.length > 0
                  ? 'Daily job completed, and trends were regenerated from Roblox Discover fallback data.'
                  : 'Daily job completed, but no data was available to rebuild trends.'
            : 'Daily job completed, but no data was available to rebuild trends.'
          : undefined,
      job,
      summary: {
        newWordsCreated: analysis.created,
        trendsCreated: trendResult.created,
        warning:
          analysis.warning ??
          (analysis.created === 0 && keywordEventSeedItems.length > 0
            ? 'Rebuilt trends from KeywordEvent fallback data.'
            : analysis.created === 0 && robloxDiscoverSeedItems.length > 0
              ? 'Rebuilt trends from Roblox Discover fallback data.'
              : analysis.created === 0 && trendSeedItems.length === 0
                ? 'No data available to rebuild trends.'
              : undefined),
      },
    };
  }

  async clear(): Promise<{ deleted: number }> {
    const result = await this.prisma.jobRun.deleteMany();
    return { deleted: result.count };
  }

  private async buildTrendSeedFromKeywordEvents(): Promise<TrendSeedItem[]> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentEvents = await this.prisma.keywordEvent.findMany({
      where: {
        seenAt: {
          gte: sevenDaysAgo,
        },
      },
      orderBy: {
        seenAt: 'desc',
      },
    });

    const aggregateMap = new Map<string, KeywordEventAggregate>();

    for (const event of recentEvents) {
      const existing = aggregateMap.get(event.normalizedKeyword);
      const eventSeenAt = event.seenAt.getTime();

      if (!existing) {
        aggregateMap.set(event.normalizedKeyword, {
          keyword: event.keyword,
          source: event.source,
          region: event.region,
          latestSeenAt: eventSeenAt,
          count: 1,
          scoreSum: typeof event.score === 'number' ? event.score : 0,
          scoreCount: typeof event.score === 'number' ? 1 : 0,
        });
        continue;
      }

      existing.count += 1;

      if (eventSeenAt > existing.latestSeenAt) {
        existing.keyword = event.keyword;
        existing.source = event.source;
        existing.region = event.region;
        existing.latestSeenAt = eventSeenAt;
      }

      if (typeof event.score === 'number') {
        existing.scoreSum += event.score;
        existing.scoreCount += 1;
      }
    }

    return [...aggregateMap.values()]
      .sort((a, b) => {
        if (b.count !== a.count) {
          return b.count - a.count;
        }

        return b.latestSeenAt - a.latestSeenAt;
      })
      .slice(0, 20)
      .map((item) => ({
        keyword: item.keyword,
        source: item.source,
        region: item.region,
        score:
          item.scoreCount > 0 ? Number((item.scoreSum / item.scoreCount).toFixed(2)) : item.count,
      }));
  }

  private async buildTrendSeedFromRobloxDiscover(): Promise<TrendSeedItem[]> {
    const discoverGames = await this.robloxDiscoverService.fetchDiscoverGames();
    const deduped = new Map<string, TrendSeedItem>();

    for (const item of discoverGames) {
      if (!this.isValidDiscoverFallback(item)) {
        continue;
      }

      if (!deduped.has(item.normalizedTitle)) {
        deduped.set(item.normalizedTitle, {
          keyword: item.title,
          source: 'roblox-discover',
          region: 'global',
          score: this.scoreDiscoverFallback(item.title),
        });
      }
    }

    return [...deduped.values()].slice(0, 20);
  }

  private isValidDiscoverFallback(item: DiscoverGameItem): boolean {
    const normalizedTitle = item.normalizedTitle.trim();
    if (!normalizedTitle || normalizedTitle.length < 6) {
      return false;
    }

    if (this.ignoredDiscoverTitles.has(normalizedTitle)) {
      return false;
    }

    const tokens = normalizedTitle.split(' ').filter(Boolean);
    if (tokens.length < 2) {
      return false;
    }

    const lastToken = tokens[tokens.length - 1];
    return this.validDiscoverSuffixes.has(lastToken);
  }

  private scoreDiscoverFallback(title: string): number {
    const normalizedTitle = title.trim().toLowerCase();

    if (normalizedTitle.includes('battlegrounds')) {
      return 70;
    }

    if (normalizedTitle.includes('tycoon') || normalizedTitle.includes('simulator')) {
      return 65;
    }

    return 60;
  }
}
