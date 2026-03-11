import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(private readonly prisma: PrismaService) { }

  // 停用词黑名单
  private stopWords = new Set([
    'game', 'games', 'black', 'white', 'red', 'blue', 'green',
    'item', 'items', 'merch', 'shirt', 'shirts', 'pants',
    'free', 'sale', 'offsale', 'limited', 'pre', 'new', 'old',
    'update', 'official', 'roblox', 'version',
    '2024', '2025', '2026',
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must'
  ]);

  // 游戏领域加权词根
  private gameRoots = new Map([
    ['simulator', 5],
    ['tycoon', 5],
    ['obby', 4],
    ['tower', 4],
    ['defense', 4],
    ['anime', 3],
    ['battle', 3],
    ['battlegrounds', 3],
    ['rpg', 3],
    ['survival', 3],
    ['shooter', 3],
    ['horror', 3],
    ['idle', 2],
    ['clicker', 2],
    ['farm', 2],
    ['driving', 2],
    ['racing', 2],
    ['strategy', 2],
    ['co-op', 2],
    ['pvp', 2]
  ]);

  // 颜色词列表
  private colorWords = new Set([
    'black', 'white', 'red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'brown', 'gray', 'grey'
  ]);

  // 商品相关词
  private productWords = new Set([
    'merch', 'shirt', 'shirts', 'pants', 'hat', 'hats', 'shirt', 'shirts', 'jacket', 'jackets', 'shoe', 'shoes'
  ]);

  // 年份词模式
  private yearPattern = /^\d{4}$/;

  async analyzeTokens(tokens: string[]): Promise<void> {
    this.logger.log('开始分析关键词');

    // 提取 n-grams
    const ngrams = this.extractNGrams(tokens);

    // 过滤和打分
    const filteredTokens = this.filterAndScoreTokens(ngrams);

    for (const { token, score } of filteredTokens) {
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
              novelty_score: ((existingWord.recent_count + 1) / (existingWord.total_count + 1)) * score
            }
          });
        } else {
          // 创建新词
          await this.prisma.newWord.create({
            data: {
              token,
              novelty_score: 1.0 * score,
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

  // 提取 n-grams (unigram, bigram, trigram)
  private extractNGrams(tokens: string[]): string[] {
    const ngrams: string[] = [];

    // Unigrams
    ngrams.push(...tokens);

    // Bigrams
    for (let i = 0; i < tokens.length - 1; i++) {
      ngrams.push(`${tokens[i]} ${tokens[i + 1]}`);
    }

    // Trigrams
    for (let i = 0; i < tokens.length - 2; i++) {
      ngrams.push(`${tokens[i]} ${tokens[i + 1]} ${tokens[i + 2]}`);
    }

    return ngrams;
  }

  // 过滤和打分
  private filterAndScoreTokens(tokens: string[]): { token: string; score: number }[] {
    const frequencyMap = new Map<string, number>();

    // 计算频率
    for (const token of tokens) {
      frequencyMap.set(token, (frequencyMap.get(token) || 0) + 1);
    }

    return Array.from(frequencyMap.entries())
      .map(([token, frequency]) => {
        if (!this.isValidToken(token, frequency)) {
          return null;
        }

        const score = this.calculateTokenScore(token, frequency);
        return { token, score };
      })
      .filter((item): item is { token: string; score: number } => item !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, 200); // 只保留前 200 个
  }

  // 检查 token 是否有效
  private isValidToken(token: string, frequency: number): boolean {
    // 过滤长度小于 3 的 token
    if (token.length < 3) {
      return false;
    }

    // 过滤只出现 1 次的弱词
    if (frequency < 2) {
      return false;
    }

    // 过滤纯数字
    if (/^\d+$/.test(token)) {
      return false;
    }

    // 过滤年份
    if (this.yearPattern.test(token)) {
      return false;
    }

    // 过滤包含停用词的 token
    const words = token.split(' ');
    if (words.some(word => this.stopWords.has(word))) {
      return false;
    }

    // 过滤纯颜色词
    if (words.some(word => this.colorWords.has(word)) && words.length === 1) {
      return false;
    }

    // 过滤商品相关词
    if (words.some(word => this.productWords.has(word))) {
      return false;
    }

    return true;
  }

  // 计算 token 分数
  private calculateTokenScore(token: string, frequency: number): number {
    let score = frequency;

    // 词长加分
    const wordCount = token.split(' ').length;
    if (wordCount === 2) {
      score *= 1.5; // bigram 加分
    } else if (wordCount === 3) {
      score *= 2.0; // trigram 加分
    }

    // 游戏领域加权
    const words = token.toLowerCase().split(' ');
    for (const word of words) {
      for (const [root, weight] of this.gameRoots.entries()) {
        if (word.includes(root)) {
          score *= weight;
          break;
        }
      }
    }

    return score;
  }
}
