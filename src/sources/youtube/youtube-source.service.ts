import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { DISCOVERY_CONFIG } from '../../config/discovery.config';

export type YoutubeVideoItem = {
  videoId: string;
  title: string;
  publishedAt: string;
  channelTitle: string;
  query: string;
  region: string;
};

type YoutubeSearchResponse = {
  items?: Array<{
    id?: {
      videoId?: string;
    };
    snippet?: {
      title?: string;
      publishedAt?: string;
      channelTitle?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

export type YoutubeFetchResult = {
  videos: YoutubeVideoItem[];
  quotaExceeded: boolean;
  allFailed: boolean;
  errors: string[];
};

@Injectable()
export class YoutubeSourceService {
  private static readonly HIGH_VALUE_REGIONS = [
    'US',
    'CA',
    'GB',
    'AU',
    'NZ',
    'DE',
    'FR',
    'NL',
    'SE',
    'NO',
    'DK',
    'FI',
    'CH',
    'AT',
    'BE',
    'IE',
    'LU',
    'IT',
    'ES',
    'PT',
    'PL',
    'CZ',
  ] as const;

  private readonly logger = new Logger(YoutubeSourceService.name);
  private readonly endpoint = 'https://www.googleapis.com/youtube/v3/search';
  private readonly searchQueries = DISCOVERY_CONFIG.youtube.queries;

  async fetchRecentRobloxVideos(): Promise<YoutubeFetchResult> {
    const publishedAfter = new Date(
      Date.now() - DISCOVERY_CONFIG.youtube.hoursWindow * 60 * 60 * 1000,
    ).toISOString();

    const videos: YoutubeVideoItem[] = [];
    const errors: string[] = [];
    let quotaExceeded = false;

    for (const query of this.searchQueries) {
      for (const region of YoutubeSourceService.HIGH_VALUE_REGIONS) {
        const result = await this.fetchByQuery(query, publishedAfter, region);

        if (Array.isArray(result)) {
          videos.push(...result);

          if (videos.length >= DISCOVERY_CONFIG.youtube.maxRawVideosTotal) {
            return {
              videos: videos.slice(0, DISCOVERY_CONFIG.youtube.maxRawVideosTotal),
              quotaExceeded,
              allFailed: false,
              errors,
            };
          }

          continue;
        }

        errors.push(result.error);

        if (this.isQuotaExceededError(result.error)) {
          quotaExceeded = true;
          this.logger.warn(
            `YouTube quota exceeded while executing query "${query}" for region "${region}". Stopping remaining queries.`,
          );

          return {
            videos: videos.slice(0, DISCOVERY_CONFIG.youtube.maxRawVideosTotal),
            quotaExceeded,
            allFailed: videos.length === 0 && errors.length > 0,
            errors,
          };
        }
      }
    }

    return {
      videos: videos.slice(0, DISCOVERY_CONFIG.youtube.maxRawVideosTotal),
      quotaExceeded,
      allFailed: videos.length === 0 && errors.length > 0,
      errors,
    };
  }

  private async fetchByQuery(
    query: string,
    publishedAfter: string,
    region: string,
  ): Promise<YoutubeVideoItem[] | { error: string }> {
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!apiKey) {
      throw new InternalServerErrorException(
        'YOUTUBE_API_KEY is required to analyze new words from YouTube.',
      );
    }

    const url = new URL(this.endpoint);
    url.searchParams.set('key', apiKey);
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('type', 'video');
    url.searchParams.set('order', 'date');
    url.searchParams.set('maxResults', String(DISCOVERY_CONFIG.youtube.maxVideosPerQuery));
    url.searchParams.set('q', query);
    url.searchParams.set('publishedAfter', publishedAfter);
    url.searchParams.set('regionCode', region);

    const response = await fetch(url.toString());
    const json = (await response.json()) as YoutubeSearchResponse;

    if (!response.ok) {
      const message = json.error?.message ?? `YouTube API request failed with ${response.status}`;
      this.logger.error(`Failed query "${query}": ${message}`);
      return { error: message };
    }

    return (json.items ?? [])
      .map((item) => ({
        videoId: item.id?.videoId ?? '',
        title: item.snippet?.title?.trim() ?? '',
        publishedAt: item.snippet?.publishedAt ?? '',
        channelTitle: item.snippet?.channelTitle?.trim() ?? '',
        query,
        region,
      }))
      .filter((item) => item.videoId && item.title);
  }

  private isQuotaExceededError(message: string): boolean {
    const normalizedMessage = message.toLowerCase();
    return normalizedMessage.includes('quota') || normalizedMessage.includes('quotaexceeded');
  }
}
