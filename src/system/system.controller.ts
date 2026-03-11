import { Controller, Post } from '@nestjs/common';
import { TokenService } from '../services/token.service';
import { TrendService } from '../services/trend.service';

@Controller('system')
export class SystemController {
  constructor(
    private readonly tokenService: TokenService,
    private readonly trendService: TrendService
  ) {}

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
