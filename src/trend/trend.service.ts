// backend/src/trend/trend.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class TrendService {
  getExploding() {
    return [
      { keyword: '爆发词1', prediction_score: 95, growth_rate: 1.5, acceleration: 0.8, platformScore: 80, aiScore: 90, firstSeenAt: new Date(), platforms: ['steam'] },
      { keyword: '爆发词2', prediction_score: 88, growth_rate: 1.2, acceleration: 0.5, platformScore: 70, aiScore: 85, firstSeenAt: new Date(), platforms: ['roblox'] },
    ];
  }

  getEarly() {
    return [
      { keyword: '早期词1', prediction_score: 75, growth_rate: 1.1, acceleration: 0.4, platformScore: 60, aiScore: 70, firstSeenAt: new Date(), platforms: ['steam'] },
    ];
  }

  getAll() {
    return [
      { keyword: '全部词1', prediction_score: 60, growth_rate: 1.0, acceleration: 0.3, platformScore: 50, aiScore: 65, firstSeenAt: new Date(), platforms: ['steam','roblox'] },
    ];
  }
}
