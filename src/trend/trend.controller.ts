import { Controller, Get, Post } from '@nestjs/common';

@Controller('api')
export class TrendController {
  @Get('trend/exploding')
  async getExplodingTrends() {
    return [
      {
        word: 'Space Shooter',
        prediction_score: 85,
        growth_rate: 0.8,
        acceleration: 0.5,
        platform_score: 70,
        ai_score: 90,
        first_seen_at: new Date(),
        platforms: ['Steam', 'Roblox']
      },
      {
        word: 'Puzzle Master',
        prediction_score: 78,
        growth_rate: 0.6,
        acceleration: 0.3,
        platform_score: 60,
        ai_score: 80,
        first_seen_at: new Date(),
        platforms: ['Steam']
      }
    ];
  }

  @Get('trend/early')
  async getEarlyTrends() {
    return [];
  }

  @Get('trend/all')
  async getAllTrends() {
    return [
      {
        word: 'Space Shooter',
        prediction_score: 85,
        growth_rate: 0.8,
        acceleration: 0.5,
        platform_score: 70,
        ai_score: 90,
        first_seen_at: new Date(),
        platforms: ['Steam', 'Roblox']
      },
      {
        word: 'Puzzle Master',
        prediction_score: 78,
        growth_rate: 0.6,
        acceleration: 0.3,
        platform_score: 60,
        ai_score: 80,
        first_seen_at: new Date(),
        platforms: ['Steam']
      }
    ];
  }

  @Get('new-words')
  async getNewWords() {
    return { items: [] };
  }

  @Post('daily-job')
  async runDailyJob() {
    return { ok: true, message: '完整检测已运行', timestamp: new Date() };
  }

  @Get('health')
  async health() {
    return { ok: true, time: new Date() };
  }
}
