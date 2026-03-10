import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AIScoreService } from './ai-score.service';

@Injectable()
export class TrendService {
  private readonly logger = new Logger(TrendService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiScoreService: AIScoreService
  ) {}

  async processTrends(keywords: string[]): Promise<void> {
    this.logger.log('开始处理趋势数据');
    
    for (const keyword of keywords) {
      try {
        // 模拟计算增长速率和加速度
        const growthRate = Math.random() * 2; // 0-2
        const acceleration = Math.random() * 1; // 0-1
        
        // 模拟平台数据
        const platforms = ['steam', 'roblox', 'reddit'];
        const platformScore = this.aiScoreService.calculatePlatformScore(platforms);
        
        // 计算 AI 评分
        const aiScore = this.aiScoreService.calculateAIScore(keyword);
        
        // 计算预测分数
        const predictionScore = this.aiScoreService.calculatePredictionScore(
          growthRate,
          acceleration,
          platformScore,
          aiScore
        );

        // 检查是否已存在
        const existingTrend = await this.prisma.trend.findUnique({
          where: { keyword }
        });

        if (existingTrend) {
          // 更新现有趋势
          await this.prisma.trend.update({
            where: { keyword },
            data: {
              prediction_score: predictionScore,
              growth_rate: growthRate,
              acceleration: acceleration,
              platform_score: platformScore,
              ai_score: aiScore
            }
          });
        } else {
          // 创建新趋势
          await this.prisma.trend.create({
            data: {
              keyword,
              prediction_score: predictionScore,
              growth_rate: growthRate,
              acceleration: acceleration,
              platform_score: platformScore,
              ai_score: aiScore,
              platforms: platforms.join(','),
              first_seen_at: new Date()
            }
          });
        }
      } catch (error) {
        this.logger.error(`处理趋势 ${keyword} 失败:`, error);
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

  async generateSampleTrends() {
    // 检查是否已有数据
    const count = await this.prisma.trend.count();
    if (count > 0) {
      return;
    }

    // 生成示例数据
    const sampleKeywords = [
      'Tower Defense',
      'Idle RPG',
      'Space Shooter',
      'Roblox Obby',
      'Roguelike Shooter'
    ];

    for (const keyword of sampleKeywords) {
      try {
        const growthRate = Math.random() * 2;
        const acceleration = Math.random() * 1;
        const platforms = ['steam', 'roblox'];
        const platformScore = this.aiScoreService.calculatePlatformScore(platforms);
        const aiScore = this.aiScoreService.calculateAIScore(keyword);
        const predictionScore = this.aiScoreService.calculatePredictionScore(
          growthRate,
          acceleration,
          platformScore,
          aiScore
        );

        await this.prisma.trend.create({
          data: {
            keyword,
            prediction_score: predictionScore,
            growth_rate: growthRate,
            acceleration: acceleration,
            platform_score: platformScore,
            ai_score: aiScore,
            platforms: platforms.join(','),
            first_seen_at: new Date()
          }
        });
      } catch (error) {
        this.logger.error(`生成示例趋势 ${keyword} 失败:`, error);
      }
    }
  }
}
