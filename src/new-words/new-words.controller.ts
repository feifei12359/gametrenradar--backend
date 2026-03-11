import { Controller, Get, Post } from '@nestjs/common';
import { TokenService } from '../services/token.service';
import { TrendService } from '../services/trend.service';

@Controller('new-words')
export class NewWordsController {
  constructor(
    private readonly tokenService: TokenService,
    private readonly trendService: TrendService
  ) { }

  @Get()
  async getNewWords() {
    return this.tokenService.getNewWords();
  }

  @Post('clear')
  async clearDatabase() {
    await this.tokenService.clearDatabase();
    return {
      message: '数据库已清空',
      timestamp: new Date().toISOString()
    };
  }

  @Post('analyze')
  async analyzeTokens() {
    await this.tokenService.analyzeTokens();
    return {
      message: '新词分析完成',
      timestamp: new Date().toISOString()
    };
  }

  @Post('reset')
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
