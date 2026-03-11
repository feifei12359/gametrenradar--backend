import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { YoutubeService } from '../youtube/youtube.service';
import { GoogleTrendsService } from './google-trends.service';

@Injectable()
export class TrendService {
  private readonly logger = new Logger(TrendService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly youtubeService: YoutubeService,
    private readonly googleTrendsService: GoogleTrendsService
  ) { }

  async processTrends(): Promise<void> {
    this.logger.log('开始处理 Roblox 游戏趋势');

    // 获取最近 7 天的 Roblox 视频
    const videos = await this.youtubeService.getRobloxVideos(7);
    this.logger.log(`获取到 ${videos.length} 个 Roblox 视频`);

    // 提取游戏名候选
    const gameCandidates = this.extractGameCandidates(videos);
    this.logger.log(`提取到 ${gameCandidates.length} 个游戏名候选`);

    // 处理每个候选游戏名
    for (const candidate of gameCandidates) {
      try {
        // 获取趋势数据
        const trendData = await this.googleTrendsService.getTrendData(candidate.gameName);

        // 计算分数
        const scores = this.calculateScores(candidate, trendData);

        // 检查是否已存在
        const existingTrend = await this.prisma.trend.findUnique({
          where: { keyword: candidate.gameName }
        });

        if (existingTrend) {
          // 更新现有趋势
          await this.prisma.trend.update({
            where: { keyword: candidate.gameName },
            data: {
              prediction_score: scores.predictionScore,
              growth_rate: scores.growthRate,
              acceleration: scores.acceleration,
              platform_score: scores.platformScore,
              ai_score: scores.aiScore,
              platforms: 'roblox,youtube'
            }
          });
        } else {
          // 创建新趋势
          await this.prisma.trend.create({
            data: {
              keyword: candidate.gameName,
              prediction_score: scores.predictionScore,
              growth_rate: scores.growthRate,
              acceleration: scores.acceleration,
              platform_score: scores.platformScore,
              ai_score: scores.aiScore,
              platforms: 'roblox,youtube',
              first_seen_at: new Date()
            }
          });
        }
      } catch (error) {
        this.logger.error(`处理趋势 ${candidate.gameName} 失败:`, error);
      }
    }
  }

  async getExplodingTrends() {
    return this.prisma.trend.findMany({
      where: { prediction_score: { gt: 70 } },
      orderBy: { prediction_score: 'desc' }
    });
  }

  async getEarlyTrends() {
    return this.prisma.trend.findMany({
      where: {
        prediction_score: {
          gte: 40,
          lte: 70
        }
      },
      orderBy: { prediction_score: 'desc' }
    });
  }

  async getAllTrends() {
    return this.prisma.trend.findMany({
      orderBy: { prediction_score: 'desc' }
    });
  }

  // 提取游戏名候选
  private extractGameCandidates(videos: any[]): { gameName: string; videoCount: number; recentVideos: number }[] {
    const gameNameMap = new Map<string, { count: number; recentCount: number }>();

    const stopWords = new Set([
      'game', 'games', 'new', 'roblox', 'update', 'official', 'version',
      '2024', '2025', '2026', 'free', 'sale', 'limited'
    ]);

    const colorWords = new Set(['black', 'white', 'red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink']);

    for (const video of videos) {
      const title = video.title.toLowerCase();

      // 提取 2-4 词短语
      const phrases = this.extractPhrases(title);

      for (const phrase of phrases) {
        const words = phrase.split(' ');

        // 过滤条件
        const hasStopWord = words.some(word => stopWords.has(word));
        const hasColorWord = words.some(word => colorWords.has(word));
        const hasShortWord = words.some(word => word.length < 3);
        const hasNumber = /\d/.test(phrase);

        if (!hasStopWord && !hasColorWord && !hasShortWord && !hasNumber) {
          const normalizedPhrase = this.normalizeGameName(phrase);

          if (normalizedPhrase.length > 4) {
            const current = gameNameMap.get(normalizedPhrase) || { count: 0, recentCount: 0 };
            gameNameMap.set(normalizedPhrase, {
              count: current.count + 1,
              recentCount: current.recentCount + (this.isRecentVideo(video.publishedAt) ? 1 : 0)
            });
          }
        }
      }
    }

    // 转换为数组并过滤
    return Array.from(gameNameMap.entries())
      .filter(([_, data]) => data.count >= 2) // 至少出现 2 次
      .map(([gameName, data]) => ({
        gameName,
        videoCount: data.count,
        recentVideos: data.recentCount
      }))
      .sort((a, b) => b.videoCount - a.videoCount);
  }

  // 提取短语
  private extractPhrases(text: string): string[] {
    const words = text
      .replace(/[^a-zA-Z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 0);

    const phrases: string[] = [];

    // 2 词短语
    for (let i = 0; i < words.length - 1; i++) {
      phrases.push(`${words[i]} ${words[i + 1]}`);
    }

    // 3 词短语
    for (let i = 0; i < words.length - 2; i++) {
      phrases.push(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
    }

    // 4 词短语
    for (let i = 0; i < words.length - 3; i++) {
      phrases.push(`${words[i]} ${words[i + 1]} ${words[i + 2]} ${words[i + 3]}`);
    }

    return phrases;
  }

  // 标准化游戏名
  private normalizeGameName(name: string): string {
    return name
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // 判断是否为最近视频
  private isRecentVideo(publishedAt: Date): boolean {
    const now = new Date();
    const diffDays = (now.getTime() - publishedAt.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 3;
  }

  // 计算分数
  private calculateScores(candidate: any, trendData: any): any {
    // 视频数量分数 (0-30)
    const videoScore = Math.min(30, candidate.videoCount * 3);

    // 最近视频分数 (0-20)
    const recentScore = Math.min(20, candidate.recentVideos * 5);

    // 趋势分数 (0-30)
    const trendScore = Math.min(30, trendData.score * 0.3);

    // 增长分数 (0-20)
    const growthScore = Math.min(20, trendData.growth * 8);

    // 综合分数
    const predictionScore = videoScore + recentScore + trendScore + growthScore;

    return {
      predictionScore: Math.min(100, predictionScore),
      growthRate: trendData.growth,
      acceleration: Math.random() * 1,
      platformScore: 85, // Roblox + YouTube
      aiScore: predictionScore * 0.9
    };
  }

  async generateSampleTrends() {
    // 检查是否已有数据
    const count = await this.prisma.trend.count();
    if (count > 0) {
      return;
    }

    // 生成示例数据
    const sampleGames = [
      'Anime Last Stand',
      'Grow A Garden',
      'Blade Ball',
      'Type Soul',
      "Sol's RNG"
    ];

    for (const gameName of sampleGames) {
      try {
        const scores = this.calculateScores(
          { gameName, videoCount: 5, recentVideos: 3 },
          { score: 80, growth: 1.5 }
        );

        await this.prisma.trend.create({
          data: {
            keyword: gameName,
            prediction_score: scores.predictionScore,
            growth_rate: scores.growthRate,
            acceleration: scores.acceleration,
            platform_score: scores.platformScore,
            ai_score: scores.aiScore,
            platforms: 'roblox,youtube',
            first_seen_at: new Date()
          }
        });
      } catch (error) {
        this.logger.error(`生成示例趋势 ${gameName} 失败:`, error);
      }
    }
  }
}
