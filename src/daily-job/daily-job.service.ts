import { Injectable, Logger } from '@nestjs/common';
import { GameService } from '../game/game.service';

@Injectable()
export class DailyJobService {
  private readonly logger = new Logger(DailyJobService.name);

  constructor(private readonly gameService: GameService) {}

  async runDailyJob() {
    const games = await this.gameService.getAllGames();
    for (const game of games) {
      // 示例逻辑：删除名字包含 "test" 的游戏
      if (game.name.toLowerCase().includes('test')) {
        await this.gameService.deleteGame(game.id);
        this.logger.log(`Deleted game: ${game.name}`);
      }
    }
    this.logger.log('Daily job finished');
  }
}
