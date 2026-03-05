import { Controller, Get } from '@nestjs/common';
import { GameService } from './game.service';

@Controller('api/games')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Get()
  async getGames() {
    return this.gameService.getAllGames();
  }
}
