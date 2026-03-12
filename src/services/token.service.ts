import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { YoutubeService } from '../youtube/youtube.service';

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly youtubeService: YoutubeService
  ) {}

  // 停用词黑名单（边界噪音词）
  private stopWords = new Set([
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

  // 颜色词列表
  private colorWords = new Set([
    'black', 'white', 'red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'brown', 'gray', 'grey'
  ]);

  // 商品相关词
  private productWords = new Set([
    'merch', 'shirt', 'shirts', 'pants', 'hat', 'hats', 'jacket', 'jackets', 'shoe', 'shoes', 'hoodie', 'hoodies'
  ]);

  // 明显垃圾词
  private junkWords = new Set([
    'video', 'videos', 'watch', 'subscribe', 'like', 'comment', 'share',
    'channel', 'youtube', 'tutorial', 'guide', 'how', 'play', 'playing',
    'episode', 'part', 'series', 'season', 'chapter',
    'duck', 'panic', 'children', 'amitabha', 'buddha', 'holiday', 'card', 'golf', 'demo', 'disc'
  ]);

  // 年份词模式
  private yearPattern = /^\d{4}$/;

  async analyzeTokens(): Promise<void> {
    this.logger.log('开始分析 Roblox 新游戏词');
    
    // 获取最近 7 天的 Roblox 视频
    const videos = await this.youtubeService.getRobloxVideos(7);
    
    // 提取游戏名候选（强制 2-4 词短语）
    const gameCandidates = this.extractGameCandidates(videos);
    
    for (const { gameName, score, videoCount, recentCount } of gameCandidates) {
      try {
        const existingWord = await this.prisma.newWord.findUnique({
          where: { token: gameName }
        });

        if (existingWord) {
          // 更新现有词
          await this.prisma.newWord.update({
            where: { token: gameName },
            data: {
              recent_count: existingWord.recent_count + recentCount,
              total_count: existingWord.total_count + videoCount,
              novelty_score: ((existingWord.recent_count + recentCount) / (existingWord.total_count + videoCount)) * score
            }
          });
        } else {
          // 创建新词
          await this.prisma.newWord.create({
            data: {
              token: gameName,
              novelty_score: 1.0 * score,
              recent_count: recentCount,
              total_count: videoCount,
              first_seen_at: new Date()
            }
          });
        }
      } catch (error) {
        this.logger.error(`分析游戏名 ${gameName} 失败:`, error);
      }
    }
  }

  async getNewWords(): Promise<{ items: any[] }> {
    // 先获取所有新词
    const allNewWords = await this.prisma.newWord.findMany({
      orderBy: { novelty_score: 'desc' },
      take: 200
    });

    // 过滤：只保留 2-4 词短语，且更像游戏名
    const filteredWords = allNewWords.filter(word => {
      const token = word.token;
      const words = token.split(' ');
      
      // 必须 2-4 个词
      if (words.length < 2 || words.length > 4) {
        return false;
      }
      
      // 过滤包含垃圾词的
      if (words.some(w => this.junkWords.has(w.toLowerCase()))) {
        return false;
      }
      
      // 过滤包含颜色词的
      if (words.some(w => this.colorWords.has(w.toLowerCase()))) {
        return false;
      }
      
      // 过滤包含商品词的
      if (words.some(w => this.productWords.has(w.toLowerCase()))) {
        return false;
      }
      
      // 过滤包含数字的
      if (/\d/.test(token)) {
        return false;
      }
      
      return true;
    }).slice(0, 100);

    return {
      items: filteredWords.map(word => ({
        token: word.token,
        noveltyScore: word.novelty_score,
        recentCount: word.recent_count,
        totalCount: word.total_count,
        firstSeenAt: word.first_seen_at.toISOString().split('T')[0]
      }))
    };
  }

  // 提取游戏名候选（强制 2-4 词短语）
  private extractGameCandidates(videos: any[]): { gameName: string; score: number; videoCount: number; recentCount: number }[] {
    const gameNameMap = new Map<string, { count: number; recentCount: number }>();
    
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
          const current = gameNameMap.get(gameName) || { count: 0, recentCount: 0 };
          gameNameMap.set(gameName, {
            count: current.count + 1,
            recentCount: current.recentCount + (this.isRecentVideo(video.publishedAt) ? 1 : 0)
          });
        }
      }
    }
    
    // 转换为数组并计算分数
    return Array.from(gameNameMap.entries())
      .filter(([_, data]) => data.count >= 2) // 至少出现 2 次
      .map(([gameName, data]) => {
        const score = this.calculateGameNameScore(data.count, data.recentCount);
        return { gameName, score, videoCount: data.count, recentCount: data.recentCount };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 50); // 只保留前 50 个
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
    let words = phrase.split(' ');
    
    // 去掉开头的停用词
    while (words.length > 0 && this.stopWords.has(words[0])) {
      words.shift();
    }
    
    // 去掉结尾的停用词
    while (words.length > 0 && this.stopWords.has(words[words.length - 1])) {
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
    if (words.some(word => this.junkWords.has(word))) {
      return false;
    }
    
    // 过滤包含颜色词的短语
    if (words.some(word => this.colorWords.has(word))) {
      return false;
    }
    
    // 过滤包含商品词的短语
    if (words.some(word => this.productWords.has(word))) {
      return false;
    }
    
    // 过滤包含数字的短语
    if (/\d/.test(phrase)) {
      return false;
    }
    
    // 过滤年份
    if (this.yearPattern.test(phrase)) {
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

  // 计算游戏名分数
  private calculateGameNameScore(count: number, recentCount: number): number {
    // 基础分数
    let score = count * 2;
    
    // 最近视频加分
    score += recentCount * 3;
    
    // 长度加分（2-4 词短语）
    if (count >= 2) {
      score += 5;
    }
    
    return score;
  }

  // 清库方法
  async clearDatabase(): Promise<void> {
    this.logger.log('开始清空数据库...');
    
    try {
      // 清空 NewWord 表
      await this.prisma.newWord.deleteMany({});
      this.logger.log('NewWord 表已清空');
      
      // 清空 Trend 表
      await this.prisma.trend.deleteMany({});
      this.logger.log('Trend 表已清空');
      
      this.logger.log('数据库清空完成');
    } catch (error) {
      this.logger.error('清空数据库失败:', error);
      throw error;
    }
  }
}
