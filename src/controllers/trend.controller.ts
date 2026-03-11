import { Controller, Get, Post } from '@nestjs/common';
import { TrendService } from '../services/trend.service';
import { TokenService } from '../services/token.service';
import { DailyJobService } from '../jobs/daily-job.service';

@Controller()
export class TrendController {
  constructor(
    private readonly trendService: TrendService,
    private readonly tokenService: TokenService,
    private readonly dailyJobService: DailyJobService
  ) { }

  @Get('/trend/exploding')
  async getExplodingTrends() {
    return this.trendService.getExplodingTrends();
  }

  @Get('/trend/early')
  async getEarlyTrends() {
    return this.trendService.getEarlyTrends();
  }

  @Get('/trend/all')
  async getAllTrends() {
    return this.trendService.getAllTrends();
  }

  @Get('/new-words')
  async getNewWords() {
    return this.tokenService.getNewWords();
  }

  @Get('/daily-job')
  async runFullDetection() {
    return this.dailyJobService.runFullDetection();
  }

  @Post('/new-words/clear')
  async clearDatabase() {
    await this.tokenService.clearDatabase();
    return {
      message: '数据库已清空',
      timestamp: new Date().toISOString()
    };
  }

  @Post('/new-words/analyze')
  async analyzeTokens() {
    await this.tokenService.analyzeTokens();
    return {
      message: '新词分析完成',
      timestamp: new Date().toISOString()
    };
  }

  @Post('/new-words/reset')
  async resetSystem() {
    const startedAt = new Date();
    
    try {
      // 1. 清空数据库
      await this.tokenService.clearDatabase();
      
      // 2. 重新分析 Roblox 新词
      await this.tokenService.analyzeTokens();
      
      // 3. 重新生成趋势数据
      await this.trendService.processTrends();
      
      const finishedAt = new Date();
      const durationSeconds = Math.round((finishedAt.getTime() - startedAt.getTime()) / 1000);
      
      return {
        success: true,
        message: '系统已重置并重新生成趋势数据',
        startedAt: startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
        durationSeconds
      };
    } catch (error) {
      const finishedAt = new Date();
      const durationSeconds = Math.round((finishedAt.getTime() - startedAt.getTime()) / 1000);
      
      return {
        success: false,
        message: '系统重置失败',
        error: error instanceof Error ? error.message : String(error),
        startedAt: startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
        durationSeconds
      };
    }
  }
}
