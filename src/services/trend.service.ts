import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { YoutubeService } from '../youtube/youtube.service';
import { GoogleTrendsService } from './google-trends.service';
import { AIScoreService } from './ai-score.service';

@Injectable()
export class TrendService {
  private readonly logger = new Logger(TrendService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly youtubeService: YoutubeService,
    private readonly googleTrendsService: GoogleTrendsService,
    private readonly aiScoreService: AIScoreService
  ) {}

  async processTrends(): Promise<void> {
    this.logger.log('开始处理趋势数据');
    
    // 获取最近 7 天的 Roblox 视频
    const videos = await this.youtubeService.getRobloxVideos(7);
    
    // 提取游戏名候选
    const gameCandidates = this.extractGameCandidates(videos);
    
    for (const candidate of gameCandidates) {
      try {
        // 获取 Google Trends 数据
        const trendData = await this.googleTrendsService.getTrendData(candidate.gameName);
        
        // 计算 AI 分数
        const aiScore = await this.aiScoreService.calculateAIScore(
          candidate.gameName,
          candidate.videoCount,
          candidate.recentCount
        );
        
        // 计算平台分数
        const platforms = ['youtube', 'google_trends'];
        const platformScore = await this.aiScoreService.calculatePlatformScore(
          candidate.gameName,
          platforms
        );
        
        // 计算最终分数
        const scores = this.calculateScores(candidate, trendData, aiScore, platformScore);
        
        // 使用 upsert 更新或创建趋势
        await this.prisma.trend.upsert({
          where: { keyword: candidate.gameName },
          update: {
            prediction_score: scores.predictionScore,
            growth_rate: scores.growthRate,
            acceleration: scores.acceleration,
            platform_score: scores.platformScore,
            ai_score: scores.aiScore,
            platforms: platforms.join(','),
            first_seen_at: candidate.firstSeenAt
          },
          create: {
            keyword: candidate.gameName,
            prediction_score: scores.predictionScore,
            growth_rate: scores.growthRate,
            acceleration: scores.acceleration,
            platform_score: scores.platformScore,
            ai_score: scores.aiScore,
            platforms: platforms.join(','),
            first_seen_at: candidate.firstSeenAt
          }
        });
        
        this.logger.log(`处理趋势 ${candidate.gameName} 完成`);
      } catch (error) {
        this.logger.error(`处理趋势 ${candidate.gameName} 失败:`, error);
      }
    }
  }

  async getExplodingTrends(): Promise<any[]> {
    const trends = await this.prisma.trend.findMany({
      orderBy: { prediction_score: 'desc' },
      take: 20
    });

    return trends.map(trend => ({
      keyword: trend.keyword,
      prediction_score: trend.prediction_score,
      growth_rate: trend.growth_rate,
      acceleration: trend.acceleration,
      platform_score: trend.platform_score,
      ai_score: trend.ai_score,
      platforms: trend.platforms,
      first_seen_at: trend.first_seen_at.toISOString()
    }));
  }

  async getEarlyTrends(): Promise<any[]> {
    const trends = await this.prisma.trend.findMany({
      orderBy: { first_seen_at: 'desc' },
      take: 20
    });

    return trends.map(trend => ({
      keyword: trend.keyword,
      prediction_score: trend.prediction_score,
      growth_rate: trend.growth_rate,
      acceleration: trend.acceleration,
      platform_score: trend.platform_score,
      ai_score: trend.ai_score,
      platforms: trend.platforms,
      first_seen_at: trend.first_seen_at.toISOString()
    }));
  }

  async getAllTrends(): Promise<any[]> {
    const trends = await this.prisma.trend.findMany({
      orderBy: { prediction_score: 'desc' },
      take: 50
    });

    return trends.map(trend => ({
      keyword: trend.keyword,
      prediction_score: trend.prediction_score,
      growth_rate: trend.growth_rate,
      acceleration: trend.acceleration,
      platform_score: trend.platform_score,
      ai_score: trend.ai_score,
      platforms: trend.platforms,
      first_seen_at: trend.first_seen_at.toISOString()
    }));
  }

