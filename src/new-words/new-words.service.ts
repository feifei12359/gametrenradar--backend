import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyzeNewWordsDto } from './dto/analyze-new-words.dto';

type SampleWord = {
  keyword: string;
  source: string;
  region: string;
  score: number;
};

type NewWordRecord = {
  id: string;
  keyword: string;
  source: string | null;
  firstSeenAt: Date;
  score: number;
  region: string | null;
  status: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type NewWordApiView = NewWordRecord & {
  token: string;
  novelty_score: number;
  recent_count: number;
  total_count: number;
  platforms: string;
  first_seen_at: Date;
};

@Injectable()
export class NewWordsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll(): Promise<NewWordApiView[]> {
    const items = await this.prisma.newWord.findMany({
      orderBy: { firstSeenAt: 'desc' },
    });

    return items.map((item: NewWordRecord) => this.toApiView(item));
  }

  async analyze(dto: AnalyzeNewWordsDto = {}): Promise<{
    created: number;
    items: NewWordApiView[];
  }> {
    const samples = this.buildSampleWords(dto.limit);

    const created = await this.prisma.$transaction(
      samples.map((item) =>
        this.prisma.newWord.upsert({
          where: {
            keyword_source: {
              keyword: item.keyword,
              source: item.source,
            },
          },
          update: {
            score: item.score,
            region: item.region,
            status: 'analyzed',
            firstSeenAt: new Date(),
          },
          create: {
            keyword: item.keyword,
            source: item.source,
            region: item.region,
            score: item.score,
            status: 'analyzed',
          },
        }),
      ),
    );

    return {
      created: created.length,
      items: created.map((item: NewWordRecord) => this.toApiView(item)),
    };
  }

  async reset(): Promise<{ updated: number }> {
    const result = await this.prisma.newWord.updateMany({
      data: {
        status: 'new',
      },
    });

    return { updated: result.count };
  }

  async clear(): Promise<{ deleted: number }> {
    const result = await this.prisma.newWord.deleteMany();
    return { deleted: result.count };
  }

  private buildSampleWords(limit?: number): SampleWord[] {
    const samples: SampleWord[] = [
      {
        keyword: 'Anime Saga',
        source: 'youtube',
        region: 'global',
        score: 92,
      },
      {
        keyword: 'Grow Garden Simulator',
        source: 'roblox',
        region: 'global',
        score: 84,
      },
      {
        keyword: 'Azure Latch',
        source: 'google_trends',
        region: 'global',
        score: 67,
      },
      {
        keyword: 'Bubble Gum Simulator Infinity',
        source: 'roblox',
        region: 'global',
        score: 58,
      },
      {
        keyword: 'Dungeon Extraction',
        source: 'youtube',
        region: 'us',
        score: 44,
      },
    ];

    return typeof limit === 'number' && limit > 0 ? samples.slice(0, limit) : samples;
  }

  private toApiView(item: NewWordRecord): NewWordApiView {
    return {
      ...item,
      token: item.keyword,
      novelty_score: Number((item.score / 100).toFixed(2)),
      recent_count: Math.max(1, Math.round(item.score / 10)),
      total_count: Math.max(3, Math.round(item.score / 6)),
      platforms: item.source ?? 'youtube',
      first_seen_at: item.firstSeenAt,
    };
  }

  // TODO: FutureYoutubeSource - replace sample words with extracted YouTube title candidates.
  // TODO: FutureRobloxSource - enrich candidate scoring from Roblox game metadata.
  // TODO: FutureTrendsSource - verify novelty and region fit from Google Trends.
}
