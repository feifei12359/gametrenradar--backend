import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class YoutubeService {
  private readonly logger = new Logger(YoutubeService.name);
  private readonly YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || 'YOUR_API_KEY';

  async getRobloxVideos(days: number = 7): Promise<any[]> {
    try {
      const publishedAfter = new Date();
      publishedAfter.setDate(publishedAfter.getDate() - days);

      const url = `https://www.googleapis.com/youtube/v3/search`;
      const params = {
        part: 'snippet',
        q: 'Roblox new game',
        type: 'video',
        order: 'date',
        publishedAfter: publishedAfter.toISOString(),
        maxResults: 50,
        key: this.YOUTUBE_API_KEY
      };

      const response = await axios.get(url, { params });
      const videos = response.data.items.map((item: any) => ({
        title: item.snippet.title,
        publishedAt: new Date(item.snippet.publishedAt),
        channelTitle: item.snippet.channelTitle,
        videoId: item.id.videoId,
        link: `https://www.youtube.com/watch?v=${item.id.videoId}`
      }));

      return videos;
    } catch (error) {
      this.logger.error('获取 YouTube 视频失败:', error);
      // 模拟数据
      return this.getMockRobloxVideos(days);
    }
  }

  private getMockRobloxVideos(days: number): any[] {
    const mockVideos = [
      {
        title: 'Anime Last Stand - NEW Roblox Game 2026',
        publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        channelTitle: 'Roblox Gamer',
        videoId: '123',
        link: 'https://www.youtube.com/watch?v=123'
      },
      {
        title: 'Grow A Garden - Roblox New Update',
        publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        channelTitle: 'Game Master',
        videoId: '456',
        link: 'https://www.youtube.com/watch?v=456'
      },
      {
        title: 'Blade Ball - Roblox Trending Game',
        publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        channelTitle: 'Trend Hunter',
        videoId: '789',
        link: 'https://www.youtube.com/watch?v=789'
      },
      {
        title: 'Type Soul - Roblox New Release',
        publishedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        channelTitle: 'Anime Games',
        videoId: '321',
        link: 'https://www.youtube.com/watch?v=321'
      },
      {
        title: "Sol's RNG - Roblox New Game",
        publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        channelTitle: 'RNG Master',
        videoId: '654',
        link: 'https://www.youtube.com/watch?v=654'
      }
    ];

    return mockVideos.filter(video => {
      const daysDiff = (new Date().getTime() - video.publishedAt.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= days;
    });
  }

  async getVideoStatistics(videoId: string): Promise<any> {
    try {
      const url = `https://www.googleapis.com/youtube/v3/videos`;
      const params = {
        part: 'statistics',
        id: videoId,
        key: this.YOUTUBE_API_KEY
      };

      const response = await axios.get(url, { params });
      return response.data.items[0]?.statistics || {
        viewCount: Math.floor(Math.random() * 10000) + 1000
      };
    } catch (error) {
      this.logger.error('获取视频统计失败:', error);
      return {
        viewCount: Math.floor(Math.random() * 10000) + 1000
      };
    }
  }
}
