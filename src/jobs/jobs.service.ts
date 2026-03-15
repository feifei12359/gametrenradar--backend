import { Injectable } from '@nestjs/common';
import { NewWordsService } from '../new-words/new-words.service';
import { PrismaService } from '../prisma/prisma.service';
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

@Injectable()
export class JobsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly newWordsService: NewWordsService,
    private readonly trendService: TrendService,
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
    const existingNewWords =
      analysis.items.length > 0
        ? []
        : await this.prisma.newWord.findMany({
            orderBy: { lastSeenAt: 'desc' },
          });
    const trendSeedItems =
      analysis.items.length > 0
        ? analysis.items.map((item) => ({
            keyword: item.keyword,
            source: item.source,
            region: item.region,
            score: item.score,
          }))
        : existingNewWords.map((item) => ({
            keyword: item.keyword,
            source: item.source,
            region: item.region,
            score: item.score,
          }));
    const trendResult = await this.trendService.generateFromNewWords(trendSeedItems);

    const summaryText =
      analysis.quotaExceeded && analysis.created === 0
        ? trendSeedItems.length > 0
          ? 'YouTube API quota exceeded, regenerated trends from existing NewWord data.'
          : 'YouTube API quota exceeded, no new videos fetched.'
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
        analysis.quotaExceeded && analysis.created === 0
          ? trendSeedItems.length > 0
            ? 'Daily job completed, YouTube API quota was exceeded, and trends were regenerated from existing data.'
            : 'Daily job completed, but YouTube API quota was exceeded and no new videos were fetched.'
          : undefined,
      job,
      summary: {
        newWordsCreated: analysis.created,
        trendsCreated: trendResult.created,
        warning: analysis.warning,
      },
    };
  }

  async clear(): Promise<{ deleted: number }> {
    const result = await this.prisma.jobRun.deleteMany();
    return { deleted: result.count };
  }
}