  // 提取游戏名候选
  private extractGameCandidates(videos: any[]): any[] {
    const gameNameMap = new Map<string, { count: number; recentCount: number; firstSeenAt: Date }>();
    
    for (const video of videos) {
      const title = video.title.toLowerCase();
      
      // 提取 2-4 词短语
      const phrases = this.extractPhrases(title);
      
      for (const phrase of phrases) {
        // 清洗短语（去掉首尾噪音词）
        const cleanedPhrase = this.cleanPhrase(phrase);
        
        // 清洗后必须 2-4 个词
        if (!cleanedPhrase) continue;
        
        const words = cleanedPhrase.split(' ');
        if (words.length < 2 || words.length > 4) continue;
        
        // 验证是否为有效的游戏名
        if (!this.isValidGameName(cleanedPhrase)) continue;
        
        const gameName = this.normalizeGameName(cleanedPhrase);
        
        if (gameName.length > 4) {
          const current = gameNameMap.get(gameName) || { count: 0, recentCount: 0, firstSeenAt: video.publishedAt };
          gameNameMap.set(gameName, {
            count: current.count + 1,
            recentCount: current.recentCount + (this.isRecentVideo(video.publishedAt) ? 1 : 0),
            firstSeenAt: current.firstSeenAt
          });
        }
      }
    }
    
    // 转换为数组
    return Array.from(gameNameMap.entries())
      .filter(([_, data]) => data.count >= 2) // 至少出现 2 次
      .map(([gameName, data]) => ({
        gameName,
        videoCount: data.count,
        recentCount: data.recentCount,
        firstSeenAt: data.firstSeenAt
      }));
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

  // 清洗短语：去掉首尾噪音词
  private cleanPhrase(phrase: string): string | null {
    const stopWords = new Set([
      'game', 'games', 'black', 'white', 'red', 'blue', 'green',
      'item', 'items', 'merch', 'shirt', 'shirts', 'pants',
      'free', 'sale', 'offsale', 'limited', 'pre', 'new', 'old',
      'update', 'official', 'roblox', 'version',
      '2024', '2025', '2026',
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must',
      'my', 'your', 'his', 'her', 'its', 'our', 'their',
      'this', 'that', 'these', 'those',
      'i', 'you', 'he', 'she', 'it', 'we', 'they',
      'what', 'which', 'who', 'when', 'where', 'why', 'how',
      'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such',
      'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
      'can', 'will', 'just', 'should', 'now',
      'holiday', 'card', 'golf', 'demo', 'disc', 'duck', 'children', 'panic', 'curse', 'amitabha', 'buddha'
    ]);

    let words = phrase.split(' ');
    
    // 去掉开头的停用词
    while (words.length > 0 && stopWords.has(words[0])) {
      words.shift();
    }
    
    // 去掉结尾的停用词
    while (words.length > 0 && stopWords.has(words[words.length - 1])) {
      words.pop();
    }
    
    // 清洗后不足 2 个词，丢弃
    if (words.length < 2) {
      return null;
    }
    
    return words.join(' ');
  }

  // 检查是否为有效的游戏名
  private isValidGameName(phrase: string): boolean {
    const words = phrase.split(' ');
    
    // 必须 2-4 个词
    if (words.length < 2 || words.length > 4) {
      return false;
    }
    
    // 每个词长度必须 >= 3
    if (words.some(word => word.length < 3)) {
      return false;
    }
    
    // 过滤包含垃圾词的短语
    const junkWords = new Set([
      'video', 'videos', 'watch', 'subscribe', 'like', 'comment', 'share',
      'channel', 'youtube', 'tutorial', 'guide', 'how', 'play', 'playing',
      'episode', 'part', 'series', 'season', 'chapter',
      'duck', 'panic', 'children', 'amitabha', 'buddha', 'holiday', 'card', 'golf', 'demo', 'disc'
    ]);
    
    if (words.some(word => junkWords.has(word))) {
      return false;
    }
    
    // 过滤包含颜色词的短语
    const colorWords = new Set([
      'black', 'white', 'red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'brown', 'gray', 'grey'
    ]);
    
    if (words.some(word => colorWords.has(word))) {
      return false;
    }
    
    // 过滤包含商品词的短语
    const productWords = new Set([
      'merch', 'shirt', 'shirts', 'pants', 'hat', 'hats', 'jacket', 'jackets', 'shoe', 'shoes', 'hoodie', 'hoodies'
    ]);
    
    if (words.some(word => productWords.has(word))) {
      return false;
    }
    
    // 过滤包含数字的短语
    if (/\d/.test(phrase)) {
      return false;
    }
    
    // 过滤年份
    const yearPattern = /^\d{4}$/;
    if (yearPattern.test(phrase)) {
      return false;
    }
    
    return true;
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
  private calculateScores(candidate: any, trendData: any, aiScore: number, platformScore: number): any {
    // 视频数量分数 (0-30)
    const videoScore = Math.min(30, candidate.videoCount * 3);
    
    // 最近视频分数 (0-20)
    const recentScore = Math.min(20, candidate.recentCount * 5);
    
    // 趋势分数 (0-30)
    const trendScore = Math.min(30, trendData.score * 0.3);
    
    // 增长分数 (0-20)
    const growthScore = Math.min(20, trendData.growth * 8);
    
    // 综合分数
    const predictionScore = Math.min(100, videoScore + recentScore + trendScore + growthScore);
    
    return {
      predictionScore,
      growthRate: trendData.growth,
      acceleration: trendData.growth * 0.5,
      platformScore,
      aiScore
    };
  }
}
