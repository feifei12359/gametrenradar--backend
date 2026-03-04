import { Controller, Get, Post } from '@nestjs/common';
import { GameService } from './game.service';

@Controller('api')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Get('games')
  async getGames() {
    return this.gameService.getGames();
  }

  @Get('trend/exploding')
  async getExplodingTrends() {
    return this.gameService.getTrendsByCategory('exploding');
  }

  @Get('trend/early')
  async getEarlyTrends() {
    return this.gameService.getTrendsByCategory('early');
  }

  @Get('trend/all')
  async getAllTrends() {
    return this.gameService.getAllTrends();
  }

  @Get('new-words')
  async getNewWords() {
    return { items: [] };
  }

  @Post('daily-job')
  async runDailyJob() {
    await this.gameService.dailyJob();
    return { ok: true, message: '完整检测已运行', timestamp: new Date() };
  }

  @Get('health')
  async health() {
    return { ok: true, time: new Date() };
  }

}
