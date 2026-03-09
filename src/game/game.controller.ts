// backend/src/game/game.controller.ts
import { Controller, Get } from '@nestjs/common';
import { GameService } from './game.service';

@Controller('games')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Get() getGames() {
    return this.gameService.getGames();
  }
}
