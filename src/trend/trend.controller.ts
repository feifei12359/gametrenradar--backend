import { Controller, Get } from '@nestjs/common';

@Controller('trend')
export class TrendController {

  @Get('exploding')
  getExploding() {
    return [
      {
        keyword: '爆发词1',
        prediction_score: 95,
        growth_rate: 1.5,
        acceleration: 0.8,
        platformScore: 80,
        aiScore: 90,
        firstSeenAt: new Date(),
        platforms: ['steam'],
      },
    ];
  }

  @Get('early')
  getEarly() {
    return [
      {
        keyword: '早期词1',
        prediction_score: 75,
        growth_rate: 1.1,
        acceleration: 0.4,
        platformScore: 60,
        aiScore: 70,
        firstSeenAt: new Date(),
        platforms: ['steam'],
      },
    ];
  }

  @Get('all')
  getAll() {
    return [
      {
        keyword: '全部词1',
        prediction_score: 60,
        growth_rate: 1.0,
        acceleration: 0.3,
        platformScore: 50,
        aiScore: 65,
        firstSeenAt: new Date(),
        platforms: ['steam', 'roblox'],
      },
    ];
  }
}
