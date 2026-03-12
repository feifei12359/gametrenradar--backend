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
      await this.tokenService.clearDatabase();

      const jobResult = await this.dailyJobService.runFullDetection();
      const endTime = new Date();
      const durationSeconds = Math.round(
        (endTime.getTime() - startTime.getTime()) / 1000
      );

      if (jobResult.success) {
        return {
          success: true,
          message: 'System reset and rerun completed',
          startedAt: startTime.toISOString(),
          finishedAt: endTime.toISOString(),
          durationSeconds,
          jobResult,
        };
      }

      throw new Error(jobResult.error || 'Rerun failed');
    } catch (error) {
      const endTime = new Date();
      const durationSeconds = Math.round(
        (endTime.getTime() - startTime.getTime()) / 1000
      );

      return {
        success: false,
        message: 'System reset failed',
        error: error instanceof Error ? error.message : String(error),
        startedAt: startTime.toISOString(),
        finishedAt: endTime.toISOString(),
        durationSeconds,
      };
    }
  }
}
