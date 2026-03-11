import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

type YoutubeVideo = {
  title: string;
  publishedAt: Date;
  channelTitle: string;
  videoId: string;
  link: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  query: string;
};

@Injectable()
export class YoutubeService {
  private readonly logger = new Logger(YoutubeService.name);
  private readonly YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || 'YOUR_API_KEY';

  private readonly searchQueries = [
    'Roblox new game',
    'Roblox new update game',
    'Roblox anime game',
    'Roblox simulator game',
    'Roblox tycoon game',
    'Roblox trending game',
    'Roblox battlegrounds',
    'Roblox new release',
    'Roblox best new game',
    'Roblox game update'
  ];

  async getRobloxVideos(days: number = 7): Promise<YoutubeVideo[]> {
    try {
      if (!this.YOUTUBE_API_KEY || this.YOUTUBE_API_KEY === 'YOUR_API_KEY') {
        this.logger.warn('未配置有效的 YOUTUBE_API_KEY，使用 mock 数据');
        return this.getMockRobloxVideos(days);
      }

      const publishedAfter = new Date();
      publishedAfter.setDate(publishedAfter.getDate() - days);

      const allVideos: YoutubeVideo[] = [];

      for (const query of this.searchQueries) {
        const videos = await this.fetchSearchResults(query, publishedAfter);
        allVideos.push(...videos);
      }

      const dedupedVideos = this.deduplicateVideos(allVideos);
      const videoIds = dedupedVideos.map(video => video.videoId);

      const statisticsMap = await this.getVideoStatisticsBatch(videoIds);

      const enrichedVideos = dedupedVideos
        .map(video => {
          const stats = statisticsMap.get(video.videoId) || {
            viewCount: 0,
            likeCount: 0,
            commentCount: 0
          };

          return {
            ...video,
            viewCount: stats.viewCount,
            likeCount: stats.likeCount,
            commentCount: stats.commentCount
          };
        })
        .filter(video => this.isUsefulVideo(video))
        .sort((a, b) => {
          if (b.viewCount !== a.viewCount) return b.viewCount - a.viewCount;
          return b.publishedAt.getTime() - a.publishedAt.getTime();
        });

      this.logger.log(`YouTube 共抓取 ${enrichedVideos.length} 个有效 Roblox 视频`);
      return enrichedVideos;
    } catch (error) {
      this.logger.error('获取 YouTube 视频失败:', error);
      return this.getMockRobloxVideos(days);
    }
  }

  async getVideoStatistics(videoId: string): Promise<{
    viewCount: number;
    likeCount: number;
    commentCount: number;
  }> {
    try {
      const statsMap = await this.getVideoStatisticsBatch([videoId]);
      return statsMap.get(videoId) || {
        viewCount: 0,
        likeCount: 0,
        commentCount: 0
      };
    } catch (error) {
      this.logger.error(`获取视频 ${videoId} 统计失败:`, error);
      return {
        viewCount: 0,
        likeCount: 0,
        commentCount: 0
      };
    }
  }

  private async fetchSearchResults(query: string, publishedAfter: Date): Promise<YoutubeVideo[]> {
    try {
      const url = 'https://www.googleapis.com/youtube/v3/search';

      const params = {
        part: 'snippet',
        q: query,
        type: 'video',
        order: 'date',
        publishedAfter: publishedAfter.toISOString(),
        maxResults: 25,
        key: this.YOUTUBE_API_KEY
      };

      const response = await axios.get(url, { params });

      const items = response.data?.items || [];

      return items
        .map((item: any) => ({
          title: item?.snippet?.title || '',
          publishedAt: new Date(item?.snippet?.publishedAt),
          channelTitle: item?.snippet?.channelTitle || '',
          videoId: item?.id?.videoId || '',
          link: `https://www.youtube.com/watch?v=${item?.id?.videoId}`,
          viewCount: 0,
          likeCount: 0,
          commentCount: 0,
          query
        }))
        .filter((video: YoutubeVideo) => video.videoId && video.title);
    } catch (error) {
      this.logger.error(`YouTube 搜索失败: ${query}`, error);
      return [];
    }
  }

