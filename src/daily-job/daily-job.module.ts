import { Module } from '@nestjs/common';
import { DailyJobService } from './daily-job.service';
import { DailyJobController } from './daily-job.controller';
import { GameModule } from '../game/game.module';

@Module({
  imports: [GameModule],
  controllers: [DailyJobController],
  providers: [DailyJobService],
  exports: [DailyJobService],
})
export class DailyJobModule { }
