import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { DISCOVERY_CONFIG } from '../config/discovery.config';
import { KeywordExtractionService } from '../keywords/keyword-extraction.service';
import { KeywordFilterService } from '../keywords/keyword-filter.service';
import { KeywordNormalizerService } from '../keywords/keyword-normalizer.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  YoutubeSourceService,
  type YoutubeVideoItem,
} from '../sources/youtube/youtube-source.service';
import { AnalyzeNewWordsDto } from './dto/analyze-new-words.dto';

type NewWordRecord = {
  id: string;
  keyword: string;
  normalizedKeyword?: string | null;
  source: string | null;
  firstSeenAt: Date;
  lastSeenAt?: Date;
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

type CandidateKeyword = {
  keyword: string;
  score: number;
  source: string;
  region: string;
};

@Injectable()
export class NewWordsService {
  private readonly logger = new Logger(NewWordsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly youtubeSourceService: YoutubeSourceService,
    private readonly keywordExtractionService: KeywordExtractionService,
    private readonly keywordNormalizerService: KeywordNormalizerService,
    private readonly keywordFilterService: KeywordFilterService,
  ) {}

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
    try {
      const videos = await this.youtubeSourceService.fetchRecentRobloxVideos();
      const candidates = this.buildCandidates(videos, dto.limit);

      if (!candidates.length) {
        return {
          created: 0,
          items: [],
        };
      }

      const savedItems = await this.prisma.$transaction(async (tx) => {
        const results: NewWordRecord[] = [];

        for (const item of candidates) {
          const seenAt = new Date();
          const normalizedKeyword =
            this.keywordNormalizerService.normalizeKeyword(item.keyword)?.compareKey ??
            item.keyword.trim().toLowerCase();

          await (tx as any).keywordEvent.create({
            data: {
              keyword: item.keyword,
              normalizedKeyword,
              source: item.source,
              region: item.region,
              score: item.score,
              seenAt,
            },
          });

          const existing = await tx.newWord.findFirst({
            where: {
              normalizedKeyword,
              source: item.source,
            },
          });

          if (existing) {
            const updated = await tx.newWord.update({
              where: {
                id: existing.id,
              },
              data: {
                keyword: item.keyword,
                normalizedKeyword,
                lastSeenAt: seenAt,
                score: item.score,
                region: item.region,
                status: 'analyzed',
              },
            });

            results.push(updated as NewWordRecord);
            continue;
          }

          const created = await tx.newWord.create({
            data: {
              keyword: item.keyword,
              normalizedKeyword,
              source: item.source,
              lastSeenAt: seenAt,
              region: item.region,
              score: item.score,
              status: 'analyzed',
            },
          });

          results.push(created as NewWordRecord);
        }

        return results;
      });

      return {
        created: savedItems.length,
        items: savedItems.map((item: NewWordRecord) => this.toApiView(item)),
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to analyze new words from YouTube.';
      this.logger.error(message);
      throw new InternalServerErrorException(message);
    }
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

  private buildCandidates(videos: YoutubeVideoItem[], limit?: number): CandidateKeyword[] {
    const bestByKeyword = new Map<string, CandidateKeyword>();
    let processedCandidates = 0;

    for (const video of videos) {
      const extracted = this.keywordExtractionService.extractCandidates(video.title);
      const filtered = this.keywordFilterService.filterCandidates(extracted);

      for (const keyword of filtered) {
        if (processedCandidates >= DISCOVERY_CONFIG.extraction.maxRawCandidatesTotal) {
          break;
        }

        const normalized = this.keywordNormalizerService.normalizeKeyword(keyword);
        if (!normalized) {
          continue;
        }

        const candidate: CandidateKeyword = {
          keyword: normalized.displayKey,
          source: 'youtube',
          region: 'global',
          score: this.scoreKeyword(normalized.displayKey, video),
        };

        const compareKey = normalized.compareKey;
        const existing = bestByKeyword.get(compareKey);
        if (!existing || candidate.score > existing.score) {
          bestByKeyword.set(compareKey, candidate);
        }

        processedCandidates += 1;
      }

      if (processedCandidates >= DISCOVERY_CONFIG.extraction.maxRawCandidatesTotal) {
        break;
      }
    }

    const values = [...bestByKeyword.values()]
      .sort((a, b) => b.score - a.score)
      .slice(0, DISCOVERY_CONFIG.filtering.maxAcceptedNewWords);

    return typeof limit === 'number' && limit > 0 ? values.slice(0, limit) : values;
  }

  private scoreKeyword(keyword: string, video: YoutubeVideoItem): number {
    const tokenCount = keyword.split(' ').length;
    const title = video.title.toLowerCase();

    let score = 55;

    if (tokenCount >= 3) {
      score += 10;
    }

    if (/simulator|tycoon|defense|infinity|saga|latch/i.test(keyword)) {
      score += 8;
    }

    if (title.includes('just released') || title.includes('release')) {
      score += 10;
    }

    if (title.includes('new')) {
      score += 5;
    }

    if (video.query.includes('new game')) {
      score += 6;
    }

    score += this.keywordFilterService.getQualityScoreAdjustment(keyword);

    const normalized = Math.min(90, Math.max(50, score));
    return normalized;
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
}