  private async getVideoStatisticsBatch(
    videoIds: string[]
  ): Promise<Map<string, { viewCount: number; likeCount: number; commentCount: number }>> {
    const result = new Map<string, { viewCount: number; likeCount: number; commentCount: number }>();

    if (!videoIds.length) return result;

    // YouTube videos API 一次最多 50 个 id
    const chunks = this.chunkArray(videoIds, 50);

    for (const chunk of chunks) {
      try {
        const url = 'https://www.googleapis.com/youtube/v3/videos';
        const params = {
          part: 'statistics',
          id: chunk.join(','),
          key: this.YOUTUBE_API_KEY
        };

        const response = await axios.get(url, { params });
        const items = response.data?.items || [];

        for (const item of items) {
          result.set(item.id, {
            viewCount: Number(item?.statistics?.viewCount || 0),
            likeCount: Number(item?.statistics?.likeCount || 0),
            commentCount: Number(item?.statistics?.commentCount || 0)
          });
        }
      } catch (error) {
        this.logger.error('批量获取 YouTube 视频统计失败:', error);
      }
    }

    return result;
  }

  private isUsefulVideo(video: YoutubeVideo): boolean {
    const title = String(video.title || '').toLowerCase();

    // 必须和 Roblox 高度相关
    if (!title.includes('roblox')) return false;

    // 过滤明显噪音
    const blockedPatterns = [
      'free robux',
      'robux generator',
      'gift card',
      'promo code',
      'live stream',
      'livestream',
      'music video',
      'song',
      'edit audio'
    ];

    if (blockedPatterns.some(pattern => title.includes(pattern))) {
      return false;
    }

    // 至少有一点热度
    if (video.viewCount < 100) return false;

    return true;
  }

  private deduplicateVideos(videos: YoutubeVideo[]): YoutubeVideo[] {
    const map = new Map<string, YoutubeVideo>();

    for (const video of videos) {
      if (!video.videoId) continue;

      const existing = map.get(video.videoId);
      if (!existing) {
        map.set(video.videoId, video);
      }
    }

    return [...map.values()];
  }

  private chunkArray<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  }

  private getMockRobloxVideos(days: number): YoutubeVideo[] {
    const now = Date.now();

    const mockVideos: YoutubeVideo[] = [
      {
        title: 'Anime Last Stand Roblox New Update Guide',
        publishedAt: new Date(now - 1 * 24 * 60 * 60 * 1000),
        channelTitle: 'Roblox Gamer',
        videoId: 'mock-1',
        link: 'https://www.youtube.com/watch?v=mock-1',
        viewCount: 18500,
        likeCount: 1200,
        commentCount: 240,
        query: 'Roblox anime game'
      },
      {
        title: 'Grow A Garden Roblox Beginner Tips',
        publishedAt: new Date(now - 2 * 24 * 60 * 60 * 1000),
        channelTitle: 'Game Master',
        videoId: 'mock-2',
        link: 'https://www.youtube.com/watch?v=mock-2',
        viewCount: 14200,
        likeCount: 980,
        commentCount: 180,
        query: 'Roblox trending game'
      },
      {
        title: 'Blade Ball Roblox Best Build',
        publishedAt: new Date(now - 3 * 24 * 60 * 60 * 1000),
        channelTitle: 'Trend Hunter',
        videoId: 'mock-3',
        link: 'https://www.youtube.com/watch?v=mock-3',
        viewCount: 21300,
        likeCount: 1600,
        commentCount: 320,
        query: 'Roblox battlegrounds'
      },
      {
        title: 'Type Soul Roblox New Release Guide',
        publishedAt: new Date(now - 4 * 24 * 60 * 60 * 1000),
        channelTitle: 'Anime Games',
        videoId: 'mock-4',
        link: 'https://www.youtube.com/watch?v=mock-4',
        viewCount: 9600,
        likeCount: 640,
        commentCount: 110,
        query: 'Roblox new release'
      },
      {
        title: "Sol's RNG Roblox New Game Update",
        publishedAt: new Date(now - 5 * 24 * 60 * 60 * 1000),
        channelTitle: 'RNG Master',
        videoId: 'mock-5',
        link: 'https://www.youtube.com/watch?v=mock-5',
        viewCount: 17100,
        likeCount: 1450,
        commentCount: 260,
        query: 'Roblox new game'
      }
    ];

    return mockVideos.filter(video => {
      const daysDiff =
        (new Date().getTime() - video.publishedAt.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= days;
    });
  }
}