import { Injectable } from '@nestjs/common'

@Injectable()
export class TrendsService {
  async getTrendScore(gameName: string) {
    // 模拟趋势数据
    return {
      maxValue: Math.floor(Math.random() * 100),
      growthRate: Math.random() * 20,
      averageScore: Math.floor(Math.random() * 50)
    }
  }
}
