import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import {
  DEFAULT_YOUTUBE_MAX_RESULTS,
  DEFAULT_YOUTUBE_QUERY,
  YOUTUBE_REGION_CODE_MAP,
} from './youtube.constants';
import { YoutubeSearchDebugResult, YoutubeVideo } from './youtube.types';

@Injectable()
export class YoutubeService {
  private readonly logger = new Logger(YoutubeService.name);
  private readonly apiKey = process.env.YOUTUBE_API_KEY || 'YOUR_API_KEY';
  private readonly searchUrl = 'https://www.googleapis.com/youtube/v3/search';
  private readonly videosUrl = 'https://www.googleapis.com/youtube/v3/videos';

  async getRobloxVideos(
    days: number = 3,
    region: string = 'US',
    query: string = DEFAULT_YOUTUBE_QUERY,
  ): Promise<YoutubeVideo[]> {
    this.logger.log(`获取最近 ${days} 天的 Roblox 视频`);

    try {
      const { items } = await this.searchVideos({ days, region, query });
      return this.enrichVideosWithStatistics(items);
    } catch (error) {
      this.logAxiosError(`获取 YouTube 视频失败 region=${region} query=${query}`, error);
      return this.getStableMockVideos(days);
    }
  }

  async getRobloxVideosBatch(params: {
    days?: number;
    regions: string[];
    queries: string[];
  }) {
    const results: Array<{ region: string; query: string; videos: YoutubeVideo[] }> = [];

    for (const region of params.regions) {
      for (const query of params.queries) {
        try {
          const videos = await this.getRobloxVideos(params.days ?? 3, region, query);
          results.push({ region, query, videos });
        } catch (error) {
          this.logAxiosError(`批量抓取失败 region=${region} query=${query}`, error);
          results.push({
            region,
            query,
            videos: this.getStableMockVideos(params.days ?? 3),
          });
        }
      }
    }

    return results;
  }

  async debugYoutubeSearch(
    region: string = 'US',
    query: string = DEFAULT_YOUTUBE_QUERY,
    days: number = 3,
  ): Promise<YoutubeSearchDebugResult> {
    try {
      const { params, items } = await this.searchVideos({ days, region, query });

      return {
        requestParams: {
          endpoint: this.searchUrl,
          query: params.q,
          region,
          regionCode: params.regionCode,
          publishedAfter: params.publishedAfter,
          order: params.order,
          maxResults: params.maxResults,
        },
        itemCount: items.length,
        firstItems: items.slice(0, 3).map((item: any) => ({
          videoId: item.id?.videoId ?? '',
          title: item.snippet?.title ?? '',
          channelTitle: item.snippet?.channelTitle ?? '',
          publishedAt: item.snippet?.publishedAt ?? '',
        })),
      };
    } catch (error) {
      this.logAxiosError(`YouTube debug search failed region=${region} query=${query}`, error);

      return {
        requestParams: {
          endpoint: this.searchUrl,
          query,
          region,
          regionCode: this.mapRegionCode(region),
          publishedAfter: new Date(
            Date.now() - days * 24 * 60 * 60 * 1000,
          ).toISOString(),
          order: 'date',
          maxResults: DEFAULT_YOUTUBE_MAX_RESULTS,
        },
        itemCount: 0,
        firstItems: [],
        error: axios.isAxiosError(error)
          ? {
              status: error.response?.status,
              statusText: error.response?.statusText,
              data: error.response?.data,
            }
          : {
              data: error instanceof Error ? error.message : String(error),
            },
      };
    }
  }

  async getVideoStatistics(videoId: string): Promise<any> {
    try {
      const stats = await this.fetchVideoStatistics([videoId]);
      return (
        stats.get(videoId) || {
          viewCount: 0,
          likeCount: 0,
          commentCount: 0,
        }
      );
    } catch (error) {
      this.logAxiosError(`获取视频统计失败 videoId=${videoId}`, error);
      return {
        viewCount: 0,
        likeCount: 0,
        commentCount: 0,
      };
    }
  }

  private async searchVideos(params: {
    days: number;
    region: string;
    query: string;
  }) {
    const publishedAfter = new Date(
      Date.now() - params.days * 24 * 60 * 60 * 1000,
    ).toISOString();
    const regionCode = this.mapRegionCode(params.region);
    const requestParams = {
      part: 'snippet',
      type: 'video',
      order: 'date' as const,
      q: params.query,
      publishedAfter,
      maxResults: DEFAULT_YOUTUBE_MAX_RESULTS,
      key: this.apiKey,
      ...(regionCode ? { regionCode } : {}),
    };

    this.logger.log(
      `YouTube search params ${JSON.stringify({
        endpoint: this.searchUrl,
        query: requestParams.q,
        region: params.region,
        regionCode: requestParams.regionCode,
        publishedAfter: requestParams.publishedAfter,
        order: requestParams.order,
        maxResults: requestParams.maxResults,
      })}`,
    );

    const response = await axios.get(this.searchUrl, { params: requestParams });
    return {
      params: requestParams,
      items: response.data?.items ?? [],
    };
  }

