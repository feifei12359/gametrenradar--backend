import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';
import * as cron from 'node-cron';

const prisma = new PrismaClient();

@Injectable()
export class GameService {
  private readonly logger = new Logger(GameService.name);

  constructor() {
    // 每天凌晨抓取一次趋势
    cron.schedule('0 0 * * *', () => {
      this.logger.log('自动抓取趋势任务启动');
      this.fetchAndStoreTrends('exploding');
      this.fetchAndStoreTrends('early');
    });
  }

  async getGames() {
    return prisma.game.findMany();
  }

  async getAllGames() {
    return prisma.game.findMany();
  }

  async createGame(data: { name: string }) {
    return prisma.game.create({
      data: {
        name: data.name
      }
    });
  }

  async deleteGame(id: number) {
    return prisma.game.delete({ where: { id } });
  }

  async getTrendsByCategory(category: string) {
    const trends = await prisma.trend.findMany({ where: { category } });
    if (trends.length === 0) {
      // 没有数据就抓取一次
      return this.fetchAndStoreTrends(category);
    }
    return trends;
  }

  async getAllTrends() {
    return prisma.trend.findMany();
  }

  async fetchAndStoreTrends(category: string) {
    const trends: any[] = [];
    try {
      // 示例：抓取 Steam 新游戏
      const steamResp = await fetch('https://store.steampowered.com/api/featuredcategories/');
      const steamData = await steamResp.json() as any;
      steamData?.top_sellers?.items?.forEach((item: any) => {
        trends.push({
          word: item.name,
          category,
          prediction_score: Math.floor(Math.random() * 100),
          growth_rate: Math.random(),
          acceleration: Math.random(),
          platform_score: Math.floor(Math.random() * 100),
          ai_score: Math.floor(Math.random() * 100),
          first_seen_at: new Date(),
          platforms: ['Steam'],
        });
      });

      // 示例：抓取 Roblox 新游戏
      const robloxResp = await fetch('https://games.roblox.com/v1/games/list?sortOrder=Asc&limit=10');
      const robloxData = await robloxResp.json() as any;
      robloxData.data?.forEach((game: any) => {
        trends.push({
          word: game.name,
          category,
          prediction_score: Math.floor(Math.random() * 100),
          growth_rate: Math.random(),
          acceleration: Math.random(),
          platform_score: Math.floor(Math.random() * 100),
          ai_score: Math.floor(Math.random() * 100),
          first_seen_at: new Date(),
          platforms: ['Roblox'],
        });
      });

      // 保存到数据库
      for (const t of trends) {
        let game = await prisma.game.findFirst({ where: { name: t.word } });
        if (!game) {
          game = await prisma.game.create({ data: { name: t.word } });
        }

        await prisma.trend.create({
          data: {
            word: t.word,
            prediction_score: t.prediction_score,
            growth_rate: t.growth_rate,
            acceleration: t.acceleration,
            platform_score: t.platform_score,
            ai_score: t.ai_score,
            first_seen_at: t.first_seen_at,
            platforms: t.platforms,
            category: t.category,
            gameId: game.id,
          },
        });
      }

      this.logger.log(`Fetched and stored ${trends.length} ${category} trends`);
      return trends;
    } catch (err) {
      this.logger.error(`Error fetching ${category} trends`, err);
      return [];
    }
  }

  // 每日抓取任务
  async dailyJob() {
    await this.fetchAndStoreTrends('exploding');
    await this.fetchAndStoreTrends('early');
  }

}
