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

  async createGame(data: { id: number; name: string; platform: string }) {
    return prisma.game.create({ data });
  }

  async deleteGame(id: number) {
    return prisma.game.delete({ where: { id } });
  }

  async fetchRobloxGames() {
    try {
      const res = await axios.get('https://www.roblox.com/games');
      const games = this.parseGamesFromHTML(res.data, 'roblox');
      for (const g of games) {
        await prisma.game.upsert({
          where: { id: g.id },
          update: g,
          create: g,
        });
      }
      this.logger.log(`✅ Roblox 数据抓取完成，数量: ${games.length}`);
    } catch (err) {
      this.logger.error('抓取 Roblox 错误', err);
    }
  }

  async fetchSteamGames() {
    try {
      const res = await axios.get('https://store.steampowered.com/search/?filter=popular');
      const games = this.parseGamesFromHTML(res.data, 'steam');
      for (const g of games) {
        await prisma.game.upsert({
          where: { id: g.id },
          update: g,
          create: g,
        });
      }
      this.logger.log(`✅ Steam 数据抓取完成，数量: ${games.length}`);
    } catch (err) {
      this.logger.error('抓取 Steam 错误', err);
    }
  }

  async fetchIndieGames() {
    try {
      const res = await axios.get('https://indiegamewebsite.example.com'); // 替换真实网站
      const games = this.parseGamesFromHTML(res.data, 'indie');
      for (const g of games) {
        await prisma.game.upsert({
          where: { id: g.id },
          update: g,
          create: g,
        });
      }
      this.logger.log(`✅ Indie 数据抓取完成，数量: ${games.length}`);
    } catch (err) {
      this.logger.error('抓取 Indie 错误', err);
    }
  }

  parseGamesFromHTML(html: string, platform: string) {
    // ⚡ 简单示例，实际需要解析 HTML
    return [
      { id: 1, name: `${platform} Game 1`, platform },
      { id: 2, name: `${platform} Game 2`, platform },
    ];
  }
}
