import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

@Injectable()
export class GameService {

  private readonly logger = new Logger(GameService.name);

  async getAllGames() {
    return prisma.game.findMany();
  }

  async createGame(data: { name: string }) {
    return prisma.game.create({ 
      data: {
        name: data.name,
        platform: 'unknown',
        trendType: 'early',
        firstSeenAt: new Date()
      }
    });
  }

  async deleteGame(id: number) {
    return prisma.game.delete({ where: { id } });
  }

  async getExplodingTrends() {
    return prisma.trend.findMany({ where: { trendType: 'exploding' } });
  }

  async getEarlyTrends() {
    return prisma.trend.findMany({ where: { trendType: 'early' } });
  }

  async getAllTrends() {
    return prisma.trend.findMany();
  }

  async getNewWords() {
    const items = await prisma.newWord.findMany();
    return { items };
  }

  // 每日抓取任务
  async dailyJob() {
    await this.scrapeRoblox();
    await this.scrapeSteam();
    await this.scrapeIndie();
  }

  private async scrapeRoblox() {
    try {
      const res = await axios.get('https://www.roblox.com/games'); // 示例 URL
      const games = this.parseGamesFromHTML(res.data, 'roblox');
      for (const g of games) {
        await prisma.game.upsert({
          where: { name: g.name },
          update: g,
          create: g,
        });
      }
      this.logger.log(`抓取 Roblox 游戏: ${games.length} 条`);
    } catch (err) {
      this.logger.error('抓取 Roblox 错误', err);
    }
  }

  private async scrapeSteam() {
    try {
      const res = await axios.get('https://store.steampowered.com/search/?filter=popular'); // 示例 URL
      const games = this.parseGamesFromHTML(res.data, 'steam');
      for (const g of games) {
        await prisma.game.upsert({
          where: { name: g.name },
          update: g,
          create: g,
        });
      }
      this.logger.log(`抓取 Steam 游戏: ${games.length} 条`);
    } catch (err) {
      this.logger.error('抓取 Steam 错误', err);
    }
  }

  private async scrapeIndie() {
    try {
      const res = await axios.get('https://www.indiedb.com/games'); // 示例 URL
      const games = this.parseGamesFromHTML(res.data, 'indie');
      for (const g of games) {
        await prisma.game.upsert({
          where: { name: g.name },
          update: g,
          create: g,
        });
      }
      this.logger.log(`抓取 Indie 游戏: ${games.length} 条`);
    } catch (err) {
      this.logger.error('抓取 Indie 错误', err);
    }
  }

  private parseGamesFromHTML(html: string, platform: string) {
    // 这里 AI 可以帮你解析 HTML
    // 示例返回格式：
    return [
      { name: `${platform} Game 1`, platform, trendType: 'exploding', firstSeenAt: new Date() },
      { name: `${platform} Game 2`, platform, trendType: 'exploding', firstSeenAt: new Date() },
    ];
  }

}
