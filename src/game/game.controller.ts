import { Controller, Get } from '@nestjs/common';

@Controller('games')
export class GameController {
  @Get()
  getGames() {
    return [
      { id: 1, name: 'Test Game 1', platform: 'steam' },
      { id: 2, name: 'Test Game 2', platform: 'roblox' },
    ];
  }
}
