import { Controller, Post } from '@nestjs/common';
import { TokenService } from '../services/token.service';
import { TrendService } from '../services/trend.service';
import { DailyJobService } from '../jobs/daily-job.service';

@Controller('system')
export class SystemController {
  constructor(
    private readonly tokenService: TokenService,
    private readonly trendService: TrendService,
    private readonly dailyJobService: DailyJobService
  ) {}

  @Post('reset')
  async resetSystem() {
    const startTime = new Date();
    
    try {
      // 1. 清空数据库
      await this.tokenService.clearDatabase();
      
      // 2. 重新执行趋势检测
      const jobResult = await this.dailyJobService.runFullDetection();
      
      const endTime = new Date();
      const durationSeconds = Math.round((endTime.getTime() - startTime.getTime()) / 1000);
      
      if (jobResult.success) {
        return {
          success: true,
          message: '系统已重置并重跑完成',
          startedAt: startTime.toISOString(),
          finishedAt: endTime.toISOString(),
          durationSeconds,
          jobResult
        };
      } else {
        throw new Error(jobResult.message || '重跑失败');
      }
    } catch (error) {
      const endTime = new Date();
      const durationSeconds = Math.round((endTime.getTime() - startTime.getTime()) / 1000);
      
      return {
        success: false,
        message: '系统重置失败',
        error: error instanceof Error ? error.message : String(error),
        startedAt: startTime.toISOString(),
        finishedAt: endTime.toISOString(),
        durationSeconds
      };
    }
  }
}
