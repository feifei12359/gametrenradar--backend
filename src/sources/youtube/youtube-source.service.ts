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

  async fetchRecentRobloxVideos(): Promise<YoutubeVideoItem[]> {
    const publishedAfter = new Date(
      Date.now() - DISCOVERY_CONFIG.youtube.hoursWindow * 60 * 60 * 1000,
    ).toISOString();

    const results = await Promise.all(
      YoutubeSourceService.HIGH_VALUE_REGIONS.flatMap((region) =>
        this.searchQueries.map((query) => this.fetchByQuery(query, publishedAfter, region)),
      ),
    );

    return results.flat().slice(0, DISCOVERY_CONFIG.youtube.maxRawVideosTotal);
  }

  private async fetchByQuery(
    query: string,
    publishedAfter: string,
    region: string,
  ): Promise<YoutubeVideoItem[]> {
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
      throw new InternalServerErrorException(`Failed to fetch YouTube videos: ${message}`);
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
}
