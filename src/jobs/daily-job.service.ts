import { Injectable, Logger } from '@nestjs/common';
import { CrawlerService } from '../services/crawler.service';
import { TokenService } from '../services/token.service';
import { TrendService } from '../services/trend.service';
import * as cron from 'node-cron';

@Injectable()
export class DailyJobService {
  private readonly logger = new Logger(DailyJobService.name);

  constructor(
    private readonly crawlerService: CrawlerService,
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
    try {
      // 1. 抓取平台数据
      this.logger.log('1. 开始抓取平台数据');
      const keywords = await this.crawlerService.crawlAllPlatforms();
      
      // 2. 分析关键词
      this.logger.log('2. 开始分析关键词');
      await this.tokenService.analyzeTokens(keywords);
      
      // 3. 处理趋势
      this.logger.log('3. 开始处理趋势数据');
      await this.trendService.processTrends(keywords);
      
      // 4. 生成示例数据（如果需要）
      this.logger.log('4. 检查并生成示例数据');
      await this.trendService.generateSampleTrends();
      
      this.logger.log('完整趋势检测任务完成');
      return { success: true, message: 'Trend detection completed' };
    } catch (error) {
      this.logger.error('完整趋势检测任务失败:', error);
      return { success: false, message: 'Trend detection failed' };
    }
  }
}
