import { Injectable, Logger } from '@nestjs/common';
import { TokenService } from '../services/token.service';
import { TrendService } from '../services/trend.service';
import * as cron from 'node-cron';

@Injectable()
export class DailyJobService {
  private readonly logger = new Logger(DailyJobService.name);

  constructor(
    private readonly tokenService: TokenService,
    private readonly trendService: TrendService
  ) {
    this.setupCronJob();
  }

  private setupCronJob() {
    // 每天凌晨2点执行
    cron.schedule('0 2 * * *', async () => {
      this.logger.log('开始执行每日趋势检测任务');
      await this.runFullDetection();
      this.logger.log('每日趋势检测任务完成');
    });
  }

  async runFullDetection() {
    const startTime = new Date();
    this.logger.log('开始执行完整趋势检测任务');

    try {
      // 1. 分析新词（从 YouTube 视频标题中提取 2-4 词短语）
      this.logger.log('1. 开始分析 Roblox 新游戏词');
      await this.tokenService.analyzeTokens();

      // 2. 处理趋势数据（整合 YouTube + Google Trends + AI 评分）
      this.logger.log('2. 开始处理趋势数据');
      await this.trendService.processTrends();

      const endTime = new Date();
      const durationSeconds = Math.round((endTime.getTime() - startTime.getTime()) / 1000);

      this.logger.log(`完整趋势检测任务完成，耗时 ${durationSeconds} 秒`);

      return {
        success: true,
        status: 'success',
        startedAt: startTime.toISOString(),
        finishedAt: endTime.toISOString(),
        durationSeconds
      };
    } catch (error) {
      this.logger.error('完整趋势检测任务失败:', error);

      const endTime = new Date();
      const durationSeconds = Math.round((endTime.getTime() - startTime.getTime()) / 1000);

      return {
        success: false,
        status: 'failed',
        startedAt: startTime.toISOString(),
        finishedAt: endTime.toISOString(),
        durationSeconds,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  async clearDatabase() {
    this.logger.log('开始清空数据库');

    try {
      await this.tokenService.clearDatabase();

      this.logger.log('数据库清空完成');

      return {
        success: true,
        message: 'Database cleared successfully',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('清空数据库失败:', error);

      return {
        success: false,
        message: 'Failed to clear database',
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      };
    }
  }
}
