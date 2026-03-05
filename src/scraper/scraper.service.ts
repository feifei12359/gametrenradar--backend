import { Injectable, Logger } from '@nestjs/common';
import { GameService } from '../game/game.service';

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);
  constructor(private readonly gameService: GameService) { }

  async scrapeAndSaveGames() {
    const scrapedGames = await this.fakeScrape();
    for (const game of scrapedGames) {
      await this.gameService.createGame({
        id: game.id,
        name: game.name,
        platform: game.platform
      });
    }
    this.logger.log(`Saved ${scrapedGames.length} games to database`);
  }

  // 模拟抓取逻辑，可以替换成真实抓取
  private async fakeScrape() {
    return [
      { id: 1, name: 'Space Shooter', platform: 'steam' },
      { id: 2, name: 'Puzzle Master', platform: 'steam' },
      { id: 3, name: 'Racing Cars', platform: 'steam' },
      { id: 4, name: 'Adventure Quest', platform: 'steam' },
      { id: 5, name: 'Tower Defense', platform: 'steam' },
    ];
  }
}
