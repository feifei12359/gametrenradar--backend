import { Controller, Get, Post } from '@nestjs/common';

// 这里设置开关：true = 使用真实数据，false = 使用模拟数据
const USE_REAL_DATA = false;

@Controller('trend')
export class TrendController {
  // 爆发趋势
  @Get('exploding')
  async getExplodingTrends() {
    if (USE_REAL_DATA) {
      // TODO: 替换为真实抓取逻辑或数据库查询
      // 例如：return await this.trendService.getExplodingTrendsFromDB();
      return [
        { keyword: '真实游戏 1', score: 92 },
        { keyword: '真实游戏 2', score: 85 },
      ];
    }

    // 模拟数据
    return [
      { keyword: 'Space Shooter', score: 95 },
      { keyword: 'Puzzle Master', score: 88 },
    ];
  }

  // 早期趋势
  @Get('early')
  async getEarlyTrends() {
    if (USE_REAL_DATA) {
      // TODO: 替换为真实抓取逻辑或数据库查询
      return [
        {
          word: '真实早期游戏',
          prediction_score: 75,
          growth_rate: 6,
          acceleration: 0.7,
          platform_score: 65,
          ai_score: 70,
          first_seen_at: new Date(),
          platforms: ['Steam'],
        },
      ];
    }

    // 模拟数据
    return [
      {
        word: 'Puzzle Quest',
        prediction_score: 70,
        growth_rate: 5,
        acceleration: 0.5,
        platform_score: 60,
        ai_score: 65,
        first_seen_at: new Date(),
        platforms: ['Steam'],
      },
    ];
  }

  // 全部趋势
  @Get('all')
  async getAllTrends() {
    if (USE_REAL_DATA) {
      // TODO: 替换为真实抓取逻辑或数据库查询
      return [
        {
          word: '真实游戏 A',
          prediction_score: 95,
          growth_rate: 12,
          acceleration: 2,
          platform_score: 80,
          ai_score: 90,
          first_seen_at: new Date(),
          platforms: ['Steam'],
        },
      ];
    }

    // 模拟数据
    return [
      {
        word: 'AI Game',
        prediction_score: 95,
        growth_rate: 12,
        acceleration: 2,
        platform_score: 80,
        ai_score: 90,
        first_seen_at: new Date(),
        platforms: ['Steam'],
      },
      {
        word: 'Space Sandbox',
        prediction_score: 88,
        growth_rate: 10,
        acceleration: 1.5,
        platform_score: 70,
        ai_score: 85,
        first_seen_at: new Date(),
        platforms: ['Roblox'],
      },
      {
        word: 'Puzzle Quest',
        prediction_score: 70,
        growth_rate: 5,
        acceleration: 0.5,
        platform_score: 60,
        ai_score: 65,
        first_seen_at: new Date(),
        platforms: ['Steam'],
      },
    ];
  }

  // 日常任务
  @Post('daily-job')
  async runDailyJob() {
    if (USE_REAL_DATA) {
      // TODO: 调用真实爬虫/数据更新逻辑
      return { ok: true, message: '真实完整检测已运行', timestamp: new Date() };
    }

    // 模拟数据
    return { ok: true, message: '模拟完整检测已运行', timestamp: new Date() };
  }
}
