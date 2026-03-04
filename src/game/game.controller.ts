import { Controller, Get } from '@nestjs/common';
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
}
