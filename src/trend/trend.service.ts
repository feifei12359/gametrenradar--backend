// backend/src/trend/trend.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class TrendService {
  // 获取爆发趋势
  getExploding() {
    // 这里可以接入你的数据库或算法
    return [
      { keyword: 'Space Shooter', score: 95 },
      { keyword: 'Puzzle Master', score: 88 },
    ];
  }

  // 获取早期趋势
  getEarly() {
    return [
      { keyword: 'Adventure Quest', score: 50 },
      { keyword: 'Tower Defense', score: 45 },
    ];
  }

  // 获取全部趋势
  getAll() {
    return [
      { keyword: 'Space Shooter', score: 95 },
      { keyword: 'Puzzle Master', score: 88 },
      { keyword: 'Adventure Quest', score: 50 },
      { keyword: 'Tower Defense', score: 45 },
    ];
  }
}
