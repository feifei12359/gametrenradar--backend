import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class GoogleTrendsService {
  private readonly logger = new Logger(GoogleTrendsService.name);

  async getTrendScore(keyword: string): Promise<number> {
    try {
      // 这里应该使用 Google Trends API
      // 由于 API 限制，我们使用模拟数据
      this.logger.log(`获取 ${keyword} 的趋势分数`);
      
      // 模拟趋势分数
      const baseScore = Math.random() * 50 + 20; // 20-70
      
      // 对游戏相关词给予更高分数
      const gameKeywords = ['anime', 'tower', 'defense', 'simulator', 'tycoon', 'obby', 'battle'];
      const hasGameKeyword = gameKeywords.some(key => keyword.toLowerCase().includes(key));
      
      if (hasGameKeyword) {
        return baseScore + 20;
      }
      
      return baseScore;
    } catch (error) {
      this.logger.error('获取趋势分数失败:', error);
      return 30; // 默认分数
    }
  }

  async isTrending(keyword: string): Promise<boolean> {
    try {
      // 模拟判断是否在趋势中
      const score = await this.getTrendScore(keyword);
      return score > 60;
    } catch (error) {
      this.logger.error('判断趋势失败:', error);
      return false;
    }
  }

  async getTrendData(keyword: string): Promise<any> {
    try {
      // 模拟趋势数据
      return {
        keyword,
        score: await this.getTrendScore(keyword),
        isTrending: await this.isTrending(keyword),
        growth: Math.random() * 2 + 0.5, // 0.5-2.5
        daysSinceFirstSeen: Math.floor(Math.random() * 30) + 1
      };
    } catch (error) {
      this.logger.error('获取趋势数据失败:', error);
      return {
        keyword,
        score: 30,
        isTrending: false,
        growth: 1,
        daysSinceFirstSeen: 7
      };
    }
  }
}
