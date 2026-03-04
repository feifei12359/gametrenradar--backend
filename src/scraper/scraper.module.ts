import { Module } from '@nestjs/common';
import { ScraperService } from './scraper.service';
import { GameModule } from '../game/game.module';

@Module({
  imports: [GameModule],
  providers: [ScraperService],
  exports: [ScraperService],
})
export class ScraperModule {}