  private async enrichVideosWithStatistics(items: any[]): Promise<YoutubeVideo[]> {
    const videoIds = items.map((item) => item.id?.videoId).filter(Boolean);
    const statsMap = await this.fetchVideoStatistics(videoIds);

    return items.map((item: any) => {
      const videoId = item.id.videoId;
      const stats = statsMap.get(videoId) || {
        viewCount: 0,
        likeCount: 0,
        commentCount: 0,
      };

      return {
        title: item.snippet.title,
        description: item.snippet.description ?? '',
        publishedAt: new Date(item.snippet.publishedAt),
        channelTitle: item.snippet.channelTitle,
        videoId,
        link: `https://www.youtube.com/watch?v=${videoId}`,
        thumbnails:
          item.snippet.thumbnails?.high?.url ??
          item.snippet.thumbnails?.medium?.url ??
          item.snippet.thumbnails?.default?.url,
        viewCount: Number(stats.viewCount ?? 0),
        likeCount: Number(stats.likeCount ?? 0),
        commentCount: Number(stats.commentCount ?? 0),
      };
    });
  }

  private async fetchVideoStatistics(videoIds: string[]) {
    const statsMap = new Map<string, any>();
    if (!videoIds.length) {
      return statsMap;
    }

    const response = await axios.get(this.videosUrl, {
      params: {
        part: 'statistics',
        id: videoIds.join(','),
        key: this.apiKey,
      },
    });

    for (const item of response.data?.items ?? []) {
      statsMap.set(item.id, {
        viewCount: Number(item.statistics?.viewCount ?? 0),
        likeCount: Number(item.statistics?.likeCount ?? 0),
        commentCount: Number(item.statistics?.commentCount ?? 0),
      });
    }

    return statsMap;
  }

  private mapRegionCode(region: string) {
    return YOUTUBE_REGION_CODE_MAP[region.toUpperCase()];
  }

  private logAxiosError(context: string, error: unknown) {
    if (axios.isAxiosError(error)) {
      this.logger.error(
        `${context} status=${error.response?.status ?? 'unknown'} statusText=${
          error.response?.statusText ?? 'unknown'
        } data=${JSON.stringify(error.response?.data ?? null)}`,
      );
      return;
    }

    this.logger.error(`${context}: ${error instanceof Error ? error.message : String(error)}`);
  }

  private getStableMockVideos(days: number): YoutubeVideo[] {
    const mockVideos: YoutubeVideo[] = [
      {
        title: 'Anime Last Stand - NEW Roblox Game 2026',
        description: '',
        publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        channelTitle: 'Roblox Gamer',
        videoId: 'anime_last_stand',
        link: 'https://www.youtube.com/watch?v=anime_last_stand',
        thumbnails: undefined,
        viewCount: 4300,
        likeCount: 220,
        commentCount: 41,
      },
      {
        title: 'Grow A Garden - Roblox New Update',
        description: '',
        publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        channelTitle: 'Game Master',
        videoId: 'grow_a_garden',
        link: 'https://www.youtube.com/watch?v=grow_a_garden',
        thumbnails: undefined,
        viewCount: 3900,
        likeCount: 175,
        commentCount: 28,
      },
      {
        title: 'Blade Ball - Roblox Trending Game',
        description: '',
        publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        channelTitle: 'Trend Hunter',
        videoId: 'blade_ball',
        link: 'https://www.youtube.com/watch?v=blade_ball',
        thumbnails: undefined,
        viewCount: 6100,
        likeCount: 302,
        commentCount: 65,
      },
      {
        title: 'Type Soul - Roblox New Release',
        description: '',
        publishedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        channelTitle: 'Anime Games',
        videoId: 'type_soul',
        link: 'https://www.youtube.com/watch?v=type_soul',
        thumbnails: undefined,
        viewCount: 2800,
        likeCount: 124,
        commentCount: 19,
      },
    ];

    return mockVideos.filter((video) => {
      const daysDiff =
        (Date.now() - video.publishedAt.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= days;
    });
  }
}
