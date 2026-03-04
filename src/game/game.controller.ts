import { Controller, Get, Post } from '@nestjs/common';
import { GameService } from './game.service';

@Controller('api')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Get('games')
  async getAllGames() {
    return this.gameService.getAllGames();
  }

  @Get('trend/exploding')
  async getExplodingTrends() {
    return this.gameService.getExplodingTrends();
  }

  @Get('trend/early')
  async getEarlyTrends() {
    return this.gameService.getEarlyTrends();
  }

  @Get('trend/all')
  async getAllTrends() {
    return this.gameService.getAllTrends();
  }

  @Get('new-words')
  async getNewWords() {
    return this.gameService.getNewWords();
  }

  @Post('daily-job')
  async runDailyJob() {
    await this.gameService.dailyJob();
    return { ok: true, message: '完整检测已运行', timestamp: new Date() };
  }

}
