import { Injectable, Logger } from '@nestjs/common';
import { GameService } from '../game/game.service';

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);

  constructor(private readonly gameService: GameService) {}

  async scrapeAndSaveGames() {
    const scrapedGames = await this.fakeScrape();
    for (const game of scrapedGames) {
      await this.gameService.createGame({ name: game.name });
    }
    this.logger.log(`Saved ${scrapedGames.length} games to database`);
  }

  // 模拟抓取逻辑，可以替换成真实抓取
  private async fakeScrape() {
    return [
      { name: 'Space Shooter' },
      { name: 'Puzzle Master' },
      { name: 'Racing Cars' },
      { name: 'Adventure Quest' },
      { name: 'Tower Defense' },
    ];
  }
}
