import { Controller, Get } from '@nestjs/common';

@Controller('games')
export class GameController {
  @Get()
  async getGames() {
    // 返回模拟数据
    return [
      { id: 1, name: 'Test Game 1', platform: 'steam' },
      { id: 2, name: 'Test Game 2', platform: 'roblox' },
    ];
  }
}
