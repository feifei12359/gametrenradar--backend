import { Controller, Get, Post } from '@nestjs/common';

@Controller('trend')
export class TrendController {
  @Get('exploding')
  getExplodingTrends() {
    return [
      { keyword: 'Space Shooter', score: 95 },
      { keyword: 'Puzzle Master', score: 88 },
    ];
  }

  @Get('early')
  getEarlyTrends() {
    return [
      { word: 'Puzzle Quest', prediction_score: 70, growth_rate: 5, acceleration: 0.5, platform_score: 60, ai_score: 65, first_seen_at: new Date(), platforms: ['Steam'] }
    ];
  }

  @Get('all')
  getAllTrends() {
    return [
      { word: 'AI Game', prediction_score: 95, growth_rate: 12, acceleration: 2, platform_score: 80, ai_score: 90, first_seen_at: new Date(), platforms: ['Steam'] },
      { word: 'Space Sandbox', prediction_score: 88, growth_rate: 10, acceleration: 1.5, platform_score: 70, ai_score: 85, first_seen_at: new Date(), platforms: ['Roblox'] },
      { word: 'Puzzle Quest', prediction_score: 70, growth_rate: 5, acceleration: 0.5, platform_score: 60, ai_score: 65, first_seen_at: new Date(), platforms: ['Steam'] }
    ];
  }

  @Post('daily-job')
  runDailyJob() {
    return { ok: true, message: '模拟完整检测已运行', timestamp: new Date() };
  }
}
