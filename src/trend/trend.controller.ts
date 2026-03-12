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

  @Get('trend/exploding')
  async getExploding() {
    return this.trendService.getExplodingTrends();
  }

  @Get('trend/early')
  async getEarly() {
    return this.trendService.getEarlyTrends();
  }

  @Get('trend/all')
  async getAll() {
    return this.trendService.getAllTrends();
  }

  @Get('new-words')
  async getNewWords() {
    return this.tokenService.getNewWords();
  }

  @Get('/daily-job')
  async runFullDetection() {
    return this.dailyJobService.runFullDetection();
  }

  @Post('new-words/clear')
  async clearDatabase() {
    await this.tokenService.clearDatabase();
    return {
      message: '数据库已清空',
      timestamp: new Date().toISOString()
    };
  }

  @Post('new-words/analyze')
  async analyzeTokens() {
    await this.tokenService.analyzeTokens();
    return {
      message: '新词分析完成',
      timestamp: new Date().toISOString()
    };
  }

  @Post('new-words/reset')
  async resetAndRerun() {
    const startedAt = new Date();

    try {
      await this.tokenService.clearDatabase();
      await this.tokenService.analyzeTokens();
      await this.trendService.processTrends();

      const finishedAt = new Date();

      return {
        success: true,
        message: '系统已重置并重新生成趋势数据',
        startedAt: startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
        durationSeconds: Number(
          ((finishedAt.getTime() - startedAt.getTime()) / 1000).toFixed(2)
        )
      };
    } catch (error) {
      const finishedAt = new Date();

      return {
        success: false,
        message: '系统重置失败',
        error: error instanceof Error ? error.message : String(error),
        startedAt: startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
        durationSeconds: Number(
          ((finishedAt.getTime() - startedAt.getTime()) / 1000).toFixed(2)
        )
      };
    }
  }
}