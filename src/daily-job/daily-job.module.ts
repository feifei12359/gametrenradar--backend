import { Module } from '@nestjs/common';
import { DailyJobService } from './daily-job.service';
import { GameModule } from '../game/game.module';

@Module({
  imports: [GameModule],
  providers: [DailyJobService],
  exports: [DailyJobService],
})
export class DailyJobModule {}
