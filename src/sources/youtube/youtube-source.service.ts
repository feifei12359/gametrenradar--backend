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

const YOUTUBE_SEARCH_QUERIES = [
  'roblox new game',
  'roblox tycoon',
  'roblox simulator',
] as const;

const QUERY_DELAY_MS = 800;
const CACHE_TTL_MS = 10 * 60 * 1000;
const MAX_RESULTS_PER_QUERY = 6;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
  private cache:
    | {
        timestamp: number;
        data: YoutubeVideoItem[];
      }
    | null = null;

  async fetchRecentRobloxVideos(): Promise<YoutubeFetchResult> {
    if (this.cache && Date.now() - this.cache.timestamp < CACHE_TTL_MS) {
      return {
        videos: this.cache.data,
        quotaExceeded: false,
        allFailed: false,
        errors: [],
      };
    }

    const publishedAfter = new Date(
      Date.now() - DISCOVERY_CONFIG.youtube.hoursWindow * 60 * 60 * 1000,
    ).toISOString();

    const videos: YoutubeVideoItem[] = [];
    const errors: string[] = [];
    let quotaExceeded = false;

    for (const query of YOUTUBE_SEARCH_QUERIES) {
      let shouldStop = false;

      for (const region of YoutubeSourceService.HIGH_VALUE_REGIONS) {
        const result = await this.fetchByQuery(query, publishedAfter, region);

        if (Array.isArray(result)) {
          videos.push(...result);

          if (videos.length >= DISCOVERY_CONFIG.youtube.maxRawVideosTotal) {
            const limitedVideos = videos.slice(0, DISCOVERY_CONFIG.youtube.maxRawVideosTotal);
            this.cache = {
              timestamp: Date.now(),
              data: limitedVideos,
            };

            return {
              videos: limitedVideos,
              quotaExceeded,
              allFailed: false,
              errors,
            };
          }
        } else {
          errors.push(result.error);

          if (this.isQuotaExceededError(result.error)) {
            quotaExceeded = true;
            this.logger.error(`Failed query "${query}" in region "${region}": ${result.error}`);
            this.logger.warn('YouTube API quota exceeded, returning partial results');
            shouldStop = true;
            break;
          }
        }
      }

      if (shouldStop) {
        break;
      }

      await sleep(QUERY_DELAY_MS);
    }

    const limitedVideos = videos.slice(0, DISCOVERY_CONFIG.youtube.maxRawVideosTotal);
    this.cache = {
      timestamp: Date.now(),
      data: limitedVideos,
    };

    return {
      videos: limitedVideos,
      quotaExceeded,
      allFailed: limitedVideos.length === 0 && errors.length > 0,
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
    url.searchParams.set('maxResults', String(MAX_RESULTS_PER_QUERY));
    url.searchParams.set('q', query);
    url.searchParams.set('publishedAfter', publishedAfter);
    url.searchParams.set('regionCode', region);

    const response = await fetch(url.toString());
    const json = (await response.json()) as YoutubeSearchResponse;

    if (!response.ok) {
      const message = json.error?.message ?? `YouTube API request failed with ${response.status}`;
      this.logger.error(`Failed query "${query}" in region "${region}": ${message}`);
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

  private isQuotaExceededError(error: unknown): boolean {
    const message =
      error instanceof Error ? error.message : typeof error === 'string' ? error : String(error);
    const normalizedMessage = message.toLowerCase();

    return (
      normalizedMessage.includes('quota') ||
      normalizedMessage.includes('quotaexceeded') ||
      normalizedMessage.includes('exceeded your quota')
    );
  }
}
