import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(private readonly prisma: PrismaService) {}

  async analyzeTokens(tokens: string[]): Promise<void> {
    this.logger.log('开始分析关键词');
    
    for (const token of tokens) {
      try {
        const existingWord = await this.prisma.newWord.findUnique({
          where: { token }
        });

        if (existingWord) {
          // 更新现有词
          await this.prisma.newWord.update({
            where: { token },
            data: {
              recent_count: existingWord.recent_count + 1,
              total_count: existingWord.total_count + 1,
              novelty_score: (existingWord.recent_count + 1) / (existingWord.total_count + 1)
            }
          });
        } else {
          // 创建新词
          await this.prisma.newWord.create({
            data: {
              token,
              novelty_score: 1.0,
              recent_count: 1,
              total_count: 1,
              first_seen_at: new Date()
            }
          });
        }
      } catch (error) {
        this.logger.error(`分析关键词 ${token} 失败:`, error);
      }
    }
  }

  async getNewWords(): Promise<{ items: any[] }> {
    const newWords = await this.prisma.newWord.findMany({
      orderBy: { novelty_score: 'desc' },
      take: 100
    });

    return {
      items: newWords.map(word => ({
        token: word.token,
        noveltyScore: word.novelty_score,
        recentCount: word.recent_count,
        totalCount: word.total_count,
        firstSeenAt: word.first_seen_at.toISOString().split('T')[0]
      }))
    };
  }

  async calculateWordFrequency(tokens: string[]): Promise<Map<string, number>> {
    const frequencyMap = new Map<string, number>();
    
    for (const token of tokens) {
      frequencyMap.set(token, (frequencyMap.get(token) || 0) + 1);
    }
    
    return frequencyMap;
  }
}
