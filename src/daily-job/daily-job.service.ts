// backend/src/daily-job/daily-job.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { TokenService } from '../services/token.service';
import { TrendService } from '../services/trend.service';

@Injectable()
export class DailyJobService {

  private readonly logger = new Logger(DailyJobService.name);

  constructor(
    private readonly tokenService: TokenService,
    private readonly trendService: TrendService
  ) { }

  async runJob() {

    const startTime = new Date();
    this.logger.log('🚀 开始执行每日 Roblox 趋势任务');

    try {

      // 1️⃣ 分析新词
      this.logger.log('📊 Step1: 分析 Roblox 新游戏词');
      await this.tokenService.analyzeTokens();

      // 2️⃣ 计算趋势
      this.logger.log('📈 Step2: 计算游戏趋势评分');
      await this.trendService.processTrends();

      // 3️⃣ 防止数据库为空 - 跳过，使用真实数据

      const endTime = new Date();

      this.logger.log('✅ 每日任务完成');

      return {
        status: 'success',
        startedAt: startTime,
        finishedAt: endTime,
        durationSeconds: (endTime.getTime() - startTime.getTime()) / 1000
      };

    } catch (error) {

      this.logger.error('❌ 每日任务失败', error);

      return {
        status: 'error',
        error: error.message,
        time: new Date()
      };
    }
  }
}