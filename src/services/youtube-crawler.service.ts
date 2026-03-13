import { Injectable, Logger } from '@nestjs/common';
import { RegionCode } from '@prisma/client';
import axios from 'axios';
import { YOUTUBE_DISCOVERY_QUERIES } from '../discovery/discovery.constants';

export type YoutubeDiscoveryVideo = {
  videoId: string;
  title: string;
  description: string;
  publishedAt: Date;
  channelTitle: string;
  thumbnails?: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  queryTerm: string;
  region: RegionCode;
};

@Injectable()
export class YoutubeCrawlerService {
  private readonly logger = new Logger(YoutubeCrawlerService.name);
  private readonly apiKey = process.env.YOUTUBE_API_KEY;
  private readonly searchUrl = 'https://www.googleapis.com/youtube/v3/search';
  private readonly videosUrl = 'https://www.googleapis.com/youtube/v3/videos';

  async crawlRecentVideos(params: {
    region: RegionCode;
    query?: string;
    hours?: number;
  }): Promise<YoutubeDiscoveryVideo[]> {
    const queries = params.query ? [params.query] : YOUTUBE_DISCOVERY_QUERIES;
    const hours = params.hours ?? 72;
    const publishedAfter = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    const results: YoutubeDiscoveryVideo[] = [];

    for (const query of queries) {
      try {
        const videos = this.apiKey
          ? await this.fetchFromApi(query, params.region, publishedAfter)
          : this.getMockVideos(query, params.region);
        results.push(...videos);
      } catch (error) {
        this.logger.error(
          `YouTube crawl failed for ${params.region}/${query}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        results.push(...this.getMockVideos(query, params.region));
      }
    }

    return this.deduplicateVideos(results);
  }

  private async fetchFromApi(
    query: string,
    region: RegionCode,
    publishedAfter: string,
  ): Promise<YoutubeDiscoveryVideo[]> {
    const searchResponse = await axios.get(this.searchUrl, {
      params: {
        part: 'snippet',
        q: query,
        type: 'video',
        order: 'date',
        maxResults: 25,
        publishedAfter,
        regionCode: region === RegionCode.GLOBAL ? undefined : region,
        key: this.apiKey,
      },
    });

    const items = searchResponse.data.items ?? [];
    const ids = items.map((item: any) => item.id.videoId).filter(Boolean);
    const statsById = await this.fetchVideoStats(ids);

    return items.map((item: any) => {
      const stats = statsById.get(item.id.videoId) ?? {
        viewCount: 0,
        likeCount: 0,
        commentCount: 0,
      };

      return {
        videoId: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description ?? '',
        publishedAt: new Date(item.snippet.publishedAt),
        channelTitle: item.snippet.channelTitle ?? '',
        thumbnails:
          item.snippet.thumbnails?.high?.url ??
          item.snippet.thumbnails?.medium?.url ??
          item.snippet.thumbnails?.default?.url,
        viewCount: stats.viewCount,
        likeCount: stats.likeCount,
        commentCount: stats.commentCount,
        queryTerm: query,
        region,
      };
    });
  }

  private async fetchVideoStats(ids: string[]) {
    const map = new Map<string, { viewCount: number; likeCount: number; commentCount: number }>();
    if (!ids.length || !this.apiKey) return map;

    const response = await axios.get(this.videosUrl, {
      params: {
        part: 'statistics',
        id: ids.join(','),
        key: this.apiKey,
      },
    });

    for (const item of response.data.items ?? []) {
      map.set(item.id, {
        viewCount: Number(item.statistics?.viewCount ?? 0),
        likeCount: Number(item.statistics?.likeCount ?? 0),
        commentCount: Number(item.statistics?.commentCount ?? 0),
      });
    }

    return map;
  }

  private deduplicateVideos(videos: YoutubeDiscoveryVideo[]) {
    const seen = new Set<string>();
    return videos.filter((video) => {
      const key = `${video.region}:${video.videoId}:${video.queryTerm}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private getMockVideos(query: string, region: RegionCode): YoutubeDiscoveryVideo[] {
    const now = Date.now();
    const samples = [
      ['Grow Garden Simulator', 4, 1800, 120, 40],
      ['Anime Saga', 9, 2500, 210, 60],
      ['Pet RNG', 15, 900, 85, 30],
      ['Blue Lock Rivals', 20, 6200, 300, 90],
      ['Volleyball Zero', 26, 1500, 140, 35],
      ['Clover Retribution', 40, 3300, 240, 70],
    ];

    return samples.map((sample, index) => {
      const [name, hoursAgo, viewCount, likeCount, commentCount] = sample;
      return {
        videoId: `${region.toLowerCase()}-${query.replace(/\s+/g, '-')}-${index}`,
        title:
          index % 2 === 0
            ? `I Played ${name} In Roblox`
            : `${name} Just Released Roblox Update`,
        description: `${name} gameplay and release coverage for ${region}.`,
        publishedAt: new Date(now - Number(hoursAgo) * 60 * 60 * 1000),
        channelTitle: `${region} Trend Hunter`,
        thumbnails: undefined,
        viewCount: Number(viewCount),
        likeCount: Number(likeCount),
        commentCount: Number(commentCount),
        queryTerm: query,
        region,
      };
    });
  }
}
